import {reactDomObserver} from "../utils/utils.js";
import {animateHero} from "./kapsula/animateHero.js";
import {setupHeaderUi} from "./kapsula/setupHeaderUi.js";
import {setupScreenFlow} from "./kapsula/setupScreenFlow.js";
import {filter} from "rxjs";

const DESKTOP_HEADER_HOST_SELECTOR = 'div[class*="HeaderMenuBar_container"] > div';
const MOBILE_HEADER_HOST_SELECTOR = 'div[class*="HeaderMobile_rightGroup__"]';
const ROOT_SELECTOR = "[data-kapsula-hero]";

function getKapsulaRoots() {
  return Array.from(document.querySelectorAll(ROOT_SELECTOR));
}

function pickKapsulaRoot() {
  const roots = getKapsulaRoots();

  return roots.find((root) => root.dataset.transitionBound !== "1") ?? roots[roots.length - 1] ?? null;
}

export default async function kapsula() {
  const domWatcher = reactDomObserver();
  try {
    await Promise.any([
      domWatcher.waitElement(DESKTOP_HEADER_HOST_SELECTOR, {timeoutMs: 3000}),
      domWatcher.waitElement(MOBILE_HEADER_HOST_SELECTOR, {timeoutMs: 3000}),
    ]);
  } catch {
  }

  try {
    setupHeaderUi();
    domWatcher.observeSelector$(DESKTOP_HEADER_HOST_SELECTOR).pipe(
      filter((event) => event.type === "add"),
    ).subscribe(() => setupHeaderUi());
    domWatcher.observeSelector$(MOBILE_HEADER_HOST_SELECTOR).pipe(
      filter((event) => event.type === "add"),
    ).subscribe(() => setupHeaderUi());
  } catch (error) {
    console.error("Kapsula header init failed", error);
  }

  const rootNode = pickKapsulaRoot();

  animateHero(rootNode);
  setupScreenFlow(rootNode);
}
