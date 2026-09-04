import {defer, from, of, Subscription, switchMap} from "rxjs";
import {hostReactAppReady, reactDomObserver} from "../utils/utils.js";
import {animateHero} from "./kapsula/features/hero/animateHero.js";
import {KAPSULA_ROOT_SELECTOR} from "./kapsula/shared/constants.js";
import {logError} from "./kapsula/shared/logger.js";
import {bindHeaderUi} from "./kapsula/features/header/setupHeaderUi.js";
import {setupScreenFlow} from "./kapsula/app/setupScreenFlow.js";

const ROOT_SELECTOR = KAPSULA_ROOT_SELECTOR;
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
        const unbindHeaderUi = bindHeaderUi(rootNode);
        const destroyScreenFlow = setupScreenFlow(rootNode);

        rootCleanups.set(rootNode, () => {
          heroTimeline?.kill();
          unbindHeaderUi();
          destroyScreenFlow?.();
        });
      } catch (error) {
        logError("инициализация корневого узла не удалась", error);
      }
    },
    error: (error) => logError("наблюдатель за корневым узлом упал", error),
  }));

  lifecycle.add(() => {
    rootCleanups.forEach((destroy) => destroy());
    rootCleanups.clear();
  });

  appSubscription = lifecycle;
  return lifecycle;
}
