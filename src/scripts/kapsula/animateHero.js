import {gsap} from "gsap";
import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {getMotionDuration, getMotionOffset, prefersReducedMotion} from "./motionPreferences.js";

export function animateHero(rootNode = document) {
  const {selectors, initial, timeline: timelineConfig} = KAPSULA_ANIMATION.heroReveal;

  const hero = rootNode?.matches?.(selectors.hero)
    ? rootNode
    : rootNode?.querySelector?.(selectors.hero) ?? document.querySelector(selectors.hero);
  // Возвращаем null, а не undefined: вызывающий код хранит таймлайн
  // (`const heroTimeline = animateHero(...)`), и «анимации нет» должно быть
  // явным значением, а не побочным эффектом раннего выхода.
  if (!hero || hero.dataset.animated === "1") return null;

  const content = hero.querySelector(selectors.content);
  const eyebrow = hero.querySelector(selectors.eyebrow);
  const title = hero.querySelector(selectors.title);
  const subtitle = hero.querySelector(selectors.subtitle);
  const startButton = hero.querySelector(selectors.startButton);
  const backdrop = hero.querySelector(selectors.backdrop);

  if (!content || !eyebrow || !title || !subtitle || !startButton || !backdrop) return null;

  hero.dataset.animated = "1";

  gsap.set([eyebrow, title, subtitle, startButton], {
    autoAlpha: 0,
    y: getMotionOffset(initial.contentY),
  });

  gsap.set(backdrop, {
    scale: prefersReducedMotion() ? 1 : initial.backdropScale,
  });

  const timeline = gsap.timeline({
    defaults: timelineConfig.defaults,
  });

  return timeline
    .to(backdrop, {
      ...timelineConfig.backdrop,
      duration: getMotionDuration(timelineConfig.backdrop.duration),
    })
    .to(eyebrow, {
      autoAlpha: timelineConfig.eyebrow.autoAlpha,
      y: timelineConfig.eyebrow.y,
      duration: getMotionDuration(timelineConfig.eyebrow.duration),
    }, timelineConfig.eyebrow.at)
    .to(title, {
      autoAlpha: timelineConfig.title.autoAlpha,
      y: timelineConfig.title.y,
      duration: getMotionDuration(timelineConfig.title.duration),
    }, timelineConfig.title.at)
    .to(subtitle, {
      autoAlpha: timelineConfig.subtitle.autoAlpha,
      y: timelineConfig.subtitle.y,
      duration: getMotionDuration(timelineConfig.subtitle.duration),
    }, timelineConfig.subtitle.at)
    .to(startButton, {
      autoAlpha: timelineConfig.startButton.autoAlpha,
      y: timelineConfig.startButton.y,
      duration: getMotionDuration(timelineConfig.startButton.duration),
    }, timelineConfig.startButton.at);
}
