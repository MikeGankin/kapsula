# Архитектурная оценка структуры стилей и скриптов

Дата: 2026-09-04

Режим: Architecture Agent, только анализ

Scope: `src/styles/**`, `src/scripts/**` и непосредственно связанные build/test/config-файлы. Production-код и `graphify-out/**` не изменялись.

## 1. Цель и метод

Цель — оценить текущую организацию стилей и клиентских скриптов Kapsula, предложить практичные варианты реорганизации, которые пользователь сможет реализовать самостоятельно.

Сначала изучены `graphify-out/manifest.json`, `.graphify_analysis.json` и релевантные секции `GRAPH_REPORT.md`. Затем факты сверены по исходникам и контрактам сборки: `src/main.js`, `src/order.json`, генераторы индексов, CMS builder, block CLI, entry-файлы, импорты, тесты, ESLint/Vitest и `PROJECT.md`.

## 2. Ключевой вывод

Проблема не в самих корнях `styles/` и `scripts/`: они являются частью понятного block contract сборщика. Проблема внутри блока `kapsula`: 44 из 53 script-файлов лежат на одном уровне, а 17 style-partials сгруппированы только по типу файла, хотя код уже делится на устойчивые домены (screen flow, form, popup/hotels, header, shared infrastructure).

Рекомендуется сохранить стабильные entrypoints `src/scripts/kapsula.js` и `src/styles/kapsula.scss`, а их внутренности организовать feature-first. Это даёт основной выигрыш в навигации без изменения CMS/build-контракта и с меньшим blast radius.

## 3. Фактическая структура и точки входа

```text
src/
├── main.js
├── order.json                         # blocks: ["kapsula"]
├── scripts/
│   ├── index.js                       # generated; import ./kapsula.js
│   ├── kapsula.js                     # публичный default init блока
│   ├── formConfig.json                # проектная конфигурация формы
│   ├── kapsula/                       # 53 файла, 44 в корне
│   │   ├── hotels/                    # 5 файлов
│   │   ├── overlay/                   # 2 файла
│   │   └── popup/                     # 2 файла
│   └── utils/hostReactAppReady.js
├── styles/
│   ├── index.js                       # generated; import ./kapsula.scss
│   ├── kapsula.scss                   # публичный style entry блока
│   ├── _mixins.scss                   # shared, фактически нужен Kapsula form
│   └── kapsula/                       # 17 плоских partials
├── modules/form-configurator/         # отдельный reusable TS-модуль
└── utils/utils.js                     # импортируется scripts/kapsula.js
```

### Build contract

Для каждого ключа из `src/order.json` инфраструктура ожидает строго:

- `src/markup/<key>.html`;
- `src/styles/<key>.scss` или `.css`;
- `src/scripts/<key>.js` с default-функцией `init`.

`gen-styles-index.mjs`, `gen-scripts-index.mjs`, `build-cms.mjs`, `block-add.mjs` и `block-rename.mjs` кодируют этот контракт напрямую. Поэтому перенос самих `kapsula.scss`/`kapsula.js` в глубину требует менять пять build/CLI-сценариев и README. Внутренние импорты могут быть организованы свободно и Vite их соберёт.

### Runtime entry graph

`src/main.js` → generated `src/scripts/index.js` → `src/scripts/kapsula.js` → lifecycle host/header/root → `setupScreenFlow` → screen navigation, form, popup, carousel/background video. `createKapsulaForm.ts` связывает generic `src/modules/form-configurator/**` с Kapsula UI/effects/config.

### Style entry graph

`src/main.js` → generated `src/styles/index.js` → `src/styles/kapsula.scss` → 17 partials. Порядок подключений сейчас вручную задаёт cascade. `flatpickr.css` и Kapsula overrides календаря также подключены из entrypoint.

## 4. Что именно неудобно сейчас

1. **Плоский script namespace.** Имена 44 соседних файлов вынуждены кодировать действие (`create`, `setup`, `bind`, `sync`, `animate`), но почти не показывают домен. Связанные form/screen/shared-файлы визуально перемешаны.
2. **Группировка непоследовательна.** `hotels/`, `popup/`, `overlay/` уже выделены, но их orchestration-файлы остаются уровнем выше. Например, `bindFormPopup.js` и `createPopupHotelsLoader.js` отделены от `popup/`/`hotels/`.
3. **Styles и markup уже отражают features, scripts — частично.** Markup имеет `hero-screen`, `steps-screen`, `styles-screen`, `form-screen`, `popup`; SCSS имеет соответствующие partials, но JS не повторяет эту карту.
4. **Крупные style catch-all.** `_popup.scss` — около 740 строк, `_form-screen.scss` — около 307, `_form.scss` — около 279, `_calendar.scss` — около 225. Особенно `_popup.scss` объединяет layout, hotel cards, form controls, success state и responsive overrides.
5. **Смешаны уровни ответственности.** Рядом лежат composition roots, domain adapters, DOM/rendering, animation, host integration и infrastructure helpers.
6. **Неочевидная shared-зона.** Одновременно существуют `src/scripts/utils/hostReactAppReady.js` и `src/utils/utils.js`; текущий entry использует второй. Это создаёт сомнение, какой каталог является каноническим.
7. **Смешение JS/TS — симптом перехода, не причина для отдельной папки.** Делить `js/` и `ts/` не следует: язык реализации не является доменной границей.
8. **Порядок SCSS — скрытый контракт.** Перемещение безопасно только при сохранении порядка `@use`/CSS imports; произвольное создание barrel-файлов может поменять cascade.

## 5. Варианты

### Вариант A — feature-first внутри существующих entrypoints (рекомендован)

Сохранить `src/scripts/kapsula.js`, `src/styles/kapsula.scss`, `formConfig.json` и build scripts на местах. Внутри `kapsula/` сгруппировать файлы по пользовательским возможностям, а не по техническим глаголам.

Плюсы:

- минимальный риск: публичный контракт сборщика не меняется;
- дерево совпадает с markup и пользовательским flow;
- соседние JS/SCSS-файлы легче сопоставлять;
- можно мигрировать по одной feature и проверять после каждого шага;
- не требует новой зависимости или alias-resolver.

Минусы:

- JS и SCSS остаются в разных верхнеуровневых деревьях;
- некоторые helpers используются несколькими features и требуют дисциплины `shared/`;
- много относительных импортов изменится.

### Вариант B — лёгкая группировка по слоям

В scripts создать `app/`, `ui/`, `services/`, `state/`, `shared/`; в styles — `settings/`, `base/`, `components/`, `layouts/`, `integrations/`.

Плюсы:

- привычная layered-структура;
- просто определить технический тип нового файла;
- entrypoints и builder остаются неизменны.

Минусы:

- работа над одной feature прыгает между несколькими каталогами;
- orchestration часто неясно относить к `app`, `services` или `ui`;
- для текущего небольшого одно-блочного проекта слои дают меньше пользы, чем реальные домены.

Подходит, если команда мыслит прежде всего техническими слоями и ожидает много разных блоков с общими primitives.

### Вариант C — единый `src/blocks/kapsula/` с колокацией assets

Собрать markup, scripts и styles по features внутри одного блока, например `src/blocks/kapsula/features/form/{form.ts, form.scss, form.html}`. Build manifest указывает явные entrypoints.

Плюсы:

- максимальная cohesion: всё по Kapsula и по feature рядом;
- хорошая модель для нескольких крупных блоков;
- явный manifest может заменить convention-based lookup.

Минусы:

- высокий blast radius: нужно менять генераторы, CMS builder, block CLI, HMR, документацию и, вероятно, тестовые пути;
- усложняется generic шаблон, который сейчас намеренно прост: `<key>.html/.scss/.js`;
- сомнительная окупаемость при единственном block key.

Имеет смысл только если репозиторий станет платформой для нескольких сопоставимых сложных блоков. Сейчас не рекомендован.

### Вариант D — оставить дерево, добавить только локальные подкаталоги

Перенести лишь очевидные кластеры: screen flow, form, header; разбить только `_popup.scss`.

Плюсы:

- самый дешёвый и быстрый;
- минимальный diff импортов.

Минусы:

- сохраняет половинчатую модель и будущие споры, что группировать;
- дерево быстро снова станет плоским;
- не решает несоответствие между scripts/styles/markup системно.

Подходит как временный первый шаг, но не как целевое состояние.

## 6. Рекомендуемое целевое дерево

Это логическое дерево, не требование переименовать каждый файл сразу. Имена entrypoints оставлены неизменными.

```text
src/
├── scripts/
│   ├── kapsula.js                         # stable block init entry
│   ├── formConfig.json                    # пока stable content boundary
│   └── kapsula/
│       ├── app/
│       │   ├── setupScreenFlow.js
│       │   └── setupInitialScreenState.js
│       ├── features/
│       │   ├── hero/                      # animateHero, background video
│       │   ├── header/                    # header UI/logo/CTA
│       │   ├── navigation/                # actions/nodes/registry/transition
│       │   ├── form/
│       │   │   ├── createKapsulaForm.ts
│       │   │   ├── createReactiveForm.js
│       │   │   ├── renderForm.ts
│       │   │   ├── createCalendarContent.ts
│       │   │   ├── kapsulaFieldRenderers.ts
│       │   │   ├── kapsulaFormConfig.ts
│       │   │   ├── schema/                # schema/conditions/values/validation
│       │   │   └── effects/               # animations/images/overlay
│       │   └── popup/
│       │       ├── bindFormPopup.js
│       │       ├── sendKapsulaPopupForm.js
│       │       ├── contact/                # validation/payload
│       │       └── hotels/                 # loader/API/cache/normalize/config
│       └── shared/
│           ├── analytics.js
│           ├── animationConfig.js
│           ├── carousel/
│           ├── constants.js
│           ├── imagePreloader.js
│           ├── logger.js
│           ├── mediaQuery.js
│           ├── motionPreferences.js
│           └── sessionState.js
└── styles/
    ├── kapsula.scss                        # stable ordered style entry
    ├── _mixins.scss
    └── kapsula/
        ├── settings/                       # media, tokens
        ├── shared/                         # accessibility/button/copy/cards
        ├── features/
        │   ├── hero/_index.scss
        │   ├── header/_index.scss
        │   ├── navigation/                 # steps/styles screen/style card
        │   ├── form/                       # screen/controls/calendar
        │   └── popup/                      # layout/contact/hotel/responsive
        └── integrations/_coral.scss
```

### Правила дерева

- Не создавать `index.js` barrel-файлы автоматически. Для внутренних JS лучше прямые импорты: меньше циклов и понятнее dependency graph.
- В SCSS `_index.scss` допустим только внутри feature, если он содержит исключительно `@forward`/упорядоченные `@use` и порядок итогового CSS проверен.
- `shared/` — не склад. Файл переносится туда только если реально нужен минимум двум features.
- Не переносить generic `src/modules/form-configurator/**` обратно в scripts: это уже хорошая архитектурная граница.
- Не смешивать физическую реорганизацию с переписыванием логики или конвертацией всех JS в TS.

## 7. Поэтапная миграция

### Этап 0. Зафиксировать baseline

1. Завершить/закоммитить текущие незавершённые изменения: worktree сейчас существенно dirty, включая JS/TS, SCSS, tests, reports и `graphify-out`.
2. Запустить `npm test`, `npm run typecheck`, `npm run lint -- --quiet`.
3. Запустить `npm run gen:scripts` и `npm run gen:styles`; убедиться, что generated indexes не меняются.
4. Выполнить текущий ручной smoke через `npm run dev`.

### Этап 1. Закрепить архитектурное правило

1. Сохранить root entrypoints `scripts/kapsula.js` и `styles/kapsula.scss`.
2. Добавить в `PROJECT.md` короткую карту `app/features/shared` и правило размещения новых файлов.
3. Не менять build scripts: они не обязаны знать о внутреннем дереве блока.

### Этап 2. Перенести независимые кластеры scripts

Переносить отдельными коммитами в порядке от наименее связанного к composition roots:

1. `features/header`;
2. `features/hero`;
3. `features/navigation`;
4. `features/popup/contact` и `features/popup/hotels`;
5. `features/form/schema`, затем `effects`, затем form composition;
6. `shared`;
7. `app/setupScreenFlow` последним.

После каждого кластера обновлять production imports, test imports/mocks и специальные ESLint file globs (сейчас logger разрешён по точному пути).

### Этап 3. Перегруппировать styles без изменения CSS

1. Сначала только переместить маленькие partials и обновить пути `@use` в `kapsula.scss`.
2. Сохранить исходный порядок подключения по смыслу.
3. Отдельным следующим шагом разбить `_popup.scss`; переносить непрерывные блоки правил без переупорядочивания селекторов.
4. Затем при необходимости разбить `_form.scss`/`_form-screen.scss`.
5. Не менять значения, selectors, specificity или breakpoints в том же коммите.

### Этап 4. Устранить неоднозначные utils

Проверить, нужен ли `src/scripts/utils/hostReactAppReady.js` внешнему template contract. Если нет — отдельным изменением удалить дубликат или выбрать один канонический `src/shared/`/`src/utils/`. Это не следует совмещать с массовым перемещением Kapsula.

### Этап 5. Финальная документация

Обновить `PROJECT.md`, coverage/ESLint globs и пути в тестах. README менять только если пользовательский block contract поменялся; в рекомендованном варианте он не меняется.

## 8. Проверки после миграции

```bash
npm test
npm run typecheck
npm run lint -- --quiet
npm run gen:scripts
npm run gen:styles
git diff --check
```

Дополнительно проверить:

- generated indexes всё ещё импортируют `./kapsula.js` и `./kapsula.scss`;
- `npm run build` создаёт `@CMS/kapsula.html` с CSS и IIFE JS;
- visual smoke: hero → steps → styles → form → popup;
- три capsule-конфигурации, calendar, responsive images/overlay, hotel loading, submit states;
- desktop/mobile header integration, reduced motion, route change и повторную инициализацию/HMR;
- compiled CSS до/после семантически идентичен; минимум — screenshots ключевых viewport.

## 9. Основные риски

| Риск | Почему | Снижение риска |
|---|---|---|
| Нарушить block discovery | Builder ищет только top-level `<key>.js/.scss` | Не переносить entrypoints |
| Изменить cascade/specificity | SCSS entry задаёт порядок CSS | Сохранять порядок, styles переносить без edits |
| Сломать test mocks | Vitest mocks используют строковые относительные пути | `rg` по старому пути после каждого кластера |
| Пропустить config/lint glob | ESLint имеет точный путь к `logger.js` | Обновить конфиги в том же commit переноса |
| Создать import cycles | Barrel indexes скрывают реальные зависимости | Прямые импорты, не вводить JS barrels |
| Смешать migration и refactor | Большой diff трудно проверить | Только move + import update; логика отдельно |
| Потерять пользовательские изменения | Worktree уже dirty | Сначала завершить/зафиксировать текущую работу |
| Сломать host integration | Header/Coral selectors и lifecycle хрупкие | Ручной smoke на реальном сайте обязателен |

## 10. Решение

Выбрать вариант A. Он соответствует существующей архитектуре: generic block infrastructure остаётся convention-based, Kapsula сохраняет два стабильных публичных entrypoint, а сложность локализуется внутри домена. Реализовывать миграцию небольшими cluster-коммитами, сначала scripts, затем styles; не объединять перемещения с поведенческими изменениями.

## 11. Blockers

Архитектурных blockers нет. Операционный blocker перед началом реализации — текущий dirty worktree с незавершённой миграцией JS→TS и пользовательским изменением `_calendar.scss`. До массовых перемещений эти изменения нужно сохранить отдельным коммитом или иным надёжным checkpoint. Удаление/объединение двух utils-каталогов требует отдельной проверки template/external consumers; это не блокирует основную feature-first миграцию.
