# Kapsula — аудит проекта, баги и план рефакторинга

Дата: 2026-08-07 · Ветка/коммит: `02db0a3`

---

## 1. Анализ проекта

### 1.1 Что это
Одностраничный лендинг-«конструктор капсулы отдыха», который встраивается в чужой Next.js-сайт
(`coral.ru`) двумя способами:

- **dev** — userscript через `vite-plugin-monkey` (`src/main.js` монтирует разметку в `#monkey-app`),
- **prod** — сборка в самодостаточные HTML-блоки для CMS (`src/lib/build-cms.mjs` → `@CMS/kapsula.html`,
  где инлайнятся `<style>`, разметка и IIFE `<script>`).

Кодогенерация (`gen-markup/gen-scripts/gen-styles`) собирает `src/*/index.js` по `src/order.json`.
Ассеты в dev отдаются локальным express-CDN (`src/lib/cdn-server.mjs`) с рерайтом путей
(`rewriteAssetsDev.js`), в prod — префиксом `landing-pages/kapsula` на `b2ccdn.coral.ru`.

### 1.2 Архитектура рантайма (`src/scripts/kapsula/`)
- **Точка входа** `kapsula.js`: RxJS-обвязка. Ждёт готовности React-хоста, наблюдает за появлением
  `[data-kapsula-hero]` и хедера через `selector-observer`, реагирует на `CoralRouteBus`,
  держит `Subscription` + `Map` cleanup-ов.
- **Экраны**: hero → steps → styles → form. Состояние — атрибут `hero.dataset.screen`,
  переходы — GSAP-таймлайны (`screenTransition.js`), конфиг анимаций декларативный (`animationConfig.js`),
  реестр узлов/анимаций — `screenNodes.js` + `screenRegistry.js`.
- **Форма**: `createReactiveForm.js` — `BehaviorSubject` со стейтом `{capsuleId, values, expandedState,
  activeSectionId, touchedSections}` и 4 селекторные подписки (шапка, рендер, оверлей-картинки, персист).
  Рендер — императивный DOM-дифф (`renderForm.js`), валидация — zod (`formValidation.js`),
  видимость опций — правила `visibleWhen/hiddenWhen` (`formConditions.js`).
- **Попап**: `bindFormPopup.js` — контактная форма (zod/mini), отправка лида, подгрузка отелей
  (`createPopupHotelsLoader.js` + `fetchKapsulaHotel.js` к внутренним эндпоинтам Coral).
- **Персист**: `sessionState.js` — sessionStorage + query-параметры `?screen=&capsule=`.

### 1.3 Сильные стороны
- Чистое разделение на маленькие модули с явными cleanup-функциями.
- Декларативные конфиги анимаций и формы; unidirectional data flow вокруг одного `state$`.
- Аккуратная работа с a11y-примитивами (`inert`, `aria-expanded`, `aria-hidden`, `role="alert"`).
- Учёт `prefers-reduced-motion`, responsive `<picture>`, прелоад/декодинг изображений.

### 1.4 Системные слабости
- Дублирование источников правды: `formConfig.js` ⟷ `formConfig.json`, два кеша прелоада картинок,
  два импорта zod (`zod` и `zod/mini`), константа `(min-width: 993px)` в 6 местах, `ym`-счётчик в 4 местах,
  селекторы хедера продублированы в `kapsula.js` и `setupHeaderUi.js`.
- Глобальный модульный стейт (`setupHeaderUi.js`, `syncEmblaCarousel.js`, `appSubscription`) — мешает
  повторной инициализации и HMR.
- Слои «данные» и «DOM» размазаны: `bindFormPopup.js` (383 строки) делает валидацию, маску телефона,
  карусель, загрузку отелей и сабмит; `animateFormImageOverlay.js` (596 строк) — наполовину конфиг, наполовину движок анимации.
- Нет ни одного теста, нет линтера/prettier, нет типов (есть только `vite-env.d.ts`).
- Мёртвые зависимости и файлы (см. ниже).

---

## 2. Найденные баги

### P0 — влияют на пользователя прямо сейчас

| # | Файл | Проблема |
|---|------|----------|
| ~~1~~ | ~~`formConfig.js`, секция `transfer`~~ | ~~Битые пути `transfer-2.webp`~~ — **снято, не баг**: проверено `curl`, файлы есть на CDN (HTTP 200) во всех вариантах `asia`/`oriental` × `desktop`/`mobile`. Локальный `public/` просто не синхронизирован, но конфиг использует абсолютные CDN-URL. |
| 2 | `animateFormImageOverlay.js` → `OVERLAY_IMAGE_ALTS` | Ключи — относительные пути (`/asia-desktop/thailand.webp`), а `overlayImageSrc` в конфиге — абсолютные CDN-URL. Совпадений нет никогда → у всех оверлеев alt «Фрагмент путешествия». |
| 3 | `createPopupHotelsLoader.js` → `createHotelCard` | При провале `PriceSearchEncrypt` `hotel.url === ""`, но карточка всё равно рендерится как `<a href="">` → клик перезагружает текущую страницу. Нужен фолбэк/деградация до `<div>`. |
| 4 | `bindFormPopup.js` → `validatePopupForm` | Ошибка по полю `contactMethod` не отображается (`POPUP_FIELD_ERRORS` знает только `name`/`phone`). Если радиокнопка не выбрана — сабмит молча ничего не делает. |
| 5 | `bindScreenActions.js` → `transitionToScreen` | Если таймлайн не доиграл (`onComplete` не вызван — например, `kill()` из cleanup или прерывание), `activeTimeline` остаётся не-null и навигация между экранами залипает навсегда. Нужен `onInterrupt`/сброс. |
| 6 | `fetchKapsulaHotel.js` → `normalizeHotelsResponse` | Фолбэк `responseHotels[index]` подставляет произвольный отель из ответа, если id не совпал → карточка с чужим названием/фото. |
| 7 | `fetchKapsulaHotel.js` | Кеш в sessionStorage без TTL и версии данных, при этом кешируются подписанные redirect-URL, которые протухают → «мёртвые» ссылки в рамках сессии. |

### P1 — надёжность / производительность / a11y

| # | Файл | Проблема |
|---|------|----------|
| 8 | `renderForm.js` → `syncOptionsNode` | `optionsNode.append(optionNode)` вызывается для каждой опции на каждом рендере — это всегда перемещение узла, даже если порядок не изменился. Лишние reflow и риск потери фокуса/сброса CSS-переходов. Нужно переставлять только при реальном расхождении порядка. |
| 9 | `bindFormPopup.js` | `MutationObserver(hero, {childList:true, subtree:true})` только ради ре-биндинга кнопки сабмита. Кнопка статична в разметке и `renderForm` её не трогает → наблюдатель бьёт на каждом ре-рендере формы. Заменить на делегирование клика от `hero`. |
| 10 | `setupScreenFlow.js` / `bindFormPopup.js` | Ранние `return` возвращают `undefined` вместо cleanup-функции; в `kapsula.js` в `rootCleanups` кладётся «пустышка», а флаги `dataset.transitionBound` / `dataset.popupBound` остаются → повторный монтаж (HMR, ре-рендер React-хоста) молча не инициализирует экраны. |
| 11 | `screenTransition.js` → `restoreScreen` | В ветке не-hero используется `initial.y` напрямую, минуя `getMotionOffset()` — нарушение `prefers-reduced-motion` (в hero-ветке обёртка есть). |
| 12 | `setupHeaderUi.js` | Модульные глобалы `isHeaderUiBound` / `originalHeaderIconsPosition`. При смене маршрута туда-обратно позиция иконок хедера восстанавливается только если сохранённый `parent.isConnected` — после ре-рендера React это почти всегда false → иконки остаются «переехавшими». |
| 13 | `renderForm.js` → `ensureSectionSummary` / `renderFormValidationErrors` | Текст ошибки и текст summary живут в одном узле: любой ре-рендер стирает ошибку, а исправление ошибки не возвращает summary до следующего изменения значений. Нужны раздельные узлы. |
| 14 | `bindScreenActions.js` | `event.preventDefault()` на `.kapsula-style-card .kapsula-button` вызывается до проверки экрана и без учёта `ctrl/cmd/middle click` → ломается открытие в новой вкладке у ссылки с валидным `href`. |
| 15 | `sessionState.js` | `formValues` и `formValuesPrefix` — одна и та же строка `"kapsula.formValues"`; legacy-ключ и префикс пересекаются. Плюс нет версии схемы: старые значения из sessionStorage применяются к новому конфигу. |
| 16 | `screenNodes.js` → `hasRequiredNodes` | При отсутствии любого узла возвращается `null` и весь экранный флоу молча не стартует, без диагностики. Нужен `console.warn` со списком отсутствующих селекторов. |
| 17 | `syncEmblaDots.js` | `emblaApi.on("select"/"reInit")` без парного `off` — при повторном `bindEmblaDots` (после `setCapsule`/`reInit`) подписки накапливаются. |
| 18 | `createReactiveForm.js` | Персист (`saveFormValues`) с `debounceTime(150)` без сброса на `pagehide`/`visibilitychange` → последние правки теряются при быстром уходе. |
| 19 | `setupBackgroundVideo.js` | `handleCanPlay` дергает `play()`, ориентируясь на `rootNode.dataset.screen`, но при восстановлении `?screen=form` порядок инициализации не гарантирует актуальность атрибута → видео может играть под формой. |

### P2 — гигиена кода

- `formConfig.json` (786 строк) — точная копия `formConfig.js`, нигде не импортируется. Мёртвый файл с риском рассинхрона.
- Неиспользуемые зависимости: `swiper`, `accordion-js`, `@coraltravelcenter/corallium`.
- Два импорта zod (`zod` + `zod/mini`) — лишний вес бандла.
- Дублирующие кеши прелоада: `imageLoadCache` (animateFormImageOverlay) и `responsiveImageLoadCache` (formResponsiveImages).
- `hotelIds` в `formConfig` не используется (отели берутся из `window.KAPSULA_HOTELS_CONFIG`).
- `src/markup/kapsula/progress-inline.html` не подключён в `kapsula.html`, стили `_progress.scss` мертвы.
- `fetchKapsulaHotel.js` отформатирован в ~10 колонок — 580 строк вместо ~200.
- Магические числа: `ym`-счётчик `96674199` (×4), `(min-width: 993px)` (×6), `993`/`992` в SCSS.
- `src/lib/rewriteAssetsDev.js` — единственный `.js` среди `.mjs` в `lib/`; возвращает `undefined` при `enabled:false`, хотя вызывающий ждёт функцию.

---

## 3. План рефакторинга (предлагаю к согласованию)

### Этап 0. Страховка (0.5 дня)
1. Добавить ESLint (flat config) + Prettier + `npm run lint`.
2. Добавить Vitest + jsdom и покрыть тестами чистые модули **до** изменений:
   `formConditions`, `formValues` (`normalizeFormValuesUntilStable`, `toggleOptionValue`),
   `formValidation`, `sessionState`, `buildCapsuleHref`, `formResponsiveImages`.
3. Прогнать `npm run check` и зафиксировать текущий вывод как базовую линию.

### Этап 1. Хотфиксы P0 (0.5–1 день) — без изменения архитектуры
- ~~Починить пути `transfer-2.webp`~~ — снято, ассеты на CDN присутствуют.
- Перевести `OVERLAY_IMAGE_ALTS` на матчинг по «хвосту» пути (`/<style>-<device>/<file>.webp`) и добавить тест.
- Карточка отеля без `url` → рендерить неинтерактивный контейнер.
- Показывать ошибку `contactMethod` в попапе.
- `transitionToScreen`: сбрасывать `activeTimeline` в `onComplete` **и** `onInterrupt`, плюс в cleanup.
- `normalizeHotelsResponse`: убрать фолбэк по индексу — только сопоставление по id.
- Кеш отелей: ключ с версией + TTL (например 15 мин), URL-редиректы не кешировать.

### Этап 2. Единые источники правды (1 день)
- Оставить единственный `formConfig.json`, удалить `formConfig.js` (решение №2 ниже).
- Удалить `progress-inline.html`, `_progress.scss`, мёртвые зависимости.
- Ввести `src/scripts/kapsula/constants.js`: `DESKTOP_MEDIA_QUERY`, `METRIKA_ID`, селекторы хедера,
  ключи sessionStorage, endpoint-ы.
- Ввести `analytics.js` — тонкая обёртка `reachGoal(goal, params)` вместо разбросанных `window.ym?.(...)`.
- Ввести `mediaQuery.js` — единый `matchMedia`-синглтон с подпиской (используют hero-видео, хедер, картинки, embla).
- Свести zod к одному импорту; объединить прелоад-кеши картинок в `imagePreloader.js`.

### Этап 3. Разбор «толстых» модулей (2 дня)
- `bindFormPopup.js` → `popup/`:
  - `popupContactForm.js` (схема + маска телефона + ошибки полей),
  - `popupHotels.js` (уже почти есть),
  - `popupLeadPayload.js` (сборка payload + формат даты),
  - `bindFormPopup.js` — только оркестрация и подписки.
- `animateFormImageOverlay.js` → `overlay/`: `overlayGeometry.js` (клипы/диапазоны, чистые функции + тесты),
  `overlayAlts.js` (данные), `overlayAnimator.js` (GSAP).
- `fetchKapsulaHotel.js` → `hotelsApi.js` (запросы) + `hotelsNormalize.js` (маппинг) + `hotelsCache.js`;
  переформатировать под общий стиль.

### Этап 4. Жизненный цикл и надёжность (1 день)
- Единый контракт: любая `setup*/bind*` возвращает функцию-cleanup (в т.ч. на ранних выходах — `() => {}`),
  флаги `dataset.*Bound` снимаются во всех ветках.
- Убрать модульные глобалы из `setupHeaderUi.js` — фабрика `createHeaderUi()` с внутренним состоянием,
  хранение исходной позиции иконок через маркер-плейсхолдер (`<span data-kapsula-anchor>`) вместо ссылки на parent.
- `syncEmblaDots`: возвращать unbind и снимать `off`.
- Персист формы: flush на `pagehide`/`visibilitychange`.
- Диагностика: единый `logger.js` (в prod — no-op), `console.warn` при отсутствии обязательных узлов.

### Этап 5. Рендер формы (1–1.5 дня)
- `syncOptionsNode`: переставлять узлы только при фактическом расхождении порядка (сравнение с `children[i]`),
  сохранять фокус.
- Разделить summary и сообщение об ошибке на два узла (`[data-kapsula-section-summary]` /
  `[data-kapsula-section-error]`), убрать взаимное затирание.
- `animateFormSections`: не трогать секции, у которых не изменились ни `expanded`, ни значение.
- Версионировать sessionStorage-схему (`kapsula.v2.*`) и игнорировать значения от неизвестных секций.

### Этап 6. Типы и качество (опционально, 1–2 дня)
- Добавить `src/types/kapsula.d.ts` с доменными моделями (`FormConfig`, `Capsule`, `Section`, `Option`, `Hotel`).
- Включить `// @ts-check` только в модулях, где типы реально ловят ошибки (конфиг, отели, состояние формы).
- Zod-схема самого `formConfig` с валидацией в dev — ловит опечатки в путях/полях на старте.

### Порядок и оценка
| Этап | Объём | Риск | Можно мержить отдельно |
|------|-------|------|------------------------|
| 0. Линт + тесты | 0.5 д | нет | да |
| 1. Хотфиксы P0 | 0.5–1 д | низкий | да |
| 2. Константы/дубли | 1 д | низкий | да |
| 3. Разбор модулей | 2 д | средний | да, помодульно |
| 4. Жизненный цикл | 1 д | средний | да |
| 5. Рендер формы | 1–1.5 д | средний | да |
| 6. Типы/CI | 1–2 д | низкий | да |

Итого ~7–9 рабочих дней, полностью инкрементально, без «большого взрыва».

---

## 4. Согласованные решения

1. **Картинки.** Приоритет — CDN-версии, они уже подставлены. Пути `transfer-2.webp` валидны
   (проверено запросом — HTTP 200), правки не требуются. Локальный `public/` считаем вторичным.
2. **`formConfig` → JSON.** Проблем со сборкой не будет: `build-cms.mjs` запускает обычный `vite build`,
   а поддержка JSON-импорта встроена в ядро Vite/Rollup — `import config from "./formConfig.json"`
   инлайнится в бандл как готовый объект на этапе сборки. Ни рантайм-фетчей, ни правок сборщика.
   → оставляем единственный `formConfig.json`, удаляем `formConfig.js`.
3. **TypeScript — точечно.** Полной миграции нет: `.d.ts` с доменными моделями + `// @ts-check`
   в модулях, где это даёт реальную пользу.
4. **Порядок — строго по этапам, начиная с хотфиксов.** Каждый фикс = отдельный атомарный коммит
   `fix(kapsula): ...`, чтобы любой откатывался независимо через `git revert <sha>`.
5. **Границы работ — только код лендинга.** `src/lib/*` (build-cms, cdn-server, генераторы индексов,
   rewriteAssets), `vite.config.js` и npm-скрипты не трогаем.

### Исключено из плана по итогам согласования
- Упрощение генераторов индексов / `order.json` — относится к сборщику.
- Правки `src/lib/rewriteAssetsDev.js` — сборщик (оставлено в P2 только как заметка).
- Перенос `transfer-2.webp` — не баг.
- Пункт «CI-скрипт: lint + test + build» — инфраструктура сборки.

---

## 5. Журнал выполнения

### Этап 1 — хотфиксы P0 (по одному коммиту на баг)
| Баг | Коммит | Статус |
|-----|--------|--------|
| №2 alt оверлеев | `fix(kapsula): match overlay image alts by path suffix` | ⏳ |
| №3 пустой `href` | `fix(kapsula): render hotel card without link when url is missing` | ⏳ |
| №4 ошибка `contactMethod` | `fix(kapsula): show contact method validation error` | ⏳ |
| №5 залипание навигации | `fix(kapsula): reset screen timeline on interrupt` | ⏳ |
| №6 чужой отель | `fix(kapsula): drop index fallback in hotels mapping` | ⏳ |
| №7 протухший кеш | `fix(kapsula): add ttl and version to hotels cache` | ⏳ |
