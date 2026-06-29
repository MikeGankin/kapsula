import path from "node:path";
import chokidar from "chokidar";

import {
  absEq,
  ensureDir,
  existsFile,
  processMarkupWithPosthtml,
  r,
  readBlocks,
  writeIfChanged,
} from "./_utils.mjs";

const WATCH = process.argv.includes("--watch");

const ORDER_FILE = r("src/order.json");

const MARKUP_DIR = r("src/markup");
const OUT_FILE = path.join(MARKUP_DIR, "index.js");

async function generate() {
  ensureDir(MARKUP_DIR);

  const blocks = readBlocks(ORDER_FILE);
  const entries = [];

  for (const key of blocks) {
    const htmlFile = path.join(MARKUP_DIR, `${key}.html`);
    if (!existsFile(htmlFile)) continue;

    const html = await processMarkupWithPosthtml(htmlFile);
    entries.push({key, html});
  }

  if (entries.length === 0) {
    writeIfChanged(OUT_FILE, "export default [];\n", "[gen-markup] updated (empty)");
    return;
  }

  const serializedEntries = entries
    .map(({key, html}) => `{ key: ${JSON.stringify(key)}, html: ${JSON.stringify(html)} }`)
    .join(", ");

  writeIfChanged(
    OUT_FILE,
    `export default [${serializedEntries}];\n`,
    "[gen-markup] updated"
  );
}

// once
generate().catch((error) => {
  console.error("[gen-markup] failed:", error);
  process.exit(1);
});

// watch
if (WATCH) {
  let t = null;
  const schedule = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      generate().catch((error) => {
        console.error("[gen-markup] failed:", error);
      });
    }, 80);
  };

  chokidar
    .watch([ORDER_FILE, MARKUP_DIR], {
      ignoreInitial: true,
      awaitWriteFinish: {stabilityThreshold: 120, pollInterval: 30},
    })
    .on("change", (filePath) => {
      if (absEq(filePath, OUT_FILE)) return; // анти-луп
      schedule();
    })
    .on("add", schedule)
    .on("unlink", schedule)
    .on("addDir", schedule)
    .on("unlinkDir", schedule);
}
