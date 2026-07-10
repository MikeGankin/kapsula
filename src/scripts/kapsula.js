import {defer, filter, from, merge, of, Subscription, switchMap} from "rxjs";
import {hostReactAppReady, reactDomObserver} from "../utils/utils.js";
import {animateHero} from "./kapsula/animateHero.js";
import {setupHeaderUi} from "./kapsula/setupHeaderUi.js";
import {setupScreenFlow} from "./kapsula/setupScreenFlow.js";

const DESKTOP_HEADER_HOST_SELECTOR = 'div[class*="HeaderMenuBar_container"] > div';
const MOBILE_HEADER_HOST_SELECTOR = 'div[class*="HeaderMobile_rightGroup__"]';
const ROOT_SELECTOR = "[data-kapsula-hero]";
let appSubscription = null;

function createHostReady$() {
  if (document.querySelector(ROOT_SELECTOR)) {
    return of(null);
  }

  return defer(() => from(hostReactAppReady("#__next > div", 100, 3000)));
}

export default function kapsula() {
  appSubscription?.unsubscribe();

  const lifecycle = new Subscription();
  const domWatcher = reactDomObserver();
  const rootCleanups = new Map();

  const destroyRoot = (rootNode) => {
    rootCleanups.get(rootNode)?.();
    rootCleanups.delete(rootNode);
  };

  try {
    setupHeaderUi();

    const headerEvents$ = merge(
      domWatcher.observeSelector$(DESKTOP_HEADER_HOST_SELECTOR),
      domWatcher.observeSelector$(MOBILE_HEADER_HOST_SELECTOR),
    ).pipe(
      filter((event) => event.type === "initialize" || event.type === "add"),
    );

    lifecycle.add(headerEvents$.subscribe({
      next: () => setupHeaderUi(),
      error: (error) => console.error("Kapsula header observer failed", error),
    }));
  } catch (error) {
    console.error("Kapsula header init failed", error);
  }

  const rootEvents$ = createHostReady$().pipe(
    switchMap(() => domWatcher.observeSelector$(ROOT_SELECTOR)),
  );

  lifecycle.add(rootEvents$.subscribe({
    next: (event) => {
      const rootNode = event.element;

      if (event.type === "remove") {
        destroyRoot(rootNode);
        return;
      }

      if (rootCleanups.has(rootNode)) {
        return;
      }

      try {
        const heroTimeline = animateHero(rootNode);
        const destroyScreenFlow = setupScreenFlow(rootNode);

        rootCleanups.set(rootNode, () => {
          heroTimeline?.kill();
          destroyScreenFlow?.();
        });
      } catch (error) {
        console.error("Kapsula root init failed", error);
      }
    },
    error: (error) => console.error("Kapsula root observer failed", error),
  }));

  lifecycle.add(() => {
    rootCleanups.forEach((destroy) => destroy());
    rootCleanups.clear();
  });

  appSubscription = lifecycle;
  return lifecycle;
}
