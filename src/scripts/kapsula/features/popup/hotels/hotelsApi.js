import {
  createHotelRedirectPayload,
  createHotelsSearchPayload,
} from "./hotelsSearchPayload.js";

const HOTELS_SEARCH_ENDPOINT = "/endpoints/PackageTourHotelProduct/PriceSearchList";
const HOTELS_REDIRECT_ENDPOINT = "/endpoints/PackageTourHotelProduct/PriceSearchEncrypt";

const SEARCH_LINK_QUERY = {
  p: 1,
  w: 0,
  s: 0,
  ws: 10,
};

async function postJson(endpoint, payload, {signal} = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Kapsula request to ${endpoint} failed with status ${response.status}`);
  }

  return response.json();
}

function createHotelUrl(redirectionUrl) {
  if (!redirectionUrl) {
    return "";
  }

  const separator = redirectionUrl.includes("?") ? "&" : "?";
  const query = new URLSearchParams(SEARCH_LINK_QUERY);

  return `${redirectionUrl}${separator}${query.toString()}`;
}

export async function fetchHotelsSearch(configuredHotels, {signal} = {}) {
  return postJson(
    HOTELS_SEARCH_ENDPOINT,
    createHotelsSearchPayload(configuredHotels),
    {signal},
  );
}

export async function fetchHotelRedirectUrl(configuredHotel, {signal} = {}) {
  const responseData = await postJson(
    HOTELS_REDIRECT_ENDPOINT,
    createHotelRedirectPayload(configuredHotel),
    {signal},
  );
  const redirectionUrl = responseData?.result?.redirectionUrlWithQueryParam ?? "";

  if (!redirectionUrl) {
    throw new Error(`Kapsula hotel ${configuredHotel.id}: redirection URL not found`);
  }

  return createHotelUrl(redirectionUrl);
}
