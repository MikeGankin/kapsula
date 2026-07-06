import {hostReactAppReady, reactDomObserver} from "../utils/utils.js";
import {animateHero} from "./kapsula/animateHero.js";
import {setupHeaderUi} from "./kapsula/setupHeaderUi.js";
import {setupScreenFlow} from "./kapsula/setupScreenFlow.js";

const LOGO_HOST_SELECTOR = 'div[class*="HeaderMenuBar_container"] > div';

export default async function kapsula() {
  await hostReactAppReady();

  const domWatcher = reactDomObserver();
  const menuHost = await domWatcher.waitElement(LOGO_HOST_SELECTOR);
  setupHeaderUi(menuHost);

  animateHero();
  setupScreenFlow();
}
