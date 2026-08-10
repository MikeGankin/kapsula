// Пути с явным `/index.js`: проект на нативном ESM, где расширение обязательно,
// а безрасширочный импорт каталога чинит только резолвер сборщика.
import "./styles/index.js"; // подхватывает styles watcher
import parts from "./markup/index.js";
import initsMap from "./scripts/index.js";

import {setupLocalCdnAssetRewrite} from "./lib/rewriteAssetsDev.js";

const CONTAINER_ID = "monkey-app";
const FLAG = "monkeyMounted";
const CDN_BASE = "http://localhost:3001";

let teardownAssetRewrite = null;

if (import.meta.env.DEV) {
  await import("./scripts/kapsula/hotelsConfig.dev.js");
}

function mount(container, {force = false} = {}) {
  if (!force && container.dataset[FLAG] === "1") return;

  teardownAssetRewrite?.();
  teardownAssetRewrite = null;

  if (force) {
    container.innerHTML = "";
    delete container.dataset[FLAG];
  }

  for (const part of parts) {
    if (typeof part?.html === "string" && part.html.trim()) {
      container.insertAdjacentHTML("beforeend", part.html);
    }
  }

  container.dataset[FLAG] = "1";
  document.documentElement.style.setProperty("--cdn-prefix", CDN_BASE);
  teardownAssetRewrite = setupLocalCdnAssetRewrite({
    root: container,
    cdnBase: CDN_BASE,
    enabled: true, // dev-only (потому что этот код будет жить только в dev bundle)
  });

  for (const part of parts) {
    const init = part?.key ? initsMap.get(part.key) : null;
    if (typeof init === "function") init(container);
  }
}

(() => {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  mount(container);
})();

if (import.meta.hot) {
  // Пути обязаны совпадать с импортами выше — иначе Vite примет обновление
  // другого модуля, и HMR молча перестанет перерисовывать блок.
  const hotDeps = ["./markup/index.js", "./scripts/index.js", "./styles/index.js"];

  import.meta.hot.accept(hotDeps, ([nextMarkupModule, nextScriptsModule]) => {
    const container = document.getElementById(CONTAINER_ID);

    if (!container) {
      return;
    }

    if (nextMarkupModule?.default) {
      parts.length = 0;
      parts.push(...nextMarkupModule.default);
    }

    if (nextScriptsModule?.default instanceof Map) {
      initsMap.clear();
      nextScriptsModule.default.forEach((value, key) => {
        initsMap.set(key, value);
      });
    }

    mount(container, {force: true});
  });

  import.meta.hot.dispose(() => {
    teardownAssetRewrite?.();
    teardownAssetRewrite = null;
  });
}
