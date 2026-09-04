const hotelsByCountry = {
  Таиланд: [
    {id: "2198-7", name: "ANANTARA MAI KHAO PHUKET VILLAS"},
    {id: "19787-7", name: "PHUKET MARRIOTT RESORT & SPA, NAI YANG BEACH"},
    {id: "13708-7-875-6", name: "ANANTARA VACATION CLUB MAI KHAO PHUKET"},
  ],
  Индонезия: [
    {id: "13729-7", name: "THE OBEROI BEACH RESORT"},
    {id: "29699-7", name: "THE APURVA KEMPINSKI BALI"},
    {id: "8730-7", name: "AMARTERRA VILLAS"},
  ],
  Турция: [
    {id: "58202-7", name: "ETHNO BELEK"},
    {id: "33799-7-111-6", name: "NG PHASELIS BAY"},
    {id: "73894-7-43-6", name: "XO CAPE ARNNA FETHIYE"},
  ],
  Египет: [
    {id: "95-7-174-6", name: "THE OBEROI BEACH RESORT, SAHL HASHEESH"},
    {id: "60-7-186-6", name: "FOUR SEASONS RESORT"},
    {id: "29367-7", name: "RIXOS PREMIUM MAGAWISH"},
  ],
  Мальдивы: [
    {id: "35471-7", name: "JW MARRIOTT MALDIVES RESORT & SPA"},
    {id: "1713-7", name: "FOUR SEASONS RESORT MALDIVES AT KUDA HURAA"},
    {id: "1722-7-2066-6", name: "W MALDIVES"},
  ],
  Сейшелы: [
    {id: "36105-7", name: "MANGO HOUSE SEYCHELLES LXR HOTELS"},
    {id: "6432-7-849-6", name: "RAFFLES SEYCHELLES"},
    {id: "1052-7", name: "ANANTARA MAIA SEYCHELLES VILLAS"},
  ],
  Маврикий: [
    {id: "4650-7", name: "ROYAL PALM BEACHCOMBER LUXURY"},
    {id: "4639-7", name: "ONE & ONLY LE SAINT GERAN"},
    {id: "4679-7-1994-6", name: "MARADIVA VILLAS RESORT & SPA"},
  ],
  ОАЭ: [
    {id: "46703-7", name: "CLUB PRIVE BY RIXOS SAADIYAT ISLAND"},
    {id: "2087-7-203-6", name: "JUMEIRAH DAR AL MASYAF"},
    {id: "51997-7-8418-6", name: "ATLANTIS THE ROYAL"},
  ],
  Китай: [
    {id: "46703-7", name: "SWISSOTEL&GRAND MERCURE SANYA YALONG BAY"},
    {id: "73891-7", name: "SANYA MARRIOTT YALONG"},
    {id: "3491-7", name: "HORIZON RESORT & SPA"},
  ],
  Вьетнам: [
    {id: "1951-7", name: "SIX SENSES NINH VAN BAY"},
    {id: "57698-7", name: "VILLA LE CORAIL - A GRAN MELIA HOTEL NHA TRANG"},
    {id: "5888-7", name: "L ALYA NINH VAN BAY"},
  ],
};

window.KAPSULA_HOTELS_CONFIG = Object.freeze({
  hotelsByCountry: Object.freeze(hotelsByCountry),
});
