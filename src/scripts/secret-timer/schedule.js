import {DEFAULT_SECRET_IMAGE, VISIBLE_CARD_COUNT} from "./constants.js";
import {
  formatMoscowDate,
  getBeginDateForCard,
  getCurrentDayTimestamp,
  getCurrentMoscowDateString,
  getDayDifference,
  getNextDayTimestamp,
} from "./date.js";

function getSecretHotelsData() {
  return window.secretHotelsData || {countries: []};
}

function getCountryState(country, dayOffset) {
  const groups = Array.isArray(country.hotelsGroups) ? country.hotelsGroups : [];

  if (!groups.length) {
    return {
      visibleHotelIds: [],
      nextHotelId: null,
    };
  }

  const activeGroup = groups[dayOffset % groups.length] || [];

  return {
    visibleHotelIds: activeGroup.slice(0, VISIBLE_CARD_COUNT),
    nextHotelId: activeGroup[VISIBLE_CARD_COUNT] || null,
  };
}

async function resolveHotelCard(hotelStore, hotelId, displayIndex) {
  const beginDate = getBeginDateForCard(displayIndex);
  try {
    const hotel = await hotelStore.getHotel(hotelId, beginDate);

    if (hotel) {
      return hotel;
    }
  } catch (error) {
    console.warn(`Secret hotel request failed for ${hotelId}:`, error);
  }

  return {
    id: hotelId,
    name: hotelId,
    image: DEFAULT_SECRET_IMAGE,
    href: "",
    stars: 0,
    oldPrice: null,
    promoPrice: null,
    finalPrice: null,
    nights: 7,
    adults: 2,
  };
}

async function buildResolvedCountryState(country, dayOffset, hotelStore) {
  const baseState = getCountryState(country, dayOffset);
  const visibleHotels = await Promise.all(
    baseState.visibleHotelIds.map((hotelId, index) =>
      resolveHotelCard(hotelStore, hotelId, index),
    ),
  );

  const nextHotel = baseState.nextHotelId
    ? await resolveHotelCard(hotelStore, baseState.nextHotelId, 0)
    : null;

  return {
    visibleHotels,
    nextHotel,
  };
}

export async function buildResolvedSchedule(hotelStore) {
  const data = getSecretHotelsData();
  const startDate = data.startDate || getCurrentMoscowDateString();
  const dayOffset = getDayDifference(startDate);
  const countries = await Promise.all(
    (data.countries || []).map(async (country) => {
      const state = await buildResolvedCountryState(country, dayOffset, hotelStore);

      return {
        ...country,
        state,
      };
    }),
  );

  return {
    startDate,
    currentDate: formatMoscowDate(getCurrentDayTimestamp()),
    nextDate: formatMoscowDate(getNextDayTimestamp()),
    countries,
  };
}

export function getScheduleSnapshot(resolvedSchedule) {
  return {
    startDate: resolvedSchedule.startDate,
    currentDate: resolvedSchedule.currentDate,
    nextDate: resolvedSchedule.nextDate,
    countries: resolvedSchedule.countries.map((country) => ({
      id: country.id,
      label: country.label,
      visibleHotels: country.state.visibleHotels.map((hotel) => hotel.id),
      nextHotel: country.state.nextHotel?.id || null,
      group: [
        ...country.state.visibleHotels.map((hotel) => hotel.id),
        country.state.nextHotel?.id || null,
      ].filter(Boolean),
    })),
  };
}
