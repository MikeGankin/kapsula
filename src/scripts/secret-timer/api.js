import {
  departureLocation,
  PRICE_SEARCH_ENDPOINT,
  REQUEST_RETRY_DELAYS_MS,
} from "./constants.js";

function wait(delayMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function fetchJsonWithRetry(url, options) {
  let lastError = null;

  for (const delayMs of REQUEST_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await wait(delayMs);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Request failed");
}

function buildSearchCriterias(hotelId, beginDate, reservationType = 0) {
  return {
    reservationType,
    beginDates: Array.isArray(beginDate) ? beginDate : [beginDate],
    nights: [{value: 7}],
    roomCriterias: [
      {
        passengers: [
          {passengerType: 0, age: 20},
          {passengerType: 0, age: 20},
        ],
      },
    ],
    arrivalLocations: [{id: hotelId, type: 7}],
    departureLocations: [departureLocation],
    paging: {
      hasPreviousPage: false,
      hasNextPage: false,
      pageNumber: 1,
      pageSize: 20,
      sortType: 0,
    },
    imageSizes: [4],
  };
}

function buildPricePayload(hotelId, beginDate) {
  return {
    searchCriterias: buildSearchCriterias(hotelId, beginDate, 0),
  };
}

export async function fetchHotelPriceData(hotelId, beginDate) {
  return fetchJsonWithRetry(PRICE_SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPricePayload(hotelId, beginDate)),
  });
}
