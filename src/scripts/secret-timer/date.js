import {MOSCOW_OFFSET_MS, ONE_DAY_MS} from "./constants.js";

export function getMoscowNow() {
  return new Date(Date.now() + MOSCOW_OFFSET_MS);
}

export function getCurrentDayTimestamp() {
  const now = getMoscowNow();

  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0,
  ) - MOSCOW_OFFSET_MS;
}

export function getNextDayTimestamp() {
  return getCurrentDayTimestamp() + ONE_DAY_MS;
}

export function formatMoscowDate(timestamp) {
  const date = new Date(timestamp + MOSCOW_OFFSET_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentMoscowDateString() {
  return formatMoscowDate(getCurrentDayTimestamp());
}

export function getDayDifference(startDate) {
  if (!startDate) return 0;

  const startTimestamp = new Date(`${startDate}T00:00:00+03:00`).getTime();
  const diff = getCurrentDayTimestamp() - startTimestamp;

  return Math.max(Math.floor(diff / ONE_DAY_MS), 0);
}

export function getBeginDateForCard(displayIndex) {
  const timestamp = getCurrentDayTimestamp() + displayIndex * ONE_DAY_MS;
  return [`${formatMoscowDate(timestamp)}T00:00:00Z`];
}

export function formatCountdown(targetTimestamp) {
  const diff = Math.max(0, targetTimestamp - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const time = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return days > 0 ? `${days}д ${time}` : time;
}
