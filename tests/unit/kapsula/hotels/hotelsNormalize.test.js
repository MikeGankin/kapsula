import {
  getResponseHotels,
  normalizeHotelsResponse,
} from "../../../../src/scripts/kapsula/hotels/hotelsNormalize.js";

/**
 * Ответ поиска отелей приходит в нескольких исторических форматах, а id отеля
 * в конфиге и в ответе различаются хвостом-метаданными. Раньше несовпадение
 * приводило к фолбэку по индексу — в карточку попадал чужой отель.
 */

describe("getResponseHotels", () => {
  it("находит список по всем известным путям ответа", () => {
    const hotel = {id: "1"};

    expect(getResponseHotels([hotel])).toEqual([hotel]);
    expect(getResponseHotels({result: {products: [hotel]}})).toEqual([hotel]);
    expect(getResponseHotels({data: {items: [hotel]}})).toEqual([hotel]);
  });

  it("возвращает пустой список для неизвестной структуры", () => {
    expect(getResponseHotels({unexpected: {shape: 1}})).toEqual([]);
    expect(getResponseHotels(null)).toEqual([]);
  });
});

describe("normalizeHotelsResponse", () => {
  it("сопоставляет отель по первому сегменту id, игнорируя метаданные локации", () => {
    // В конфиге "13708-7-875-6", в ответе — "13708": это один и тот же отель.
    const response = {result: {products: [{hotel: {id: "13708", name: "Amilla"}}]}};

    const hotels = normalizeHotelsResponse(response, [{id: "13708-7-875-6", name: "Из конфига"}]);

    expect(hotels).toHaveLength(1);
    expect(hotels[0].name).toBe("Amilla");
  });

  it("сохраняет id из конфига в исходном виде: по нему строится кеш и redirect", () => {
    const response = {result: {products: [{hotel: {id: "13708", name: "Amilla"}}]}};

    const [hotel] = normalizeHotelsResponse(response, [{id: "13708-7-875-6"}]);

    expect(hotel.id).toBe("13708-7-875-6");
  });

  it("отбрасывает отели, которых нет в ответе, не ломая остальные карточки", () => {
    const response = {result: {products: [{hotel: {id: "1", name: "Первый"}}]}};

    const hotels = normalizeHotelsResponse(response, [{id: "1"}, {id: "404"}]);

    expect(hotels.map((hotel) => hotel.name)).toEqual(["Первый"]);
  });

  it("берёт самое крупное изображение из доступных размеров", () => {
    const response = {
      result: {
        products: [{
          hotel: {
            id: "1",
            images: [{
              sizes: [
                {width: 320, url: "small.jpg"},
                {width: 1280, url: "large.jpg"},
                {width: 640, url: "medium.jpg"},
              ],
            }],
          },
        }],
      },
    };

    const [hotel] = normalizeHotelsResponse(response, [{id: "1"}]);

    expect(hotel.imageUrl).toBe("large.jpg");
  });

  it("подставляет данные из конфига, когда в ответе их нет", () => {
    const response = {result: {products: [{hotel: {id: "1"}}]}};

    const [hotel] = normalizeHotelsResponse(
      response,
      [{id: "1", name: "Резервное имя", country: "Мальдивы"}],
    );

    expect(hotel.name).toBe("Резервное имя");
    expect(hotel.location).toBe("Мальдивы");
    expect(hotel.imageUrl).toBe("");
  });
});
