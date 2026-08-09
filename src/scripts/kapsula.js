import {defer, filter, from, merge, of, Subscription, switchMap} from "rxjs";
import {hostReactAppReady, reactDomObserver} from "../utils/utils.js";
import {animateHero} from "./kapsula/animateHero.js";
import {HEADER_SELECTORS, KAPSULA_ROOT_SELECTOR, ROUTE_ATTRIBUTE} from "./kapsula/constants.js";
import {logError} from "./kapsula/logger.js";
import {createHeaderUi} from "./kapsula/setupHeaderUi.js";
import {setupScreenFlow} from "./kapsula/setupScreenFlow.js";

const DESKTOP_HEADER_HOST_SELECTOR = HEADER_SELECTORS.desktopHost;
const MOBILE_HEADER_HOST_SELECTOR = HEADER_SELECTORS.mobileHost;
const ROOT_SELECTOR = KAPSULA_ROOT_SELECTOR;
const TARGET_ROUTES = [
  "/elite-service/constructor/",
  "/monkey/",
  "preview"
];
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
  const headerUi = createHeaderUi();
  let headerSubscription = null;
  let isHeaderRouteActive = false;

  const disableHeaderUi = () => {
    headerSubscription?.unsubscribe();
    headerSubscription = null;
    headerUi.cleanup();
    document.body?.removeAttribute(ROUTE_ATTRIBUTE);
  };

  const enableHeaderUi = () => {
    document.body?.setAttribute(ROUTE_ATTRIBUTE, "");
    headerUi.setup();

    if (headerSubscription) {
      return;
    }

    headerSubscription = merge(
      domWatcher.observeSelector$(DESKTOP_HEADER_HOST_SELECTOR),
      domWatcher.observeSelector$(MOBILE_HEADER_HOST_SELECTOR),
    ).pipe(
      filter((event) => event.type === "initialize" || event.type === "add"),
    ).subscribe({
      next: () => headerUi.setup(),
      error: (error) => logError("наблюдатель за хедером упал", error),
    });
  };

  const handleRouteChange = ({path = ""} = {}) => {
    const shouldActivateHeader = TARGET_ROUTES.some((route) => path.includes(route));

    if (shouldActivateHeader === isHeaderRouteActive) {
      return;
    }

    isHeaderRouteActive = shouldActivateHeader;

    if (shouldActivateHeader) {
      enableHeaderUi();
      return;
    }

    disableHeaderUi();
  };

  const destroyRoot = (rootNode) => {
    rootCleanups.get(rootNode)?.();
    rootCleanups.delete(rootNode);
  };

  try {
    handleRouteChange({path: window.location.pathname});

    const hasRouteBus = (
      typeof CoralRouteBus !== "undefined" &&
      typeof CoralRouteBus.subscribe === "function"
    );
    const routeSubscription = hasRouteBus
      ? CoralRouteBus.subscribe(handleRouteChange)
      : null;

    if (
      typeof routeSubscription === "function" ||
      typeof routeSubscription?.unsubscribe === "function"
    ) {
      lifecycle.add(routeSubscription);
    } else if (!hasRouteBus) {
      logError("шина маршрутов CoralRouteBus недоступна");
    }

    lifecycle.add(disableHeaderUi);
  } catch (error) {
    logError("инициализация хедера не удалась", error);
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
