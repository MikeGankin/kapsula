const DESKTOP_MEDIA_QUERY = "(min-width: 993px)";

export function setupBackgroundVideo(rootNode) {
  const videoNode = rootNode?.querySelector?.("[data-kapsula-background-video]");

  if (!(videoNode instanceof HTMLVideoElement)) return null;

  const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY);
  const videoSrc = videoNode.dataset.src;

  const handleCanPlay = () => {
    videoNode.dataset.ready = "true";

    if (rootNode.dataset.screen !== "form") {
      videoNode.play().catch(() => {});
    }
  };

  const handleScreenChange = (event) => {
    if (event.detail?.screenKey === "form") {
      videoNode.pause();
      return;
    }

    if (videoNode.dataset.ready === "true") {
      videoNode.play().catch(() => {});
    }
  };

  const syncVideo = () => {
    if (desktopMedia.matches) {
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
  desktopMedia.addEventListener("change", syncVideo);
  syncVideo();

  return () => {
    videoNode.removeEventListener("canplay", handleCanPlay);
    rootNode.removeEventListener("kapsula:screen-change", handleScreenChange);
    desktopMedia.removeEventListener("change", syncVideo);
    videoNode.pause();
    delete videoNode.dataset.ready;
    videoNode.removeAttribute("src");
    videoNode.load();
  };
}
