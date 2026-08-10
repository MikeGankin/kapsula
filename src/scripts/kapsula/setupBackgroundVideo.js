import {isDesktopViewport, observeDesktopViewport} from "./mediaQuery.js";

export function setupBackgroundVideo(rootNode) {
  const videoNode = rootNode?.querySelector?.("[data-kapsula-background-video]");

  if (!(videoNode instanceof HTMLVideoElement)) return null;

  const videoSrc = videoNode.dataset.src;

  /**
   * Единственное место, решающее, должно ли видео играть.
   * Под формой ролик не нужен (её фон белый), на мобильном источник вообще
   * не грузится — раньше эти условия были разнесены по обработчикам,
   * и событие `canplay` могло запустить видео вопреки им.
   */
  const shouldPlay = () => (
    isDesktopViewport() &&
    rootNode.dataset.screen !== "form" &&
    videoNode.dataset.ready === "true"
  );

  const syncPlayback = () => {
    if (shouldPlay()) {
      videoNode.play().catch(() => {});
      return;
    }

    videoNode.pause();
  };

  const handleCanPlay = () => {
    videoNode.dataset.ready = "true";
    syncPlayback();
  };

  const handleScreenChange = () => {
    // `dataset.screen` уже обновлён к моменту события — решение принимает
    // shouldPlay(), чтобы условия не расходились между обработчиками.
    syncPlayback();
  };

  const syncVideo = () => {
    if (isDesktopViewport()) {
      if (!videoNode.src && videoSrc) {
        videoNode.src = videoSrc;
        videoNode.load();
      }

      if (videoNode.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        handleCanPlay();
      }

      return;
    }

    videoNode.pause();
    delete videoNode.dataset.ready;
    videoNode.removeAttribute("src");
    videoNode.load();
  };

  videoNode.addEventListener("canplay", handleCanPlay);
  rootNode.addEventListener("kapsula:screen-change", handleScreenChange);
  const unobserveDesktopViewport = observeDesktopViewport(syncVideo);
  syncVideo();

  return () => {
    videoNode.removeEventListener("canplay", handleCanPlay);
    rootNode.removeEventListener("kapsula:screen-change", handleScreenChange);
    unobserveDesktopViewport();
    videoNode.pause();
    delete videoNode.dataset.ready;
    videoNode.removeAttribute("src");
    videoNode.load();
  };
}
