export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function getMotionDuration(duration) {
  return prefersReducedMotion() ? 0 : duration;
}

export function getMotionOffset(offset) {
  return prefersReducedMotion() ? 0 : offset;
}
