export function buildCapsuleHref(capsuleId) {
  if (!capsuleId) return "#";

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("kapsulaStep", "form");
    url.searchParams.set("kapsulaCapsule", capsuleId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `?kapsulaStep=form&kapsulaCapsule=${encodeURIComponent(capsuleId)}`;
  }
}
