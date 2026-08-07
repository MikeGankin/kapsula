/**
 * Alt-тексты оверлеев. Ключи — относительные пути вида
 * "/asia-desktop/thailand.webp", тогда как overlayImageSrc в конфиге —
 * абсолютные CDN-URL, поэтому сопоставляем по последним двум сегментам.
 */
const OVERLAY_IMAGE_ALTS = {
  "/asia-desktop/thailand.webp": "Завтрак у бассейна с видом на море и пальмы",
  "/asia-desktop/bali.webp": "Тропическое побережье с волнами, скалами и деревянной лестницей",
  "/asia-desktop/china.webp": "Песчаный пляж и пальмы у бирюзового моря, вид сверху",
  "/asia-desktop/vietnam.webp": "Побережье Вьетнама с лодками, зеленью и спокойной водой",
  "/asia-desktop/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/asia-desktop/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/asia-desktop/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/asia-mobile/thailand.webp": "Завтрак у бассейна с видом на море и пальмы",
  "/asia-mobile/bali.webp": "Тропическое побережье с волнами, скалами и деревянной лестницей",
  "/asia-mobile/china.webp": "Песчаный пляж и пальмы у бирюзового моря, вид сверху",
  "/asia-mobile/vietnam.webp": "Побережье Вьетнама с лодками, зеленью и спокойной водой",
  "/asia-mobile/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/asia-mobile/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/asia-mobile/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/oriental-desktop/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/oriental-desktop/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/oriental-desktop/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/oriental-desktop/turkey.webp": "Пляжный курорт с бассейном и террасами у моря в Турции",
  "/oriental-desktop/egypt.webp": "Курорт у побережья Красного моря с песчаным берегом и пальмами в Египте",
  "/oriental-desktop/uae.webp": "Современный курорт у побережья с мариной и архитектурой ОАЭ",
  "/oriental-desktop/suite.webp": "Светлый люкс с зоной отдыха и панорамными окнами курортного отеля",
  "/oriental-desktop/family.webp": "Просторный семейный номер курортного отеля с большой кроватью и мягкой зоной",
  "/oriental-desktop/villa.webp": "Уединенная вилла с личной террасой и бассейном среди курортного сада",
  "/oriental-desktop/flight.webp": "Салон самолета с креслами разных классов обслуживания",
  "/oriental-desktop/transfer.webp": "Премиальный трансфер к отелю на фоне курортной инфраструктуры",
  "/oriental-desktop/food.webp": "Сервировка завтрака и блюда курортного ресторана у воды",
  "/oriental-desktop/sea.webp": "Яхта и морское побережье для отдыха на воде",
  "/oriental-desktop/spa.webp": "Спа-пространство с массажем и расслабляющей атмосферой",
  "/oriental-desktop/nature.webp": "Живописная природная локация для экскурсий и прогулок",
  "/oriental-desktop/city.webp": "Оживленный городской курортный район с вечерними огнями",
  "/oriental-mobile/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/oriental-mobile/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/oriental-mobile/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/oriental-mobile/turkey.webp": "Пляжный курорт с бассейном и террасами у моря в Турции",
  "/oriental-mobile/egypt.webp": "Курорт у побережья Красного моря с песчаным берегом и пальмами в Египте",
  "/oriental-mobile/uae.webp": "Современный курорт у побережья с мариной и архитектурой ОАЭ",
  "/oriental-mobile/suite.webp": "Светлый люкс с зоной отдыха и панорамными окнами курортного отеля",
  "/oriental-mobile/family.webp": "Просторный семейный номер курортного отеля с большой кроватью и мягкой зоной",
  "/oriental-mobile/villa.webp": "Уединенная вилла с личной террасой и бассейном среди курортного сада",
  "/oriental-mobile/flight.webp": "Салон самолета с креслами разных классов обслуживания",
  "/oriental-mobile/transfer.webp": "Премиальный трансфер к отелю на фоне курортной инфраструктуры",
  "/oriental-mobile/food.webp": "Сервировка завтрака и блюда курортного ресторана у воды",
  "/oriental-mobile/sea.webp": "Яхта и морское побережье для отдыха на воде",
  "/oriental-mobile/spa.webp": "Спа-пространство с массажем и расслабляющей атмосферой",
  "/oriental-mobile/nature.webp": "Живописная природная локация для экскурсий и прогулок",
  "/oriental-mobile/city.webp": "Оживленный городской курортный район с вечерними огнями",
  "/island-desktop/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/island-desktop/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/island-desktop/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/island-desktop/maldives.webp": "Виллы над водой и лагуна с бирюзовой водой на Мальдивах",
  "/island-desktop/seychelles.webp": "Тропический пляж с гранитными валунами и пальмами на Сейшелах",
  "/island-desktop/mauritius.webp": "Побережье с белым песком и курортными отелями на Маврикии",
  "/island-desktop/suite.webp": "Светлый люкс курортного островного отеля с мягкой зоной отдыха",
  "/island-desktop/family.webp": "Просторный семейный номер островного отеля с двумя зонами отдыха",
  "/island-desktop/villa.webp": "Островная вилла с приватным бассейном и выходом к пляжу",
  "/island-desktop/flight.webp": "Салон самолета для дальнего перелета на островной курорт",
  "/island-desktop/transfer.webp": "Трансфер к островному отелю на фоне моря и причала",
  "/island-desktop/food.webp": "Блюда и сервировка в ресторане островного курорта",
  "/island-desktop/sea.webp": "Лодка у лазурной воды для морских впечатлений и снорклинга",
  "/island-desktop/spa.webp": "Островное спа с массажем и видом на тропическую природу",
  "/island-desktop/nature.webp": "Тропическая природная локация для прогулок и экскурсий",
  "/island-desktop/city.webp": "Городской ритм островного направления с набережной и огнями",
  "/island-mobile/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/island-mobile/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/island-mobile/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/island-mobile/maldives.webp": "Виллы над водой и лагуна с бирюзовой водой на Мальдивах",
  "/island-mobile/seychelles.webp": "Тропический пляж с гранитными валунами и пальмами на Сейшелах",
  "/island-mobile/mauritius.webp": "Побережье с белым песком и курортными отелями на Маврикии",
  "/island-mobile/suite.webp": "Светлый люкс курортного островного отеля с мягкой зоной отдыха",
  "/island-mobile/family.webp": "Просторный семейный номер островного отеля с двумя зонами отдыха",
  "/island-mobile/villa.webp": "Островная вилла с приватным бассейном и выходом к пляжу",
  "/island-mobile/flight.webp": "Салон самолета для дальнего перелета на островной курорт",
  "/island-mobile/transfer.webp": "Трансфер к островному отелю на фоне моря и причала",
  "/island-mobile/food.webp": "Блюда и сервировка в ресторане островного курорта",
  "/island-mobile/sea.webp": "Лодка у лазурной воды для морских впечатлений и снорклинга",
  "/island-mobile/spa.webp": "Островное спа с массажем и видом на тропическую природу",
  "/island-mobile/nature.webp": "Тропическая природная локация для прогулок и экскурсий",
  "/island-mobile/city.webp": "Городской ритм островного направления с набережной и огнями",
};

const OVERLAY_ALT_FALLBACK = "Фрагмент путешествия";

function getOverlayAltKey(imageSrc) {
  if (typeof imageSrc !== "string" || !imageSrc) {
    return "";
  }

  let pathname = imageSrc;

  if (imageSrc.startsWith("http")) {
    try {
      pathname = new URL(imageSrc).pathname;
    } catch {
      pathname = imageSrc;
    }
  }

  const segments = pathname.split("/").filter(Boolean);

  return segments.length >= 2 ? `/${segments.slice(-2).join("/")}` : pathname;
}

export function getOverlayImageAlt(imageSrc) {
  return OVERLAY_IMAGE_ALTS[getOverlayAltKey(imageSrc)]
    ?? OVERLAY_IMAGE_ALTS[imageSrc]
    ?? OVERLAY_ALT_FALLBACK;
}
