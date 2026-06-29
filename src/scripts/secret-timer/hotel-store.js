import {fetchHotelPriceData} from "./api.js";
import {getHotelCardData} from "./hotel.js";

export function createHotelPriceStore(promoDiscountRules = []) {
  const cache = new Map();

  return {
    async getHotel(hotelId, beginDate) {
      const cacheKey = `${hotelId}::${JSON.stringify(beginDate)}`;

      if (!cache.has(cacheKey)) {
        const request = fetchHotelPriceData(hotelId, beginDate)
          .then((apiData) => getHotelCardData(apiData, hotelId, promoDiscountRules))
          .catch((error) => {
            cache.delete(cacheKey);
            throw error;
          });

        cache.set(cacheKey, request);
      }

      return cache.get(cacheKey);
    },
  };
}
