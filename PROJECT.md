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
- нельзя шуметь в консоль хоста → диагностика через [`logger.js`](src/scripts/kapsula/logger.js),
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

Дальше управление уходит в [`setupScreenFlow.js`](src/scripts/kapsula/setupScreenFlow.js) —
он собирает экраны, форму, карусели и попап.

---

## Ключевые файлы

### Конфигурация — начните отсюда

| Файл | Что внутри |
|------|-----------|
| [`src/scripts/formConfig.json`](src/scripts/formConfig.json) | **Главный конфиг.** Все капсулы, секции, опции, картинки, endpoint отправки, тема письма и адрес получателя |
| [`src/scripts/kapsula/constants.js`](src/scripts/kapsula/constants.js) | Медиазапросы, id счётчика, селекторы хедера, ключи sessionStorage, версия схемы |
| [`src/scripts/kapsula/animationConfig.js`](src/scripts/kapsula/animationConfig.js) | Декларативное описание всех анимаций: селекторы, начальные значения, таймлайны |
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
| [`setupScreenFlow.js`](src/scripts/kapsula/setupScreenFlow.js) | Оркестрация: собирает всё воедино, возвращает общий cleanup |
| [`screenNodes.js`](src/scripts/kapsula/screenNodes.js) | Поиск узлов экранов, диагностика отсутствующих |
| [`screenRegistry.js`](src/scripts/kapsula/screenRegistry.js) | Реестр «экран → анимация» |
| [`screenTransition.js`](src/scripts/kapsula/screenTransition.js) | Переходы и восстановление экрана из сессии |
| [`bindScreenActions.js`](src/scripts/kapsula/bindScreenActions.js) | Клики по кнопкам навигации |
| [`setupInitialScreenState.js`](src/scripts/kapsula/setupInitialScreenState.js) | Стартовое состояние до первой анимации |
| [`animateHero.js`](src/scripts/kapsula/animateHero.js) | Появление первого экрана |
| [`setupBackgroundVideo.js`](src/scripts/kapsula/setupBackgroundVideo.js) | Фоновое видео (ленивая загрузка) |

### Форма

| Файл | Ответственность |
|------|-----------------|
| [`createReactiveForm.js`](src/scripts/kapsula/createReactiveForm.js) | `BehaviorSubject` со стейтом `{capsuleId, values, expandedState, activeSectionId, touchedSections}` и подписки на него |
| [`renderForm.js`](src/scripts/kapsula/renderForm.js) | Императивный DOM-дифф (самый большой модуль, 471 строка) |
| [`formSchema.js`](src/scripts/kapsula/formSchema.js) | Доступ к конфигу: капсулы, endpoint, тема письма, начальные значения |
| [`formValues.js`](src/scripts/kapsula/formValues.js) | Чистые операции над значениями |
| [`formConditions.js`](src/scripts/kapsula/formConditions.js) | Правила `visibleWhen` / `hiddenWhen` для опций |
| [`formValidation.js`](src/scripts/kapsula/formValidation.js) | Валидация (zod) обязательных секций |
| [`animateFormSections.js`](src/scripts/kapsula/animateFormSections.js) | Раскрытие секций |
| [`formResponsiveImages.js`](src/scripts/kapsula/formResponsiveImages.js) | Подмена картинок под вьюпорт |
| [`animateFormImageOverlay.js`](src/scripts/kapsula/animateFormImageOverlay.js) | Коллаж выбранных опций поверх фото |
| [`overlay/`](src/scripts/kapsula/overlay/) | Геометрия клипов (чистые функции) и alt-тексты |

Поток данных однонаправленный: событие → изменение `state$` → подписка → рендер.

### Попап, лид и отели

| Файл | Ответственность |
|------|-----------------|
| [`bindFormPopup.js`](src/scripts/kapsula/bindFormPopup.js) | Оркестрация попапа: открытие, сабмит, состояния |
| [`popup/popupContactForm.js`](src/scripts/kapsula/popup/popupContactForm.js) | Схема валидации, маска телефона, рендер поля контакта, ошибки полей |
| [`popup/popupLeadPayload.js`](src/scripts/kapsula/popup/popupLeadPayload.js) | Сборка тела письма |
| [`sendKapsulaPopupForm.js`](src/scripts/kapsula/sendKapsulaPopupForm.js) | POST лида |
| [`createPopupHotelsLoader.js`](src/scripts/kapsula/createPopupHotelsLoader.js) | Рендер карточек отелей, скелетоны, ошибка |
| [`hotels/`](src/scripts/kapsula/hotels/) | `hotelsApi` · `hotelsSearchPayload` · `hotelsNormalize` · `hotelsCache` · `fetchKapsulaHotels` |

**Про способ связи.** Выбор «Email» меняет поле контакта: телефон и почта лежат в
`<template>` и пересоздаются, в DOM всегда ровно одно поле. Обязательным валидируется
только видимое, и в письмо уходит именно оно.

**Про отели.** Список берётся из `window.KAPSULA_HOTELS_CONFIG` (в dev — из
[`hotelsConfig.dev.js`](src/scripts/kapsula/hotelsConfig.dev.js)), затем обогащается
поиском по API. Тонкость: в конфиге id вида `13708-7-875-6`, а API возвращает `13708` —
всё после первого дефиса это метаданные локации, поэтому сопоставление идёт по первому
сегменту. Отель, не найденный в ответе, не рендерится.

### Инфраструктура

| Файл | Ответственность |
|------|-----------------|
| [`logger.js`](src/scripts/kapsula/logger.js) | `logWarning`/`logDebug` — только в dev или при `kapsula.debug=1`; `logError` — всегда |
| [`analytics.js`](src/scripts/kapsula/analytics.js) | `reachGoal()`, не падает без `ym` |
| [`sessionState.js`](src/scripts/kapsula/sessionState.js) | sessionStorage + query-параметры, миграция старых ключей |
| [`mediaQuery.js`](src/scripts/kapsula/mediaQuery.js) | Единый `matchMedia` с подпиской |
| [`motionPreferences.js`](src/scripts/kapsula/motionPreferences.js) | `prefers-reduced-motion` |
| [`imagePreloader.js`](src/scripts/kapsula/imagePreloader.js) | Общий кеш прелоада |
| [`setupHeaderUi.js`](src/scripts/kapsula/setupHeaderUi.js) | Логотип и кнопка в хедере хоста |
| [`syncEmblaCarousel.js`](src/scripts/kapsula/syncEmblaCarousel.js) · [`syncEmblaDots.js`](src/scripts/kapsula/syncEmblaDots.js) | Карусели на мобильном |

### Стили

[`src/styles/kapsula.scss`](src/styles/kapsula.scss) подключает партиалы из
[`src/styles/kapsula/`](src/styles/kapsula/). Начинать стоит с
[`_tokens.scss`](src/styles/kapsula/_tokens.scss) — там все CSS-переменные, и с
[`_media.scss`](src/styles/kapsula/_media.scss) — миксины брейкпоинтов
(`mobile-only` ≤992, `desktop` ≥993, `desktop-content` ≥1024).

[`_integrations.scss`](src/styles/kapsula/_integrations.scss) — правки под хост-сайт,
самое хрупкое место: селекторы завязаны на классы чужого приложения.

---

## Как проверять

```bash
npm test
npm run test:watch
```

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

Проект прошёл шесть этапов рефакторинга: хотфиксы, единые источники правды, разбор
«толстых» модулей, жизненный цикл, рендер формы. Подробности — в истории git
(коммиты `fix(kapsula):` и `refactor(kapsula):`).

Все известные дефекты из аудита закрыты. ESLint и Vitest настроены; следующим
инфраструктурным этапом остаётся поэтапное введение TypeScript.
