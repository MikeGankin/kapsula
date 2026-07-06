export function buildCapsuleHref(capsuleId) {
  if (!capsuleId) return "#";

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("step", "form");
    url.searchParams.set("style", capsuleId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `?step=form&style=${encodeURIComponent(capsuleId)}`;
  }
}
