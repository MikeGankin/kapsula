# Kapsula — карта проекта

Стартовая точка для разработчика: что это, как запустить, где что лежит.

Про сам сборщик (блоки, `order.json`, CMS-билд, CDN) — в [README.md](README.md).
Этот файл — про лендинг «Капсула».

---

## Что это

Интерактивный конструктор «капсулы отдыха» для Coral Travel: пользователь проходит
четыре экрана, собирает пожелания к поездке и оставляет контакты. Лид уходит письмом
менеджеру, в попапе показываются подходящие отели.

Главная особенность: **это не самостоятельный сайт, а блок, встраиваемый в чужое
Next.js-приложение** (`coral.ru`). Отсюда почти все архитектурные решения:

- нельзя рассчитывать, что DOM хоста готов → ждём его и наблюдаем за появлением узлов;
- хост может ре-рендерить дерево в любой момент → всё, что мы вешаем, должно уметь
  переинициализироваться и убирать за собой;
- нельзя шуметь в консоль хоста → диагностика через [`logger.js`](src/scripts/kapsula/shared/logger.js),
  в проде молчит.

Два режима поставки:

| Режим | Как работает | Точка входа |
|-------|--------------|-------------|
| dev | userscript через `vite-plugin-monkey`, разметка монтируется в `#monkey-app` | [`src/main.js`](src/main.js) |
| prod | самодостаточный HTML со встроенными `<style>` и `<script>` | `@CMS/kapsula.html` (генерируется) |

---

## Быстрый старт

```bash
npm install

npm run dev         # realtime-верстка на боевом сайте через Tampermonkey
npm test            # разовый прогон Vitest
npm run test:watch  # Vitest в watch-режиме
npm run build       # сборка блока в @CMS/
```

Node стоит под nvm и недоступен в неинтерактивном шелле — перед `node`/`npm` подгрузите
окружение: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`.

**Отладка.** Логи по умолчанию выключены. Включить на любой странице:

```js
localStorage.setItem("kapsula.debug", "1"); // и перезагрузить
```

После этого в консоли видно payload лида, сырой ответ поиска отелей и предупреждения
о ненайденных узлах.

---

## Пользовательский сценарий

```
hero → steps → styles → form → попап с контактами → письмо менеджеру
```

Текущий экран хранится в `hero.dataset.screen`, переходы — GSAP-таймлайны.
Состояние переживает перезагрузку: sessionStorage + query-параметры `?screen=&capsule=`.

Три капсулы (стиля отдыха): `asian`, `oriental`, `island`. Набор секций и опций
для каждой описан данными, а не кодом.

---

## Точка входа и жизненный цикл

[`src/scripts/kapsula.js`](src/scripts/kapsula.js) — RxJS-обвязка над хостом:

1. ждёт готовности React-приложения (`hostReactAppReady`);
2. наблюдает за появлением `[data-kapsula-hero]` и узлов хедера;
3. слушает `CoralRouteBus` — при уходе с маршрута снимает UI хедера;
4. держит `Subscription` и `Map` cleanup-ов по корневым узлам.

**Контракт модулей:** любая функция `setup*` / `bind*` возвращает функцию-cleanup —
в том числе на ранних выходах (там `NOOP_CLEANUP`). Иначе при повторном монтаже
останется выставленный флаг `dataset.*Bound`, и блок молча не инициализируется.

Дальше управление уходит в [`setupScreenFlow.js`](src/scripts/kapsula/app/setupScreenFlow.js) —
он собирает экраны, форму, карусели и попап.

---

## Ключевые файлы

### Конфигурация — начните отсюда

| Файл | Что внутри |
|------|-----------|
| [`src/scripts/formConfig.json`](src/scripts/formConfig.json) | **Главный конфиг.** Все капсулы, секции, опции, картинки, endpoint отправки, тема письма и адрес получателя |
| [`src/scripts/kapsula/shared/constants.js`](src/scripts/kapsula/shared/constants.js) | Медиазапросы, id счётчика, селекторы хедера, ключи sessionStorage, версия схемы |
| [`src/scripts/kapsula/shared/animationConfig.js`](src/scripts/kapsula/shared/animationConfig.js) | Декларативное описание всех анимаций: селекторы, начальные значения, таймлайны |
| [`src/order.json`](src/order.json) | Список блоков и `assetsPrefix` для CDN |

Большинство продуктовых правок (тексты, опции, картинки, куда слать письмо) — это
правка JSON, а не кода.

### Разметка

[`src/markup/kapsula.html`](src/markup/kapsula.html) — корень, собирает экраны через `<include>`:

- [`hero-screen.html`](src/markup/kapsula/hero-screen.html) — первый экран
- [`steps-screen.html`](src/markup/kapsula/steps-screen.html) — как это работает
- [`styles-screen.html`](src/markup/kapsula/styles-screen.html) — выбор стиля отдыха
- [`form-screen.html`](src/markup/kapsula/form-screen.html) — конструктор (форма рендерится из JS)
- [`popup.html`](src/markup/kapsula/popup.html) — контакты, отели, экран благодарности

Форма и карточки отелей строятся скриптами; в разметке для них — контейнеры и `<template>`.

### Экраны и переходы

| Файл | Ответственность |
|------|-----------------|
| [`setupScreenFlow.js`](src/scripts/kapsula/app/setupScreenFlow.js) | Оркестрация: собирает всё воедино, возвращает общий cleanup |
| [`screenNodes.js`](src/scripts/kapsula/features/navigation/screenNodes.js) | Поиск узлов экранов, диагностика отсутствующих |
| [`screenRegistry.js`](src/scripts/kapsula/features/navigation/screenRegistry.js) | Реестр «экран → анимация» |
| [`screenTransition.js`](src/scripts/kapsula/features/navigation/screenTransition.js) | Переходы и восстановление экрана из сессии |
| [`bindScreenActions.js`](src/scripts/kapsula/features/navigation/bindScreenActions.js) | Клики по кнопкам навигации |
| [`setupInitialScreenState.js`](src/scripts/kapsula/app/setupInitialScreenState.js) | Стартовое состояние до первой анимации |
| [`animateHero.js`](src/scripts/kapsula/features/hero/animateHero.js) | Появление первого экрана |
| [`setupBackgroundVideo.js`](src/scripts/kapsula/features/hero/setupBackgroundVideo.js) | Фоновое видео (ленивая загрузка) |

### Форма

Граница конфигурации проходит так: `formConfig.json` →
[`kapsulaFormConfig.ts`](src/scripts/kapsula/features/form/kapsulaFormConfig.ts) →
`parseFormConfig()` → `FormConfig`. Парсер проверяет конфигурацию до запуска UI,
завершается с ошибкой на invalid config и сохраняет проектные ключи верхнего уровня
(включая `hotels`, mail, popup и endpoint). Generic runtime знает только модель формы.

Канонический generic API находится в
[`src/modules/form-configurator/index.ts`](src/modules/form-configurator/index.ts):
чистое core/domain, реестр типов и DOM-renderer seam. Runtime возвращает
`FormExperience` с `FormSnapshot`, командами изменения состояния и lifecycle.
Проектный composition root —
[`createKapsulaForm.ts`](src/scripts/kapsula/features/form/createKapsulaForm.ts): он подключает
проверенный config, renderer, effects и session adapter. Production consumer —
[`setupScreenFlow.js`](src/scripts/kapsula/app/setupScreenFlow.js).

| Файл | Ответственность |
|------|-----------------|
| [`createKapsulaForm.ts`](src/scripts/kapsula/features/form/createKapsulaForm.ts) | Composition root формы: state, команды, renderer, effects, persistence и lifecycle |
| [`renderForm.ts`](src/scripts/kapsula/features/form/renderForm.ts) | Совместимый Kapsula-адаптер DOM-renderer; incremental sync и validation errors |
| [`createCalendarContent.ts`](src/scripts/kapsula/features/form/createCalendarContent.ts) | Kapsula-адаптер календаря и Flatpickr lifecycle |
| [`createReactiveForm.js`](src/scripts/kapsula/features/form/createReactiveForm.js) | Compatibility facade для прежнего consumer/test contract; alias над `createKapsulaForm` |
| [`formSchema.js`](src/scripts/kapsula/features/form/schema/formSchema.js) | Доступ к конфигу: капсулы, endpoint, тема письма, начальные значения |
| [`formValues.js`](src/scripts/kapsula/features/form/schema/formValues.js) | Чистые операции над значениями |
| [`formConditions.js`](src/scripts/kapsula/features/form/schema/formConditions.js) | Правила `visibleWhen` / `hiddenWhen` для опций |
| [`formValidation.js`](src/scripts/kapsula/features/form/schema/formValidation.js) | Валидация (zod) обязательных секций |
| [`animateFormSections.js`](src/scripts/kapsula/features/form/effects/animateFormSections.js) | Раскрытие секций |
| [`formResponsiveImages.js`](src/scripts/kapsula/features/form/effects/formResponsiveImages.js) | Подмена картинок под вьюпорт |
| [`animateFormImageOverlay.js`](src/scripts/kapsula/features/form/effects/animateFormImageOverlay.js) | Коллаж выбранных опций поверх фото |
| [`overlay/`](src/scripts/kapsula/features/form/effects/overlay/) | Геометрия клипов (чистые функции) и alt-тексты |

Поток данных однонаправленный: событие → изменение `state$` → подписка → рендер.

Runtime сохраняет три независимых RxJS pipeline (shell; render → sections; overlay),
идемпотентный `destroy()`, tolerant-поведение для optional overlay/submit nodes и
точно однократную очистку Flatpickr. Session persistence использует схему v2 и
ключи текущего контракта; старые ключи мигрируются при чтении.

Production JSON поддерживает типы полей `cards`, `textarea`, `text`, `calendar`.
Добавление нового production-типа требует отдельного изменения config schema,
domain definition (initial/normalize/validate/serialize/summarize), DOM renderer и
тестов. Isolated custom-registry test не расширяет production config автоматически.

### Попап, лид и отели

| Файл | Ответственность |
|------|-----------------|
| [`bindFormPopup.js`](src/scripts/kapsula/features/popup/bindFormPopup.js) | Оркестрация попапа: открытие, сабмит, состояния |
| [`contact/popupContactForm.js`](src/scripts/kapsula/features/popup/contact/popupContactForm.js) | Схема валидации, маска телефона, рендер поля контакта, ошибки полей |
| [`contact/popupLeadPayload.js`](src/scripts/kapsula/features/popup/contact/popupLeadPayload.js) | Сборка тела письма |
| [`sendKapsulaPopupForm.js`](src/scripts/kapsula/features/popup/sendKapsulaPopupForm.js) | POST лида |
| [`createPopupHotelsLoader.js`](src/scripts/kapsula/features/popup/hotels/createPopupHotelsLoader.js) | Рендер карточек отелей, скелетоны, ошибка |
| [`hotels/`](src/scripts/kapsula/features/popup/hotels/) | `hotelsApi` · `hotelsSearchPayload` · `hotelsNormalize` · `hotelsCache` · `fetchKapsulaHotels` |

**Про способ связи.** Выбор «Email» меняет поле контакта: телефон и почта лежат в
`<template>` и пересоздаются, в DOM всегда ровно одно поле. Обязательным валидируется
только видимое, и в письмо уходит именно оно.

**Про отели.** Список берётся из `window.KAPSULA_HOTELS_CONFIG` (в dev — из
[`hotelsConfig.dev.js`](src/scripts/kapsula/features/popup/hotels/hotelsConfig.dev.js)), затем обогащается
поиском по API. Тонкость: в конфиге id вида `13708-7-875-6`, а API возвращает `13708` —
всё после первого дефиса это метаданные локации, поэтому сопоставление идёт по первому
сегменту. Отель, не найденный в ответе, не рендерится.

### Инфраструктура

| Файл | Ответственность |
|------|-----------------|
| [`logger.js`](src/scripts/kapsula/shared/logger.js) | `logWarning`/`logDebug` — только в dev или при `kapsula.debug=1`; `logError` — всегда |
| [`analytics.js`](src/scripts/kapsula/shared/analytics.js) | `reachGoal()`, не падает без `ym` |
| [`sessionState.js`](src/scripts/kapsula/shared/sessionState.js) | sessionStorage + query-параметры, миграция старых ключей |
| [`mediaQuery.js`](src/scripts/kapsula/shared/mediaQuery.js) | Единый `matchMedia` с подпиской |
| [`motionPreferences.js`](src/scripts/kapsula/shared/motionPreferences.js) | `prefers-reduced-motion` |
| [`imagePreloader.js`](src/scripts/kapsula/shared/imagePreloader.js) | Общий кеш прелоада |
| [`setupHeaderUi.js`](src/scripts/kapsula/features/header/setupHeaderUi.js) | Обработчик кнопки связи в HTML-хедере |
| [`syncEmblaCarousel.js`](src/scripts/kapsula/shared/carousel/syncEmblaCarousel.js) · [`syncEmblaDots.js`](src/scripts/kapsula/shared/carousel/syncEmblaDots.js) | Карусели на мобильном |

### Стили

[`src/styles/kapsula.scss`](src/styles/kapsula.scss) подключает партиалы из
[`src/styles/kapsula/`](src/styles/kapsula/). Начинать стоит с
[`_tokens.scss`](src/styles/kapsula/settings/_tokens.scss) — там все CSS-переменные, и с
[`_media.scss`](src/styles/kapsula/settings/_media.scss) — миксины брейкпоинтов
(`mobile-only` ≤992, `desktop` ≥993, `desktop-content` ≥1024).

[`_coral.scss`](src/styles/kapsula/integrations/_coral.scss) — правки под хост-сайт,
самое хрупкое место: селекторы завязаны на классы чужого приложения.

---

## Как проверять

```bash
npm test
npm run test:watch
npm run typecheck
npm run lint -- --quiet
npm run gen:scripts       # src/scripts/index.js должен остаться без diff
git diff --check
```

Для ручного smoke-теста запускайте `npm run dev`, затем проверьте три капсулы,
карточки, text/textarea/calendar, persistence, popup и повторную инициализацию.
`npm run build` и preview сейчас не являются gate: они исключены действующим
template/build contract, а отдельного preview-скрипта в `package.json` нет.

Юнит-тесты находятся в `tests/unit/`, интеграционные characterization-тесты формы —
в `tests/integration/`, общие данные и helpers — в `tests/fixtures/` и `tests/helpers/`.
После каждого спринта запустите `npm run dev` и визуально проверьте изменения на
боевом сайте через Tampermonkey.

### Известный шум в консоли

Не дефекты блока, а артефакты локального окружения: CORS на шрифт с `b2ccdn.coral.ru`
и 404 на `/favicon.ico`.

### Чего не видно в браузере на десктопе

Разница `100vh` и `dvh` на мобильных: сворачивающаяся адресная строка есть только на
реальном устройстве. Экраны формы и шагов проверяйте руками на телефоне.

---

## Грабли

- **`overflow: hidden` у предка ломает `position: sticky`** — элемент начинает липнуть
  к границе контейнера, а не к вьюпорту. На экране формы обрезка снята намеренно.
- **`position: absolute` у `.kapsula__inner`** не даёт странице расти по содержимому,
  из-за чего нет прокрутки окна. На мобильном экран формы возвращён в поток.
- **Кеш отелей** живёт 15 минут в sessionStorage. При проверках открывайте приватное окно,
  иначе увидите прошлый ответ.
- **`hidden` в `createNode`** принимается только внутри `attributes`; на верхнем уровне
  флаг молча игнорируется.

---

## История

Проект прошёл последовательные этапы рефакторинга: хотфиксы, единые источники правды,
разбор «толстых» модулей, lifecycle, выделение core и TypeScript runtime boundaries.
Подробности — в истории git
(коммиты `fix(kapsula):` и `refactor(kapsula):`).

Все известные дефекты из аудита закрыты. Core и runtime-границы постепенно переведены
на TypeScript; compatibility facades оставлены для безопасной миграции consumers.
