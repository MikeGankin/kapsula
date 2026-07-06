import {gsap} from "gsap";
import {KAPSULA_ANIMATION} from "./animationConfig.js";

export function animateHero() {
  const {selectors, initial, timeline: timelineConfig} = KAPSULA_ANIMATION.heroReveal;

  const hero = document.querySelector(selectors.hero);
  if (!hero || hero.dataset.animated === "1") return;

  const content = hero.querySelector(selectors.content);
  const eyebrow = hero.querySelector(selectors.eyebrow);
  const title = hero.querySelector(selectors.title);
  const subtitle = hero.querySelector(selectors.subtitle);
  const startButton = hero.querySelector(selectors.startButton);
  const backdrop = hero.querySelector(selectors.backdrop);

  if (!content || !eyebrow || !title || !subtitle || !startButton || !backdrop) return;

  hero.dataset.animated = "1";

  gsap.set([eyebrow, title, subtitle, startButton], {
    autoAlpha: 0,
    y: initial.contentY,
  });

  gsap.set(backdrop, {
    scale: initial.backdropScale,
  });

  const timeline = gsap.timeline({
    defaults: timelineConfig.defaults,
  });

  timeline
    .to(backdrop, timelineConfig.backdrop)
    .to(eyebrow, {
      autoAlpha: timelineConfig.eyebrow.autoAlpha,
      y: timelineConfig.eyebrow.y,
      duration: timelineConfig.eyebrow.duration,
    }, timelineConfig.eyebrow.at)
    .to(title, {
      autoAlpha: timelineConfig.title.autoAlpha,
      y: timelineConfig.title.y,
      duration: timelineConfig.title.duration,
    }, timelineConfig.title.at)
    .to(subtitle, {
      autoAlpha: timelineConfig.subtitle.autoAlpha,
      y: timelineConfig.subtitle.y,
      duration: timelineConfig.subtitle.duration,
    }, timelineConfig.subtitle.at)
    .to(startButton, {
      autoAlpha: timelineConfig.startButton.autoAlpha,
      y: timelineConfig.startButton.y,
      duration: timelineConfig.startButton.duration,
    }, timelineConfig.startButton.at);
}
