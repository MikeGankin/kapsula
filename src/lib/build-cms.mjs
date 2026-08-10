import fs from "node:fs";
import path from "node:path";
import {build} from "vite";

import {
  cleanDir,
  ensureDir,
  existsFile,
  processMarkupWithPosthtml,
  r,
  readBlocks,
} from "./_utils.mjs";

const ORDER_FILE = r("src/order.json");

const MARKUP_DIR = r("src/markup");
const STYLES_DIR = r("src/styles");
const SCRIPTS_DIR = r("src/scripts");

const OUT_DIR = r("@CMS");

// ---------- CSS (from styles/<key>.scss|css) ----------

async function bundleCssInline(absCssPath) {
  const rel = `/${path.relative(process.cwd(), absCssPath).replaceAll("\\", "/")}`;

  const V_ID = "virtual:cms-css";
  const R_ID = `\0${V_ID}`;

  const virtualCss = {
    name: "cms-virtual-css",
    enforce: "pre",
    // `null` — контракт Rollup: «этот хук модуль не обслуживает, спроси следующий».
    // Неявный undefined тот же смысл не выражает и ломает consistent-return.
    resolveId(id) {
      return id === V_ID ? R_ID : null;
    },
    load(id) {
      return id === R_ID ? `import ${JSON.stringify(rel)};` : null;
    },
  };

  const res = await build({
    logLevel: "silent",
    plugins: [virtualCss],
    build: {
      write: false,
      // Vite 8 собирает на rolldown и минифицирует через oxc; esbuild туда
      // больше не входит и требует отдельной установки.
      minify: "oxc",

      cssCodeSplit: true,
      rollupOptions: {input: V_ID},
    },
  });

  const cssParts = [];
  for (const out of Array.isArray(res) ? res : [res]) {
    for (const item of out.output) {
      if (item.type === "asset" && item.fileName.endsWith(".css")) {
        const css = String(item.source || "").trim();
        if (css) cssParts.push(css);
      }
    }
  }
  return cssParts.join("\n");
}

// ---------- JS (+ CSS extracted from JS imports) ----------

async function bundleJsInline(absJsPath) {
  const rel = `/${path.relative(process.cwd(), absJsPath).replaceAll("\\", "/")}`;

  const V_ID = "virtual:cms-js";
  const R_ID = `\0${V_ID}`;

  const virtualJs = {
    name: "cms-virtual-js",
    enforce: "pre",
    resolveId(id) {
      return id === V_ID ? R_ID : null;
    },
    load(id) {
      if (id !== R_ID) return null;

      /*
       * Контракт: scripts/<key>.js экспортирует default-функцию init().
       *
       * Ошибку самого init() гасим намеренно — упавший блок не должен ронять
       * скрипты хост-сайта. А вот несоответствие контракту (default — не
       * функция) логируем громко: молчаливый пропуск означал блок, который
       * доехал до CMS и просто ничего не делает.
       */
      return `
import init from ${JSON.stringify(rel)};
if (typeof init === "function") {
  try { init(); } catch (e) { console.warn(e); }
} else {
  console.error(${JSON.stringify(`[kapsula] ${path.basename(absJsPath)}: default export is not a function`)});
}
      `.trim();
    },
  };

  const res = await build({
    logLevel: "silent",
    plugins: [virtualJs],

    build: {
      write: false,
      minify: "oxc",
      cssCodeSplit: true,
      rollupOptions: {
        input: V_ID,
        // Формат iife обязателен: блок вставляется в CMS одним инлайновым
        // <script>, где ESM-синтаксис не выполнится. `inlineDynamicImports`
        // здесь больше не нужен — при одном входе rolldown и так не делит бандл.
        output: {format: "iife"},
      },
    },
  });

  let js = "";
  const cssParts = [];

  for (const out of Array.isArray(res) ? res : [res]) {
    for (const item of out.output) {
      if (item.type === "chunk" && item.isEntry) js = item.code.trim();
      if (item.type === "asset" && item.fileName.endsWith(".css")) {
        const css = String(item.source || "").trim();
        if (css) cssParts.push(css);
      }
    }
  }

  return {js, css: cssParts.join("\n")};
}

// ---------- block build ----------

async function buildBlock(key) {
  const htmlPath = path.join(MARKUP_DIR, `${key}.html`);
  if (!existsFile(htmlPath)) return null;

  const cssPathScss = path.join(STYLES_DIR, `${key}.scss`);
  const cssPathCss = path.join(STYLES_DIR, `${key}.css`);
  const jsPath = path.join(SCRIPTS_DIR, `${key}.js`);

  // приоритет: scss -> css
  const cssCandidates = [cssPathScss, cssPathCss];
  const cssPath = cssCandidates.find(existsFile) ?? null;

  /*
   * CSS и JS собираются независимо, поэтому идут параллельно: последовательно
   * это 124 мс на блок против 86 мс, и разница растёт линейно с числом блоков.
   * Разметка читается тут же — posthtml ждать незачем.
   */
  const [html, blockCss, jsBundle] = await Promise.all([
    processMarkupWithPosthtml(htmlPath),
    cssPath ? bundleCssInline(cssPath) : "",
    existsFile(jsPath) ? bundleJsInline(jsPath) : {js: "", css: ""},
  ]);

  const js = jsBundle.js || "";
  const jsCss = jsBundle.css || "";

  const parts = [];

  const mergedCss = [blockCss, jsCss].filter(Boolean).join("\n");
  if (mergedCss) parts.push(`<style>\n${mergedCss}\n</style>`);

  parts.push(html);

  if (js) parts.push(`<script>\n${js}\n</script>`);

  return `${parts.join("\n\n")}\n`;
}

// ---------- run ----------

async function run() {
  const blocks = readBlocks(ORDER_FILE);
  if (!blocks.length) {
    console.log("[CMS] order.json is empty");
    return;
  }

  /*
   * Сначала собираем всё в память и только потом трогаем @CMS.
   * Раньше каталог чистился первым делом, и падение сборки на любом блоке
   * оставляло разработчика без результата вообще: ни нового файла, ни
   * предыдущего, который ещё можно было отдать в CMS.
   */
  const built = [];

  for (const key of blocks) {
    const result = await buildBlock(key);

    if (!result) {
      console.log(`[CMS] skip "${key}" (no markup)`);
      continue;
    }

    built.push({key, html: result});
  }

  ensureDir(OUT_DIR);
  cleanDir(OUT_DIR);

  for (const {key, html} of built) {
    fs.writeFileSync(path.join(OUT_DIR, `${key}.html`), html);
    console.log(`[CMS] wrote @CMS/${key}.html`);
  }

  console.log("[CMS] done");
}

run().catch((e) => {
  console.error("[CMS] build failed:", e);
  process.exit(1);
});
