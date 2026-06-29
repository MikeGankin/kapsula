import {DEFAULT_SECRET_IMAGE} from "./constants.js";

function getHotelDiscount(price, promoDiscountRules = []) {
  const roundedPrice = Math.round(Number(price) || 0);
  const matchedRule = promoDiscountRules
    .filter((rule) => {
      return roundedPrice >= Number(rule?.minPrice || 0);
    })
    .sort((a, b) => Number(b?.minPrice || 0) - Number(a?.minPrice || 0))[0];

  return Number(matchedRule?.discount || 0);
}

function buildHotelOfferHref(offerLink) {
  if (!offerLink?.queryParam || !offerLink?.redirectionUrl) {
    return "";
  }

  const redirectionPath = offerLink.redirectionUrl.startsWith("/hotels/")
    ? offerLink.redirectionUrl
    : `/hotels${offerLink.redirectionUrl}`;

  return `${redirectionPath}?${offerLink.queryParam}&p=1&w=0&s=0&ws=10`;
}

function normalizeImageUrl(imageUrl) {
  if (!imageUrl) {
    return DEFAULT_SECRET_IMAGE;
  }

  return imageUrl.startsWith("http")
    ? imageUrl
    : `https://content.coral.ru${imageUrl}`;
}

export function getHotelCardData(apiData, hotelId, promoDiscountRules = []) {
  const product = apiData?.result?.products?.[0];
  const hotel = product?.hotel;
  const hotelCategories = apiData?.result?.hotelCategories;
  const hotelCategory = hotel?.categoryKey
    ? hotelCategories?.[hotel.categoryKey]
    : null;
  const offer = product?.offers?.[0];

  if (!product || !hotel || !offer) {
    return null;
  }

  const oldPrice = offer?.price?.oldAmount ?? offer?.price?.amount ?? null;
  const priceWithDiscount = offer?.price?.amount ?? null;
  const promoPrice =
    priceWithDiscount !== null
      ? getHotelDiscount(priceWithDiscount, promoDiscountRules)
      : null;
  const finalPrice =
    priceWithDiscount !== null && promoPrice !== null
      ? Math.max(priceWithDiscount - promoPrice, 0)
      : null;

  return {
    id: hotelId,
    name: hotel?.name || hotelId,
    image: normalizeImageUrl(hotel?.images?.[0]?.sizes?.[0]?.url || ""),
    href: buildHotelOfferHref(offer?.link),
    stars: Math.max(Number(hotelCategory?.starCount) || 0, 0),
    oldPrice,
    promoPrice,
    finalPrice,
    nights:
      Number(offer?.nights ?? product?.nights ?? product?.tour?.nights) || 7,
    adults:
      Number(
        offer?.room?.passengers?.length ??
          product?.room?.passengers?.length,
      ) || 2,
  };
}
