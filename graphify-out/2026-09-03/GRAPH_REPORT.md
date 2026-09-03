# Graph Report - kapsula  (2026-09-03)

## Corpus Check
- 122 files · ~311,277 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1104 nodes · 1829 edges · 66 communities (63 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `302cbd05`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- setupHeaderUi.js
- _utils.mjs
- animateFormImageOverlay.js
- bindFormPopup.js
- Cookies
- scripts
- renderForm.js
- logWarning
- 18. Спринт 4 — impact analysis
- devDependencies
- rewriteAssetsBuild.mjs
- Commands
- block-add.mjs
- block-rename.mjs
- createReactiveForm.js
- main.js
- AGENTS.md
- Landing blocks / CMS-ready верстка
- Kapsula — карта проекта
- Browser Automation with playwright-cli
- 3. Heal
- Browser Session Management
- Выполненные проверки
- Running Custom Playwright Code
- Tracing
- Development report — Спринт 2
- План рефакторинга проекта Kapsula
- SKILL.md
- 14. Спринт 1 — impact analysis
- Визуальный аудит лендинга Kapsula
- Video Recording
- Advanced Mocking with run-code
- Спринт 3. Основа TypeScript
- 4. Целевая архитектура
- Спринт 0. Фиксация архитектуры и стабилизация baseline
- Спринт 1. Characterization-тесты формы
- Спринт 2. Разделение тестов и служебных инструментов
- Спринт 4. Выделение чистого ядра формы
- Спринт 5. Контракт и реестр типов полей
- Спринт 6. Декомпозиция runtime и DOM-renderer
- Спринт 7. Отделение Kapsula-специфичных эффектов
- Спринт 8. Завершение TypeScript-миграции затронутого runtime
- 12. Спринт 0 — impact analysis
- 15. Спринт 1 — feedback loop
- Спринт 9. Финальная проверка и документация
- 13. Спринт 0 — build blocker
- 3. Исходное состояние
- index.ts
- Ключевые файлы
- Тестирование в браузере (Playwright CLI)
- 16. Спринт 2 — impact analysis
- Работа с картинками
- CLI для блоков
- Скрипты (scripts)
- Rewrite путей картинок под CMS
- Разметка (markup)
- Проверка перед билдом
- compilerOptions
- Handoff: рефакторинг проекта Kapsula
- 17. Спринт 3 — impact analysis

## God Nodes (most connected - your core abstractions)
1. `План рефакторинга проекта Kapsula` - 29 edges
2. `bindFormPopup()` - 26 edges
3. `scripts` - 23 edges
4. `createReactiveForm()` - 23 edges
5. `logWarning()` - 21 edges
6. `setupScreenFlow()` - 20 edges
7. `Landing blocks / CMS-ready верстка` - 20 edges
8. `compilerOptions` - 16 edges
9. `Browser Automation with playwright-cli` - 15 edges
10. `Running Custom Playwright Code` - 13 edges

## Surprising Connections (you probably didn't know these)
- `createForm()` --calls--> `createReactiveForm()`  [EXTRACTED]
  tests/integration/createReactiveForm.test.js → src/scripts/kapsula/createReactiveForm.js
- `buildPayload()` --calls--> `buildManagerLeadPayload()`  [EXTRACTED]
  tests/unit/kapsula/popup/popupLeadPayload.test.js → src/scripts/kapsula/popup/popupLeadPayload.js
- `render()` --calls--> `renderForm()`  [EXTRACTED]
  tests/integration/renderForm.test.js → src/scripts/kapsula/renderForm.js
- `render()` --calls--> `sanitizeRichText()`  [EXTRACTED]
  tests/unit/kapsula/sanitizeRichText.test.js → src/scripts/kapsula/sanitizeRichText.js
- `parseFormConfigResult()` --calls--> `parseFormConfig()`  [EXTRACTED]
  tests/contract/formConfig.test.ts → src/modules/form-configurator/core/config.ts

## Import Cycles
- None detected.

## Communities (66 total, 3 thin omitted)

### Community 0 - "setupHeaderUi.js"
Cohesion: 0.08
Nodes (40): DESKTOP_MEDIA_QUERY, HEADER_SELECTORS, KAPSULA_ROOT_SELECTOR, METRIKA_COUNTER_ID, REDUCED_MOTION_MEDIA_QUERY, ROUTE_ATTRIBUTE, SESSION_SCHEMA_VERSION, URL_SEARCH_KEYS (+32 more)

### Community 1 - "_utils.mjs"
Cohesion: 0.08
Nodes (44): buildBlock(), bundleCssInline(), bundleJsInline(), MARKUP_DIR, ORDER_FILE, OUT_DIR, run(), SCRIPTS_DIR (+36 more)

### Community 2 - "animateFormImageOverlay.js"
Cohesion: 0.10
Nodes (44): animateFormImageOverlay(), animateImageParallax(), animateLayer(), animateLayerSegments(), animateLayerVisibility(), animateSegmentClip(), animateSingleLayerImage(), createLayer() (+36 more)

### Community 3 - "bindFormPopup.js"
Cohesion: 0.10
Nodes (37): bindFormPopup(), setPopupState(), buildCapsuleMap(), buildExpandedState(), filterRenderedFields(), getFormSubmitEndpoint(), getHotelsSettings(), getMailSubject() (+29 more)

### Community 4 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 5 - "scripts"
Cohesion: 0.05
Nodes (42): embla-carousel, express, flatpickr, gsap, dependencies, embla-carousel, express, flatpickr (+34 more)

### Community 6 - "renderForm.js"
Cohesion: 0.09
Nodes (37): createChevronNode(), createNode(), createOptionNode(), createOptionsContent(), createSectionError(), createSectionNode(), createSectionSubtitle(), createSectionSummary() (+29 more)

### Community 7 - "logWarning"
Cohesion: 0.09
Nodes (39): createCalendarContent(), normalizeCalendarValue(), createHotelCard(), createPopupHotelsLoader(), createSkeletonNode(), hasHotelLink(), fetchKapsulaHotels(), resolveHotelUrls() (+31 more)

### Community 8 - "18. Спринт 4 — impact analysis"
Cohesion: 0.17
Nodes (12): 18.1. Подтверждённая граница изменений, 18.2. Точная карта файлов, 18.3. Core API и типы, 18.4. Последовательность атомарных изменений, 18.5. Тестовая стратегия, 18.6. Риски и меры контроля, 18.7. Критерии приёмки, 18. Спринт 4 — impact analysis (+4 more)

### Community 9 - "devDependencies"
Cohesion: 0.05
Nodes (37): chokidar, concurrently, eslint, eslint-config-airbnb-extended, @eslint/js, eslint-plugin-import-x, globals, jsdom (+29 more)

### Community 10 - "rewriteAssetsBuild.mjs"
Cohesion: 0.19
Nodes (13): BASE, CMS_DIR, files, isRootRel(), isSkippable(), joinPrefix(), ORDER_FILE, prefixFromOrder (+5 more)

### Community 11 - "Commands"
Cohesion: 0.20
Nodes (10): Commands, Core, DevTools, Keyboard, Mouse, Navigation, Network, Save as (+2 more)

### Community 12 - "block-add.mjs"
Cohesion: 0.20
Nodes (9): exists(), MARKUP_DIR, order, ORDER_FILE, readOrder(), ROOT, SCRIPTS_DIR, STYLES_DIR (+1 more)

### Community 13 - "block-rename.mjs"
Cohesion: 0.22
Nodes (9): exists(), MARKUP_DIR, moveIfExists(), order, ORDER_FILE, readOrder(), ROOT, SCRIPTS_DIR (+1 more)

### Community 14 - "createReactiveForm.js"
Cohesion: 0.06
Nodes (65): reachGoal(), destroyFormImageOverlay(), animateFormSections(), animateSectionState(), animateSummaryReveal(), areSectionValuesEqual(), getSectionState(), getSummaryState() (+57 more)

### Community 15 - "main.js"
Cohesion: 0.28
Nodes (3): setupLocalCdnAssetRewrite(), mount(), hotelsByCountry

### Community 22 - "AGENTS.md"
Cohesion: 0.04
Nodes (44): Agent defaults, Agent delegation, Agent reports, Agent workflow, Architecture Agent, Changes, Code quality, Comments (+36 more)

### Community 23 - "Landing blocks / CMS-ready верстка"
Cohesion: 0.14
Nodes (14): CMS build, Dev-режим (Realtime), Landing blocks / CMS-ready верстка, order.json, Vue внутри блоков, Ключевая особенность проекта, Общая идея, Раздача картинок в dev (+6 more)

### Community 24 - "Kapsula — карта проекта"
Cohesion: 0.17
Nodes (10): Kapsula — карта проекта, Быстрый старт, Грабли, Известный шум в консоли, История, Как проверять, Пользовательский сценарий, Точка входа и жизненный цикл (+2 more)

### Community 25 - "Browser Automation with playwright-cli"
Cohesion: 0.14
Nodes (14): Browser Automation with playwright-cli, Browser Sessions, Example: Debugging with DevTools, Example: Form submission, Example: Interactive session, Example: Multi-tab workflow, Installation, Open parameters (+6 more)

### Community 26 - "3. Heal"
Cohesion: 0.09
Nodes (23): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, 2.1 Inputs, 2.2 Generate one scenario (+15 more)

### Community 27 - "Browser Session Management"
Cohesion: 0.10
Nodes (20): 1. Name Browser Sessions Semantically, 2. Always Clean Up, 3. Delete Stale Browser Data, A/B Testing Sessions, Attach by channel name, Attach via browser extension, Attach via CDP endpoint, Attaching to a Running Browser (+12 more)

### Community 28 - "Выполненные проверки"
Cohesion: 0.08
Nodes (23): Build — NOT VERIFIED / NOT APPLICABLE, Diff integrity — PASS, Diff integrity — PASS, ESLint — PASS, ESLint — PASS, Runtime Zod boundary и edge cases, Targeted contract + related runtime — PASS, Targeted core + facades + contract + integration — PASS (+15 more)

### Community 29 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 30 - "Tracing"
Cohesion: 0.12
Nodes (16): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+8 more)

### Community 31 - "Development report — Спринт 2"
Cohesion: 0.08
Nodes (23): Development report — Спринт 2, Development report — Спринт 3, Development report — Спринт 4, Implementation decisions, Implementation decisions, Выполненные проверки, Выполненные проверки, Выполненные проверки (+15 more)

### Community 32 - "План рефакторинга проекта Kapsula"
Cohesion: 0.18
Nodes (10): 10. Definition of Done всей программы, 11. Рекомендуемый следующий шаг, 1. Цель, 2. Ограничения, 5. План по спринтам, 6. Последовательность согласования, 7. Общие quality gates, 8. Ключевые архитектурные решения (+2 more)

### Community 33 - "SKILL.md"
Cohesion: 0.24
Nodes (4): Examples, Inspecting Element Attributes, Debugging Playwright Tests, Running Playwright Tests

### Community 34 - "14. Спринт 1 — impact analysis"
Cohesion: 0.20
Nodes (10): 14.1. Граница Спринта 1, 14.2. Минимальный набор файлов, 14.3. Точные characterization-сценарии, 14.4. Что уже покрыто и не дублируется, 14.5. Защита от хрупких тестов, 14.6. Рекомендации Developer Agent и проверки, 14. Спринт 1 — impact analysis, `createReactiveForm.test.js` (+2 more)

### Community 35 - "Визуальный аудит лендинга Kapsula"
Cohesion: 0.20
Nodes (9): Визуальный аудит лендинга Kapsula, Итог, Как воспроизвести, Как проводилось тестирование, Общие виды экранов, Проблема 1. Заголовок секции выходит за пределы кнопки, Проблема 2. Неравные колонки сетки на 1024px, Проблема 3. `100vh` без `dvh`-фолбэка (гипотеза) (+1 more)

### Community 36 - "Video Recording"
Cohesion: 0.22
Nodes (8): 1. Use Descriptive Filenames, 2. Record entire hero scripts., Basic Recording, Best Practices, Limitations, Overlay API Summary, Tracing vs Video, Video Recording

### Community 37 - "Advanced Mocking with run-code"
Cohesion: 0.25
Nodes (8): Advanced Mocking with run-code, CLI Route Commands, Conditional Response Based on Request, Delayed Response, Modify Real Response, Request Mocking, Simulate Network Failures, URL Patterns

### Community 38 - "Спринт 3. Основа TypeScript"
Cohesion: 0.29
Nodes (7): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 3. Основа TypeScript, Стратегия строгости

### Community 39 - "4. Целевая архитектура"
Cohesion: 0.33
Nodes (6): 4.1. Core, 4.2. Реестр типов полей, 4.3. Runtime, 4.4. Адаптеры, 4.5. Проектный слой Kapsula, 4. Целевая архитектура

### Community 40 - "Спринт 0. Фиксация архитектуры и стабилизация baseline"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 0. Фиксация архитектуры и стабилизация baseline

### Community 41 - "Спринт 1. Characterization-тесты формы"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 1. Characterization-тесты формы

### Community 42 - "Спринт 2. Разделение тестов и служебных инструментов"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 2. Разделение тестов и служебных инструментов

### Community 43 - "Спринт 4. Выделение чистого ядра формы"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 4. Выделение чистого ядра формы

### Community 44 - "Спринт 5. Контракт и реестр типов полей"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 5. Контракт и реестр типов полей

### Community 45 - "Спринт 6. Декомпозиция runtime и DOM-renderer"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 6. Декомпозиция runtime и DOM-renderer

### Community 46 - "Спринт 7. Отделение Kapsula-специфичных эффектов"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 7. Отделение Kapsula-специфичных эффектов

### Community 47 - "Спринт 8. Завершение TypeScript-миграции затронутого runtime"
Cohesion: 0.33
Nodes (6): Зачем, Критерии приёмки, Проверки, Работы, Риски, Спринт 8. Завершение TypeScript-миграции затронутого runtime

### Community 48 - "12. Спринт 0 — impact analysis"
Cohesion: 0.40
Nodes (5): 12.1. Состояние working tree, 12.2. Подтверждённый baseline, 12.3. Минимальный набор исправлений для Developer Agent, 12.4. Риски и контроль, 12. Спринт 0 — impact analysis

### Community 49 - "15. Спринт 1 — feedback loop"
Cohesion: 0.40
Nodes (5): 15.1. Классификация трёх пробелов, 15.2. Минимальное исправление, 15.3. Точные test-only изменения, 15.4. Риски и проверки, 15. Спринт 1 — feedback loop

### Community 50 - "Спринт 9. Финальная проверка и документация"
Cohesion: 0.40
Nodes (5): Зачем, Критерии приёмки, Проверки, Работы, Спринт 9. Финальная проверка и документация

### Community 51 - "13. Спринт 0 — build blocker"
Cohesion: 0.50
Nodes (4): 13.1. Причина и граница контракта, 13.2. Рекомендуемое минимальное решение, 13.3. Альтернатива, 13. Спринт 0 — build blocker

### Community 52 - "3. Исходное состояние"
Cohesion: 0.50
Nodes (4): 3.1. Архитектура, 3.2. Тесты и tooling, 3.3. Quality baseline, 3. Исходное состояние

### Community 53 - "index.ts"
Cohesion: 0.06
Nodes (58): getVisibleOptions(), isOptionVisible(), matchesFieldRule(), matchesRules(), toValueList(), baseFieldShape, capsuleSchema, conditionRuleSchema (+50 more)

### Community 54 - "Ключевые файлы"
Cohesion: 0.25
Nodes (8): Инфраструктура, Ключевые файлы, Конфигурация — начните отсюда, Попап, лид и отели, Разметка, Стили, Форма, Экраны и переходы

### Community 55 - "Тестирование в браузере (Playwright CLI)"
Cohesion: 0.29
Nodes (6): Запуск страницы, Известные шумы в консоли, Особенности окружения, Работа с браузером, Тестирование в браузере (Playwright CLI), Чего Playwright не покажет

### Community 56 - "16. Спринт 2 — impact analysis"
Cohesion: 0.33
Nodes (6): 16.1. Граница и подтверждённое состояние, 16.2. Точная карта перемещений, 16.3. Delete/update map, 16.4. Риски и меры контроля, 16.5. Рекомендации Developer Agent и проверки, 16. Спринт 2 — impact analysis

### Community 57 - "Работа с картинками"
Cohesion: 0.50
Nodes (4): SCSS миксин для фоновых картинок, Использование, Работа с картинками, Хранение

### Community 58 - "CLI для блоков"
Cohesion: 0.67
Nodes (3): CLI для блоков, Переименование блока, Создание блока

### Community 59 - "Скрипты (scripts)"
Cohesion: 0.67
Nodes (3): Контракт (ОБЯЗАТЕЛЬНО), Поведение, Скрипты (scripts)

### Community 63 - "compilerOptions"
Cohesion: 0.06
Nodes (30): @CMS, dist, DOM, DOM.Iterable, ES2022, graphify-out, node_modules, src/**/*.d.ts (+22 more)

### Community 64 - "Handoff: рефакторинг проекта Kapsula"
Cohesion: 0.11
Nodes (17): Handoff: рефакторинг проекта Kapsula, Архитектурный аудит и план, Изменённые файлы предыдущих спринтов, Исходная цель пользователя, Ключевые архитектурные решения, Ограничения, Последние подтверждённые проверки, Риски и blockers (+9 more)

### Community 65 - "17. Спринт 3 — impact analysis"
Cohesion: 0.22
Nodes (9): 17.1. Архитектурная граница, 17.2. Dependencies и package lock, 17.3. Точная карта файлов, 17.4. `tsconfig.json`: стратегия миграции, 17.5. Модель типов и runtime boundary, 17.6. ESLint и Vitest, 17.7. Contract tests, 17.8. Этапы Developer Agent, риски и gates (+1 more)

## Knowledge Gaps
- **529 isolated node(s):** `name`, `private`, `version`, `type`, `rewrite:images` (+524 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createReactiveForm()` connect `createReactiveForm.js` to `animateFormImageOverlay.js`, `bindFormPopup.js`, `index.ts`, `renderForm.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `logWarning()` connect `logWarning` to `setupHeaderUi.js`, `createReactiveForm.js`, `renderForm.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _529 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `setupHeaderUi.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._
- **Should `_utils.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._
- **Should `animateFormImageOverlay.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09693877551020408 - nodes in this community are weakly interconnected._
- **Should `bindFormPopup.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10460992907801418 - nodes in this community are weakly interconnected._