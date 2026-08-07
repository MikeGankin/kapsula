const DEPARTURE_LOCATION = {
  id: "2671-5",
  name: "Москва",
  friendlyUrl: "moskva",
  type: 5,
};

const SEARCH_PAYLOAD = {
  datePickerMode: 0,
  flightType: 2,
  nights: [{value: 7}],
  pageNumber: 1,
  pageSize: 20,
  sortType: 0,
  reservationType: 0,
  passengers: [
    {age: 20, passengerType: 0},
    {age: 20, passengerType: 0},
  ],
};

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createBeginDates() {
  const today = new Date();
  const weekLater = new Date(today);

  weekLater.setDate(weekLater.getDate() + 7);

  return [formatLocalDate(today), formatLocalDate(weekLater)];
}

function createArrivalLocations(configuredHotels) {
  return configuredHotels.map(({id}) => ({
    id,
    name: "",
    friendlyUrl: "",
    type: 7,
  }));
}

export function createSearchCriterias(configuredHotels) {
  return {
    additionalFilters: [],
    arrivalLocations: createArrivalLocations(configuredHotels),
    beginDates: createBeginDates(),
    datePickerMode: SEARCH_PAYLOAD.datePickerMode,
    departureLocations: [DEPARTURE_LOCATION],
    flightType: SEARCH_PAYLOAD.flightType,
    nights: SEARCH_PAYLOAD.nights,
    paging: {
      hasNextPage: false,
      hasPreviousPage: false,
      pageNumber: SEARCH_PAYLOAD.pageNumber,
      pageSize: SEARCH_PAYLOAD.pageSize,
      sortType: SEARCH_PAYLOAD.sortType,
    },
    reservationType: SEARCH_PAYLOAD.reservationType,
    roomCriterias: [{passengers: SEARCH_PAYLOAD.passengers}],
  };
}

export function createHotelsSearchPayload(configuredHotels) {
  return {
    searchSource: 1,
    searchCriterias: createSearchCriterias(configuredHotels),
  };
}

export function createHotelRedirectPayload(configuredHotel) {
  return {
    ...createSearchCriterias([configuredHotel]),
    imageSizes: [0],
  };
}
