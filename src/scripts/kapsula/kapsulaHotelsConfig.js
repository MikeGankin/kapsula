function normalizeCountries(countries) {
  if (!Array.isArray(countries)) return [];

  return countries.filter((country) => typeof country === "string" && country.trim());
}

function normalizeHotel(hotel, country) {
  if (!hotel || typeof hotel !== "object") return null;

  const id = typeof hotel.id === "string" ? hotel.id.trim() : "";
  const name = typeof hotel.name === "string" ? hotel.name.trim() : "";

  if (!id || !name) return null;

  return {id, name, country};
}

export function getConfiguredHotelsByCountries(countries) {
  const hotelsByCountry = window.KAPSULA_HOTELS_CONFIG?.hotelsByCountry;

  if (!hotelsByCountry || typeof hotelsByCountry !== "object") {
    return [];
  }

  const hotelsById = new Map();

  normalizeCountries(countries).forEach((country) => {
    const countryHotels = hotelsByCountry[country];

    if (!Array.isArray(countryHotels)) return;

    countryHotels.forEach((hotel) => {
      const normalizedHotel = normalizeHotel(hotel, country);

      if (normalizedHotel && !hotelsById.has(normalizedHotel.id)) {
        hotelsById.set(normalizedHotel.id, normalizedHotel);
      }
    });
  });

  return Array.from(hotelsById.values());
}
