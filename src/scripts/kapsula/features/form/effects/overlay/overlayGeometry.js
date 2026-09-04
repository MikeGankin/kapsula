export const HIDDEN_CLIP = "inset(0 100% 0 0)";

const PARALLAX_VALUES = [8, 11, 14];
const SECOND_SEGMENT_PARALLAX_OFFSET = 8;

// Ручные раскладки для 2–4 сегментов: равные доли выглядят хуже,
// правый сегмент должен занимать больше места.
const VISIBLE_RANGES = {
  1: [{start: 0, end: 100}],
  2: [{start: 70, end: 100}, {start: 0, end: 70}],
  3: [{start: 75, end: 100}, {start: 50, end: 75}, {start: 0, end: 50}],
  4: [
    {start: 75, end: 100},
    {start: 50, end: 75},
    {start: 25, end: 50},
    {start: 0, end: 25},
  ],
};

function formatPercent(value) {
  return Number(value.toFixed(4));
}

export function getVisibleRange(index, total) {
  const ranges = VISIBLE_RANGES[total];

  if (ranges) {
    return ranges[index] ?? {start: 0, end: 0};
  }

  const width = 100 / total;
  const start = Math.max(0, 100 - width * (index + 1));

  return {start, end: Math.min(100, start + width)};
}

export function getSliceClip(index, total) {
  const {start, end} = getVisibleRange(index, total);

  return `inset(0 ${formatPercent(100 - end)}% 0 ${formatPercent(start)}%)`;
}

export function getCollapsedSliceClip(index, total) {
  const {start} = getVisibleRange(index, total);
  const left = formatPercent(start);

  return `inset(0 ${100 - left}% 0 ${left}%)`;
}

export function getCollapsedClipFromStart(clipStart) {
  const left = Number(clipStart ?? 0);

  return `inset(0 ${100 - left}% 0 ${left}%)`;
}

export function getParallaxOffset(imageSrc) {
  const charSum = Array.from(imageSrc).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );

  return PARALLAX_VALUES[charSum % PARALLAX_VALUES.length];
}

export function shouldAnimateParallax({nextVisibleCount, wasVisible}) {
  return nextVisibleCount > 1 && !wasVisible;
}

export function getSegmentParallaxOffset({previousVisibleCount, nextVisibleCount}) {
  if (previousVisibleCount === 1 && nextVisibleCount === 2) {
    return SECOND_SEGMENT_PARALLAX_OFFSET;
  }

  return undefined;
}
