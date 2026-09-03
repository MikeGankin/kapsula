# Graph Report - kapsula  (2026-09-02)

## Corpus Check
- 108 files · ~303,575 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 941 nodes · 1560 edges · 54 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `302cbd05`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- setupHeaderUi.js
- _utils.mjs
- animateFormImageOverlay.js
- setupScreenFlow.js
- Cookies
- scripts
- renderForm.js
- bindFormPopup.js
- createReactiveForm.js
- devDependencies
- rewriteAssetsBuild.mjs
- animateFormSections.js
- block-add.mjs
- block-rename.mjs
- serve.mjs
- main.js
- AGENTS.md
- Landing blocks / CMS-ready верстка
- Kapsula — карта проекта
- Browser Automation with playwright-cli
- 3. Heal
- Browser Session Management
- Testing report — Спринт 1, повторная проверка feedback loop
- Running Custom Playwright Code
- Tracing
- Development report — Спринт 1
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
- Use Cases

## God Nodes (most connected - your core abstractions)
1. `bindFormPopup()` - 26 edges
2. `План рефакторинга проекта Kapsula` - 26 edges
3. `scripts` - 23 edges
4. `createReactiveForm()` - 22 edges
5. `logWarning()` - 21 edges
6. `setupScreenFlow()` - 20 edges
7. `Landing blocks / CMS-ready верстка` - 20 edges
8. `Browser Automation with playwright-cli` - 15 edges
9. `Running Custom Playwright Code` - 13 edges
10. `animateLayerSegments()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `render()` --calls--> `renderForm()`  [EXTRACTED]
  tests/integration/renderForm.test.js → src/scripts/kapsula/renderForm.js
- `createForm()` --calls--> `createReactiveForm()`  [EXTRACTED]
  tests/integration/createReactiveForm.test.js → src/scripts/kapsula/createReactiveForm.js
- `kapsula()` --calls--> `animateHero()`  [EXTRACTED]
  src/scripts/kapsula.js → src/scripts/kapsula/animateHero.js
- `kapsula()` --calls--> `logError()`  [EXTRACTED]
  src/scripts/kapsula.js → src/scripts/kapsula/logger.js
- `kapsula()` --calls--> `setupScreenFlow()`  [EXTRACTED]
  src/scripts/kapsula.js → src/scripts/kapsula/setupScreenFlow.js

## Import Cycles
- None detected.

## Communities (54 total, 0 thin omitted)

### Community 0 - "setupHeaderUi.js"
Cohesion: 0.08
Nodes (41): DESKTOP_MEDIA_QUERY, HEADER_SELECTORS, KAPSULA_ROOT_SELECTOR, METRIKA_COUNTER_ID, REDUCED_MOTION_MEDIA_QUERY, ROUTE_ATTRIBUTE, SESSION_SCHEMA_VERSION, URL_SEARCH_KEYS (+33 more)

### Community 1 - "_utils.mjs"
Cohesion: 0.08
Nodes (44): buildBlock(), bundleCssInline(), bundleJsInline(), MARKUP_DIR, ORDER_FILE, OUT_DIR, run(), SCRIPTS_DIR (+36 more)

### Community 2 - "animateFormImageOverlay.js"
Cohesion: 0.10
Nodes (44): animateFormImageOverlay(), animateImageParallax(), animateLayer(), animateLayerSegments(), animateLayerVisibility(), animateSegmentClip(), animateSingleLayerImage(), createLayer() (+36 more)

### Community 3 - "setupScreenFlow.js"
Cohesion: 0.06
Nodes (56): reachGoal(), KAPSULA_ANIMATION, bindScreenActions(), isPlainLeftClick(), METRIKA_STYLE_MAP, buildCapsuleHref(), createCalendarContent(), normalizeCalendarValue() (+48 more)

### Community 4 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 5 - "scripts"
Cohesion: 0.05
Nodes (42): embla-carousel, express, flatpickr, gsap, dependencies, embla-carousel, express, flatpickr (+34 more)

### Community 6 - "renderForm.js"
Cohesion: 0.10
Nodes (38): getVisibleOptions(), isOptionVisible(), matchesFieldRule(), matchesRules(), toValueList(), createChevronNode(), createNode(), createOptionNode() (+30 more)

### Community 7 - "bindFormPopup.js"
Cohesion: 0.12
Nodes (33): bindFormPopup(), setPopupState(), filterRenderedFields(), getFormSubmitEndpoint(), getMailSubject(), getMailTo(), getPopupFields(), isFieldRendered() (+25 more)

### Community 8 - "createReactiveForm.js"
Cohesion: 0.07
Nodes (47): destroyFormImageOverlay(), SESSION_STORAGE_KEYS, createFormState(), createReactiveForm(), getExpandedSectionId(), getFormSnapshot(), getOverlayLayers(), getPersistedOptionValues() (+39 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (33): chokidar, concurrently, eslint, eslint-config-airbnb-extended, @eslint/js, eslint-plugin-import-x, globals, jsdom (+25 more)

### Community 10 - "rewriteAssetsBuild.mjs"
Cohesion: 0.19
Nodes (13): BASE, CMS_DIR, files, isRootRel(), isSkippable(), joinPrefix(), ORDER_FILE, prefixFromOrder (+5 more)

### Community 11 - "animateFormSections.js"
Cohesion: 0.24
Nodes (18): animateFormSections(), animateSectionState(), animateSummaryReveal(), areSectionValuesEqual(), getSectionState(), getSummaryState(), hasSummaryContent(), setIfPresent() (+10 more)

### Community 12 - "block-add.mjs"
Cohesion: 0.20
Nodes (9): exists(), MARKUP_DIR, order, ORDER_FILE, readOrder(), ROOT, SCRIPTS_DIR, STYLES_DIR (+1 more)

### Community 13 - "block-rename.mjs"
Cohesion: 0.22
Nodes (9): exists(), MARKUP_DIR, moveIfExists(), order, ORDER_FILE, readOrder(), ROOT, SCRIPTS_DIR (+1 more)

### Community 14 - "serve.mjs"
Cohesion: 0.25
Nodes (10): __dirname, MIME_TYPES, PAGE_ROUTES, PUBLIC_DIR, readHotelsConfigStub(), renderPage(), resolvePublicPath(), ROOT (+2 more)

### Community 15 - "main.js"
Cohesion: 0.32
Nodes (3): setupLocalCdnAssetRewrite(), mount(), hotelsByCountry

### Community 22 - "AGENTS.md"
Cohesion: 0.06
Nodes (30): Agent delegation, Agent reports, Agent workflow, Architecture Agent, Changes, Code quality, Comments, Context limit (+22 more)

### Community 23 - "Landing blocks / CMS-ready верстка"
Cohesion: 0.07
Nodes (30): CLI для блоков, CMS build, Dev-режим (Realtime), Landing blocks / CMS-ready верстка, order.json, Rewrite путей картинок под CMS, SCSS миксин для фоновых картинок, Vue внутри блоков (+22 more)

### Community 24 - "Kapsula — карта проекта"
Cohesion: 0.07
Nodes (24): Запуск страницы, Известные шумы в консоли, Особенности окружения, Работа с браузером, Тестирование в браузере (Playwright CLI), Чего Playwright не покажет, Kapsula — карта проекта, Быстрый старт (+16 more)

### Community 25 - "Browser Automation with playwright-cli"
Cohesion: 0.08
Nodes (24): Browser Automation with playwright-cli, Browser Sessions, Commands, Core, DevTools, Example: Debugging with DevTools, Example: Form submission, Example: Interactive session (+16 more)

### Community 26 - "3. Heal"
Cohesion: 0.09
Nodes (23): 0. How generation works, 1.1 Prerequisite: workspace, 1.2 Prerequisite: seed test, 1.3 Explore the app, 1.4 Write the spec file, 1. Planning, 2.1 Inputs, 2.2 Generate one scenario (+15 more)

### Community 27 - "Browser Session Management"
Cohesion: 0.10
Nodes (20): 1. Name Browser Sessions Semantically, 2. Always Clean Up, 3. Delete Stale Browser Data, A/B Testing Sessions, Attach by channel name, Attach via browser extension, Attach via CDP endpoint, Attaching to a Running Browser (+12 more)

### Community 28 - "Testing report — Спринт 1, повторная проверка feedback loop"
Cohesion: 0.12
Nodes (16): Accessibility text renderer — PASS, Build/template — NOT VERIFIED / NOT APPLICABLE, Diff integrity — PASS, ESLint — PASS, Hidden `visibilitychange` — PASS, Pending debounce при `destroy()` — PASS, Targeted integration suites — PASS, Testing report — Спринт 1, повторная проверка feedback loop (+8 more)

### Community 29 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 30 - "Tracing"
Cohesion: 0.15
Nodes (12): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Basic Usage, Best Practices, Limitations, `resources/`, Trace Output Files, `trace-{timestamp}.network` (+4 more)

### Community 31 - "Development report — Спринт 1"
Cohesion: 0.17
Nodes (11): `createReactiveForm`, Development report — Спринт 1, Feedback loop Test Agent, `renderForm`, `sessionState`, Выполненные проверки, Задачи Test Agent, Изменённые файлы (+3 more)

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

### Community 53 - "Use Cases"
Cohesion: 0.50
Nodes (4): Analyzing Performance, Capturing Evidence, Debugging Failed Actions, Use Cases

## Knowledge Gaps
- **431 isolated node(s):** `name`, `private`, `version`, `type`, `rewrite:images` (+426 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `logWarning()` connect `setupScreenFlow.js` to `renderForm.js`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `План рефакторинга проекта Kapsula` connect `План рефакторинга проекта Kapsula` to `14. Спринт 1 — impact analysis`, `Спринт 3. Основа TypeScript`, `4. Целевая архитектура`, `Спринт 0. Фиксация архитектуры и стабилизация baseline`, `Спринт 1. Characterization-тесты формы`, `Спринт 2. Разделение тестов и служебных инструментов`, `Спринт 4. Выделение чистого ядра формы`, `Спринт 5. Контракт и реестр типов полей`, `Спринт 6. Декомпозиция runtime и DOM-renderer`, `Спринт 7. Отделение Kapsula-специфичных эффектов`, `Спринт 8. Завершение TypeScript-миграции затронутого runtime`, `12. Спринт 0 — impact analysis`, `15. Спринт 1 — feedback loop`, `Спринт 9. Финальная проверка и документация`, `13. Спринт 0 — build blocker`, `3. Исходное состояние`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _431 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `setupHeaderUi.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07764876632801161 - nodes in this community are weakly interconnected._
- **Should `_utils.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._
- **Should `animateFormImageOverlay.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09693877551020408 - nodes in this community are weakly interconnected._
- **Should `setupScreenFlow.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061052631578947365 - nodes in this community are weakly interconnected._