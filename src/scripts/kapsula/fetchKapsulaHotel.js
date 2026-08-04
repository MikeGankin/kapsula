const KAPSULA_HOTEL_ENDPOINT = "";

export function getKapsulaHotelEndpoint(hotelId) {
  if (!KAPSULA_HOTEL_ENDPOINT || !hotelId) return "";

  return `${KAPSULA_HOTEL_ENDPOINT}/${encodeURIComponent(hotelId)}`;
}

function normalizeHotelResponse(responseData, configuredHotel) {
  const hotel = responseData?.hotel ?? responseData;

  return {
    id: String(hotel?.id ?? configuredHotel.id),
    name: String(hotel?.name ?? configuredHotel.name),
    imageUrl: String(hotel?.imageUrl ?? ""),
    location: String(hotel?.location ?? configuredHotel.country),
    url: String(hotel?.url ?? ""),
  };
}

export async function fetchKapsulaHotel(configuredHotel, {signal} = {}) {
  const endpoint = getKapsulaHotelEndpoint(configuredHotel?.id);

  if (!endpoint) {
    throw new Error("Kapsula hotel endpoint is not configured");
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {Accept: "application/json"},
    signal,
  });

  if (!response.ok) {
    throw new Error(`Kapsula hotel request failed with status ${response.status}`);
  }

  return normalizeHotelResponse(await response.json(), configuredHotel);
}
