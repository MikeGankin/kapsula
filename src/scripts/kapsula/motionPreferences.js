const REDUCED_MOTION_DURATION = 0.16;

export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function getMotionDuration(duration) {
  return prefersReducedMotion() ? REDUCED_MOTION_DURATION : duration;
}

export function getMotionOffset(offset) {
  return prefersReducedMotion() ? 0 : offset;
}
