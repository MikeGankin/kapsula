import {prefersReducedMotion} from "./mediaQuery.js";

const REDUCED_MOTION_DURATION = 0.16;

export {prefersReducedMotion};

export function getMotionDuration(duration) {
  return prefersReducedMotion() ? REDUCED_MOTION_DURATION : duration;
}

export function getMotionOffset(offset) {
  return prefersReducedMotion() ? 0 : offset;
}
