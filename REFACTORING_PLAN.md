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
| 3 | `createPopupHotelsLoader.js` → `createHotelCard` | При провале `PriceSearchEncrypt` `hotel.url === ""`, но карточка всё равно рендерится как `<a href="">` → клик перезагружает текущую страницу. Решение: не рендерить такие карточки. |
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
- Карточка отеля без `url` → не рендерить вовсе; если ссылок нет ни у одного отеля,
  показывается тот же блок ошибки, что и при сбое основного запроса.
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

### Этап 1 — хотфиксы P0 ✅ завершён
Каждый фикс — отдельный коммит, откатывается независимо через `git revert <sha>`.

| Баг | SHA | Коммит | Проверка |
|-----|-----|--------|----------|
| №2 alt оверлеев | `63bfbc4` | `fix(kapsula): match overlay image alts by path suffix` | матчинг по последним 2 сегментам пути |
| №3 пустой `href` | `e372654` | `fix(kapsula): skip hotel cards without link` | первый вариант (неинтерактивная карточка, `b56fdae`) отменён по фидбеку ревертом `5798ad3` |
| №4 ошибка `contactMethod` | `92309cc` | `fix(kapsula): show contact method validation error` | схема zod проверена в node |
| №5 залипание навигации | `9377774` | `fix(kapsula): reset screen timeline on interrupt` | `onInterrupt` при `kill()` подтверждён в gsap |
| №6 чужой отель | `7f1fe8e` | `fix(kapsula): drop index fallback in hotels mapping` | только матчинг по id + warn |
| №7 протухший кеш | `0139456` | `fix(kapsula): add ttl and version to hotels cache` | fresh/expired/legacy проверены |

Затронутые файлы: `animateFormImageOverlay.js`, `createPopupHotelsLoader.js`, `bindFormPopup.js`,
`bindScreenActions.js`, `fetchKapsulaHotel.js`, `popup.html` (+ regen `markup/index.js`), `_popup.scss`.
Сборщик не затрагивался.

### Этап 2 — единые источники правды ✅ завершён

| Шаг | SHA | Что сделано |
|-----|-----|-------------|
| 2.1 конфиг | `444fc29` | `formConfig.js` удалён, остался `formConfig.json`. **Важно:** файлы уже разошлись — в JSON `hotel-style` и `room-type` стояли `required:false`, хотя разметка и JS считают их обязательными. JSON перегенерирован из актуального JS. |
| 2.2–2.4 константы | `2ada885` | `constants.js`, `analytics.js`, `mediaQuery.js`, `imagePreloader.js` |
| 2.5 zod | `bb6b954` → `f352618` | сведено к одной точке входа. По фидбеку выбрана **mini**-версия (её возможностей хватает: string/array/enum, trim, minLength, refine): бандл **351417 → 301793 Б (−14.1%)**, gzip **101035 → 88671 Б (−12.2%)**. Эквивалентность обеих схем проверена прогоном старой и новой реализации на одинаковых входах. |
| 2.6 мёртвый код | `a07afb1` | `progress-inline.html`, `_progress.scss`, `hotelIds`, 3 зависимости |

**Устранённые дубли (проверено `grep`, везде 0 вхождений вне новых модулей):**
`window.ym` ×4 → `reachGoal()`; `window.matchMedia` ×6 → `mediaQuery.js`;
`(min-width: 993px)` в JS ×6 → `DESKTOP_MEDIA_QUERY`; id счётчика ×4 → `METRIKA_COUNTER_ID`;
селекторы хедера ×2 файла → `HEADER_SELECTORS`; два кеша прелоада → один `imagePreloader`.

Побочные улучшения: `reachGoal` не падает без `ym` и логирует сбой; `observeDesktopViewport`
возвращает функцию отписки (раньше слушатель в `setupBackgroundVideo` снимался вручную);
в `sessionState` разведены `legacyFormValues` и `formValuesPrefix`.

### Этап 3 — разбор «толстых» модулей ✅ завершён

| Шаг | SHA | Было → стало | Проверка эквивалентности |
|-----|-----|--------------|--------------------------|
| 3.1 отели | `eca43c8` | `fetchKapsulaHotel.js` 612 строк → `hotels/` 339 в 5 модулях | все формы ответа API распознаются, маппинг по id и payload совпадают |
| 3.2 попап | `aaa8004` | `bindFormPopup.js` 383 → 205 строк + `popup/` 158 | маска телефона прогнана на 7 вариантах ввода |
| 3.3 оверлей | `b3d19b3` | `animateFormImageOverlay.js` 596 → 380 строк + `overlay/` 188 | геометрия клипов: 36 комбинаций `index/total` совпадают 1:1 |

**Структура после разбора:**
- `hotels/`: `hotelsApi` (запросы) · `hotelsSearchPayload` (payload) · `hotelsNormalize` (маппинг) ·
  `hotelsCache` (sessionStorage + TTL) · `fetchKapsulaHotels` (оркестрация);
- `popup/`: `popupContactForm` (схема, маска, ошибки полей, pending) · `popupLeadPayload` (payload лида);
- `overlay/`: `overlayAlts` (данные + подбор alt) · `overlayGeometry` (чистые функции клипов и параллакса).

**Попутно закрыт P1 №9:** `MutationObserver` по всему `hero` (`childList` + `subtree`), который висел
только ради ре-биндинга кнопки сабмита и срабатывал на каждом ре-рендере формы, заменён делегированием
клика. Ранние выходы `bindFormPopup` теперь возвращают cleanup-функцию вместо `undefined` (часть P1 №10).

Прочее: каскады `if` заменены таблицами (формы ответа API, раскладки клипов), продублированный `fetch`
сведён к `postJson`, ветки скрытия/подготовки сегментов — к `hideSegment`/`prepareSegments`/`animateLayer`.

### Этап 4 — жизненный цикл и надёжность ✅ завершён

| Шаг | Баг | Что сделано |
|-----|-----|-------------|
| 4.1 диагностика | P1 №16 | `logger.js` (`logWarning` — только в dev или при `kapsula.debug=1`, `logError` — всегда). `getScreenNodes` вместо молчаливого `null` печатает список отсутствующих узлов с селекторами. `console.*` в `kapsula.js`, `setupScreenFlow.js`, `bindFormPopup.js` переведены на logger. |
| 4.2 точки Embla | P1 №17 | `bindEmblaDots` возвращает unbind со снятием `off("select")`/`off("reInit")`; подключён в `setupScreenFlow` и `bindFormPopup`. |
| 4.3 cleanup-контракт | P1 №10 | `setupScreenFlow` возвращает функцию на **всех** ветках (`NOOP_CLEANUP`). Важно: при отсутствии узлов `transitionBound` больше не выставляется — повторный монтаж может сработать. |
| 4.4 глобалы хедера | P1 №12 | `setupHeaderUi`/`cleanupHeaderUi` + модульные `isHeaderUiBound`/`originalHeaderIconsPosition` заменены фабрикой `createHeaderUi()` с внутренним состоянием. Позиция иконок хранится маркером `<span data-kapsula-icons-anchor>` в DOM хоста вместо ссылки на `parent` — переживает ре-рендер React. |
| 4.5 flush персиста | P1 №18 | `persistFormValues` вынесен отдельно и вызывается на `pagehide` и `visibilitychange` (при `hidden`) синхронно, минуя `debounceTime(150)`. Слушатели снимаются через `subscriptions.add`. |

**Проверка в браузере** (Playwright CLI, `npm run test:serve`):
переходы hero → steps → styles → form отрабатывают, форма рендерит 8 секций;
выбор опции и немедленный `visibilitychange` пишет значение в sessionStorage
(`{"countries":["Таиланд"]}`) без ожидания debounce; 5 последовательных `reInit`
карусели не плодят точки (3 → 3). В консоли остались только артефакты
локального окружения (CORS на шрифт с `b2ccdn.coral.ru`).

**Побочно:** заведён тестовый стенд `tests/` (`host.html` + `serve.mjs`, скрипт `npm run test:serve`)
и правила в `.clinerules/playwright.md`. Стенд отдаёт блок по пути `/elite-service/constructor/`
и подкладывает заглушку `CoralRouteBus` — без этого точка входа не активируется.
Грабли: `String.replace` со строкой замены трактует `$&`/`` $` ``/`$'`, из-за чего минифицированный
бандл искажался и падал с `SyntaxError` — замена выполняется только функцией.

### Этап 5 — рендер формы ✅ завершён

| Шаг | Баг | Что сделано |
|-----|-----|-------------|
| 5.1 порядок опций | P1 №8 | `syncOptionsNode` вместо безусловного `append` (всегда перемещение узла) вставляет через `insertBefore` только там, где порядок разошёлся с нужным: `optionsNode.children[index] !== optionNode`. |
| 5.2 summary vs ошибка | P1 №13 | Ошибка вынесена в отдельный узел `[data-kapsula-section-error]` со своей строкой грида (`grid-row: 3`) и `role="alert"`. `renderFormValidationErrors` больше не трогает summary, `ensureSectionSummary` — не сбрасывает `is-invalid`. Класс `.is-invalid` у summary упразднён. |
| 5.3 анимация секций | — | `animateFormSections` пропускает секции, у которых не изменились ни `expanded`, ни значение: раньше по каждой прогонялся `gsap.set` по пяти узлам на каждом рендере. |
| 5.4 версия схемы | P1 №15 | Ключи значений и активной секции переехали на `kapsula.v2.*` (`SESSION_SCHEMA_VERSION` в `constants.js`). Старые ключи читаются один раз для миграции. `buildInitialValues` дополнительно отсеивает опции, которых больше нет в конфиге — раньше удалённая из `formConfig.json` опция оставалась в состоянии и попадала в summary и в лид. |

**Проверка в браузере** (Playwright CLI): 26 узлов опций переживают клик без пересоздания
и с сохранением порядка (`preserved: 26, orderKept: true`); при показе ошибок валидации summary
первой секции («Таиланд») остаётся на месте — раньше затирался; заполнение проблемной секции
скрывает её ошибку, не трогая соседние; в sessionStorage только `kapsula.v2.formValues.asian`.
Вёрстка проверена скриншотом на 1440×900: summary и сообщение об ошибке занимают разные строки
и не накладываются.

**Замечание по ходу:** `createNode` принимает `hidden` только внутри `attributes` — переданный
на верхнем уровне флаг молча игнорировался, узлы ошибок создавались видимыми. Поймано прогоном
в браузере (`allHidden: false`), исправлено.

### Следующий шаг
Этап 6 (опциональный) — типы и качество: `src/types/kapsula.d.ts` с доменными моделями,
точечный `// @ts-check`, zod-схема самого `formConfig` с валидацией в dev.
Из P1 остаются незакрытыми №11 (`restoreScreen` минует `getMotionOffset`), №14 (`preventDefault`
на карточке стиля ломает открытие в новой вкладке) и №19 (видео под формой при `?screen=form`).
