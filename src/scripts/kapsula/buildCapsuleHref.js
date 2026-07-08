export function buildCapsuleHref(capsuleId) {
  if (!capsuleId) return "#";

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("screen", "form");
    url.searchParams.set("capsule", capsuleId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `?screen=form&capsule=${encodeURIComponent(capsuleId)}`;
  }
}
