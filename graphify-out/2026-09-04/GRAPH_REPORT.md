# Graph Report - kapsula  (2026-09-04)

## Corpus Check
- 142 files · ~324,056 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1316 nodes · 2227 edges · 97 communities (85 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4bbc8aa9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- setupHeaderUi.js
- _utils.mjs
- animateFormImageOverlay.js
- bindFormPopup.js
- Cookies
- scripts
- animateFormSections.js
- logWarning
- 18. Спринт 4 — impact analysis
- devDependencies
- rewriteAssetsBuild.mjs
- Аудит cleanup-спринта: переход на новый шаблон builder
- block-add.mjs
- block-rename.mjs
- setupScreenFlow.js
- main.js
- AGENTS.md
- Landing blocks / CMS-ready верстка
- Kapsula — карта проекта
- Browser Automation with playwright-cli
- 3. Heal
- Browser Session Management
- Testing report — Спринт 6
- Running Custom Playwright Code
- Tracing
- Development report — Спринт 7
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
- 22. Спринт 8 — impact analysis завершения TypeScript-миграции form runtime
- 3. Исходное состояние
- Commands
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
- Handoff: рефакторинг Kapsula после Спринта 6
- 17. Спринт 3 — impact analysis
- config.ts
- index.ts
- CapsuleConfig
- fieldRenderers.ts
- 19. Спринт 5 — impact analysis
- FieldValue
- values.ts
- Development report — Спринт 6
- renderer.ts
- Development report — Спринт 2
- Development report — Спринт 4
- 20. Спринт 6 — impact analysis
- formRenderer.ts
- sessionState.js
- createKapsulaForm.ts
- createReactiveForm.test.js
- renderForm.ts
- 21. Спринт 7 — impact analysis отделения Kapsula-эффектов
- setupScreenFlow
- formConfig.test.ts
- FormValues
- createHeaderLogo.js
- Summary
- Development report — Спринт 5
- validation.ts
- development.md
- Development report — Спринт 3
- syncEmblaCarousel.js
- sanitizeRichText.js
- createKapsulaForm.test.ts

## God Nodes (most connected - your core abstractions)
1. `План рефакторинга проекта Kapsula` - 33 edges
2. `bindFormPopup()` - 26 edges
3. `FormValues` - 25 edges
4. `scripts` - 23 edges
5. `CapsuleConfig` - 21 edges
6. `createConfiguredForm()` - 21 edges
7. `logWarning()` - 20 edges
8. `setupScreenFlow()` - 20 edges
9. `Landing blocks / CMS-ready верстка` - 20 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `RatingField` --inherits--> `BaseFieldConfig`  [EXTRACTED]
  tests/unit/form-configurator/fieldTypes.test.ts → src/modules/form-configurator/core/types.ts
- `createForm()` --calls--> `createConfiguredForm()`  [EXTRACTED]
  tests/integration/createReactiveForm.test.js → src/scripts/kapsula/createKapsulaForm.ts
- `buildPayload()` --calls--> `buildManagerLeadPayload()`  [EXTRACTED]
  tests/unit/kapsula/popup/popupLeadPayload.test.js → src/scripts/kapsula/popup/popupLeadPayload.js
- `render()` --calls--> `renderForm()`  [EXTRACTED]
  tests/integration/renderForm.test.js → src/scripts/kapsula/renderForm.ts
- `render()` --calls--> `sanitizeRichText()`  [EXTRACTED]
  tests/unit/kapsula/sanitizeRichText.test.js → src/scripts/kapsula/sanitizeRichText.js

## Import Cycles
- None detected.

## Communities (97 total, 5 thin omitted)

### Community 0 - "setupHeaderUi.js"
Cohesion: 0.16
Nodes (22): DESKTOP_MEDIA_QUERY, REDUCED_MOTION_MEDIA_QUERY, createCallToActionButton(), getMediaQuery(), isDesktopViewport(), matchesMediaQuery(), mediaQueryCache, observeDesktopViewport() (+14 more)

### Community 1 - "_utils.mjs"
Cohesion: 0.08
Nodes (44): buildBlock(), bundleCssInline(), bundleJsInline(), MARKUP_DIR, ORDER_FILE, OUT_DIR, run(), SCRIPTS_DIR (+36 more)

### Community 2 - "animateFormImageOverlay.js"
Cohesion: 0.09
Nodes (46): animateFormImageOverlay(), animateImageParallax(), animateLayer(), animateLayerSegments(), animateLayerVisibility(), animateSegmentClip(), animateSingleLayerImage(), createLayer() (+38 more)

### Community 3 - "bindFormPopup.js"
Cohesion: 0.10
Nodes (38): bindFormPopup(), setPopupState(), buildCapsuleMap(), buildExpandedState(), buildInitialValues(), filterRenderedFields(), getDefaultCapsuleId(), getFormSubmitEndpoint() (+30 more)

### Community 4 - "Cookies"
Cohesion: 0.06
Nodes (35): Advanced: Multiple Cookies or Custom Options, Advanced: Multiple Operations, Authentication State Reuse, Clear All Cookies, Clear All localStorage, Clear sessionStorage, Common Patterns, Cookies (+27 more)

### Community 5 - "scripts"
Cohesion: 0.05
Nodes (42): embla-carousel, express, flatpickr, gsap, dependencies, embla-carousel, express, flatpickr (+34 more)

### Community 6 - "animateFormSections.js"
Cohesion: 0.24
Nodes (18): animateFormSections(), animateSectionState(), animateSummaryReveal(), areSectionValuesEqual(), getSectionState(), getSummaryState(), hasSummaryContent(), setIfPresent() (+10 more)

### Community 7 - "logWarning"
Cohesion: 0.09
Nodes (41): createHotelCard(), createPopupHotelsLoader(), createSkeletonNode(), hasHotelLink(), fetchKapsulaHotels(), resolveHotelUrls(), createHotelUrl(), fetchHotelRedirectUrl() (+33 more)

### Community 8 - "18. Спринт 4 — impact analysis"
Cohesion: 0.17
Nodes (12): 18.1. Подтверждённая граница изменений, 18.2. Точная карта файлов, 18.3. Core API и типы, 18.4. Последовательность атомарных изменений, 18.5. Тестовая стратегия, 18.6. Риски и меры контроля, 18.7. Критерии приёмки, 18. Спринт 4 — impact analysis (+4 more)

### Community 9 - "devDependencies"
Cohesion: 0.05
Nodes (37): chokidar, concurrently, eslint, eslint-config-airbnb-extended, @eslint/js, eslint-plugin-import-x, globals, jsdom (+29 more)

### Community 10 - "rewriteAssetsBuild.mjs"
Cohesion: 0.19
Nodes (13): BASE, CMS_DIR, files, isRootRel(), isSkippable(), joinPrefix(), ORDER_FILE, prefixFromOrder (+5 more)

### Community 11 - "Аудит cleanup-спринта: переход на новый шаблон builder"
Cohesion: 0.07
Nodes (29): 10. Blockers и решения, требующие подтверждения, 1. Цель и метод, 2. Ключевой вывод, 3.1 Удалить после переключения package scripts, 3.2 Удалить/пересобрать как generated/local state, 3.3 Зависимости старого сборщика — кандидаты на удаление, 3.4 Команды старого сборщика, 3. Артефакты старого сборщика (+21 more)

### Community 12 - "block-add.mjs"
Cohesion: 0.20
Nodes (9): exists(), MARKUP_DIR, order, ORDER_FILE, readOrder(), ROOT, SCRIPTS_DIR, STYLES_DIR (+1 more)

### Community 13 - "block-rename.mjs"
Cohesion: 0.22
Nodes (9): exists(), MARKUP_DIR, moveIfExists(), order, ORDER_FILE, readOrder(), ROOT, SCRIPTS_DIR (+1 more)

### Community 14 - "setupScreenFlow.js"
Cohesion: 0.15
Nodes (14): reachGoal(), KAPSULA_ANIMATION, bindScreenActions(), isPlainLeftClick(), METRIKA_STYLE_MAP, buildCapsuleHref(), buildScreenRegistry(), hideScreen() (+6 more)

### Community 15 - "main.js"
Cohesion: 0.32
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

### Community 28 - "Testing report — Спринт 6"
Cohesion: 0.12
Nodes (15): Feedback fix review, Testing report — Спринт 6, Testing report — Спринт 7, Testing report — Спринт 8, Выполненные проверки, Выполненные проверки, Выполненные проверки, Подтверждённые контракты (+7 more)

### Community 29 - "Running Custom Playwright Code"
Cohesion: 0.15
Nodes (13): Clipboard, Complex Workflows, Error Handling, File Downloads, Frames and Iframes, Geolocation, JavaScript Execution, Media Emulation (+5 more)

### Community 30 - "Tracing"
Cohesion: 0.12
Nodes (16): 1. Start Tracing Before the Problem, 2. Clean Up Old Traces, Analyzing Performance, Basic Usage, Best Practices, Capturing Evidence, Debugging Failed Actions, Limitations (+8 more)

### Community 31 - "Development report — Спринт 7"
Cohesion: 0.25
Nodes (8): Development report — Спринт 7, Implementation decisions, Выполненные проверки, Задачи Test Agent, Изменённые файлы, Ограничения и observations, Созданные файлы, Статус

### Community 32 - "План рефакторинга проекта Kapsula"
Cohesion: 0.13
Nodes (14): 10. Definition of Done всей программы, 11. Рекомендуемый следующий шаг, 13.1. Причина и граница контракта, 13.2. Рекомендуемое минимальное решение, 13.3. Альтернатива, 13. Спринт 0 — build blocker, 1. Цель, 2. Ограничения (+6 more)

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

### Community 51 - "22. Спринт 8 — impact analysis завершения TypeScript-миграции form runtime"
Cohesion: 0.18
Nodes (11): 22.10. Риски и меры контроля, 22.1. Исходная точка, классификация и граница, 22.2. Подтверждённые временные type gaps, 22.3. Целевые public contracts, 22.4. DOM query guards, 22.5. Файлы и rename/import strategy, 22.6. Compatibility facades и JS, который остаётся, 22.7. Generated import-index risk (+3 more)

### Community 52 - "3. Исходное состояние"
Cohesion: 0.50
Nodes (4): 3.1. Архитектура, 3.2. Тесты и tooling, 3.3. Quality baseline, 3. Исходное состояние

### Community 53 - "Commands"
Cohesion: 0.20
Nodes (10): Commands, Core, DevTools, Keyboard, Mouse, Navigation, Network, Save as (+2 more)

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

### Community 64 - "Handoff: рефакторинг Kapsula после Спринта 6"
Cohesion: 0.10
Nodes (19): Handoff: рефакторинг Kapsula после Спринта 6, Working tree и безопасность, Завершённые и принятые спринты, Исходная цель программы, Как продолжить в новом чате, Ключевые архитектурные решения, Обязательные ограничения, Отложенный cleanup-аудит нового шаблона (+11 more)

### Community 65 - "17. Спринт 3 — impact analysis"
Cohesion: 0.22
Nodes (9): 17.1. Архитектурная граница, 17.2. Dependencies и package lock, 17.3. Точная карта файлов, 17.4. `tsconfig.json`: стратегия миграции, 17.5. Модель типов и runtime boundary, 17.6. ESLint и Vitest, 17.7. Contract tests, 17.8. Этапы Developer Agent, риски и gates (+1 more)

### Community 66 - "config.ts"
Cohesion: 0.18
Nodes (10): baseFieldShape, capsuleSchema, conditionRuleSchema, fieldConditionsSchema, fieldOptionSchema, fieldSchema, formConfigSchema, nonEmptyString (+2 more)

### Community 67 - "index.ts"
Cohesion: 0.11
Nodes (27): builtInFieldTypes, builtInRegistry, calendarDefinition, cardsDefinition, createFieldTypeRegistry(), FieldTypeContext, FieldTypeRegistry, textareaDefinition (+19 more)

### Community 68 - "CapsuleConfig"
Cohesion: 0.16
Nodes (13): selectOption(), setFieldValue(), toggleSection(), CapsuleConfig, FormState, UpdateFormState, bindFormEvents(), BindFormEventsOptions (+5 more)

### Community 69 - "fieldRenderers.ts"
Cohesion: 0.20
Nodes (14): getVisibleOptions(), isOptionVisible(), matchesFieldRule(), matchesRules(), toValueList(), FieldOption, createBasicFieldRenderers(), node() (+6 more)

### Community 70 - "19. Спринт 5 — impact analysis"
Cohesion: 0.20
Nodes (10): 19.1. Цель и подтверждённая граница, 19.2. Архитектура без циклических импортов, 19.3. Минимальный API и типы, 19.4. Семантика built-in definitions, 19.5. Точная карта файлов, 19.6. Migration/wiring по атомарным шагам, 19.7. Compatibility strategy и тесты, 19.8. Риски, контроль и перенос в Спринт 6 (+2 more)

### Community 72 - "values.ts"
Cohesion: 0.28
Nodes (10): getFieldTypeDefinition(), createFormState(), getExpandedSectionId(), areValuesEqual(), buildExpandedState(), buildInitialValues(), isRendered(), normalizeFormValues() (+2 more)

### Community 73 - "Development report — Спринт 6"
Cohesion: 0.25
Nodes (8): Acceptance points, Development report — Спринт 6, Выполненные проверки, Задачи Test Agent, Изменённые файлы, Ограничения и observations, Созданные файлы, Статус

### Community 74 - "renderer.ts"
Cohesion: 0.15
Nodes (11): FieldRenderer, FieldRendererContext, FieldRenderHandle, createFieldRendererRegistry(), FieldRendererRegistry, createCalendarContent(), createCalendarContentHandle(), normalizeCalendarValue() (+3 more)

### Community 75 - "Development report — Спринт 2"
Cohesion: 0.25
Nodes (8): Development report — Спринт 2, Выполненные проверки, Задачи Test Agent, Обновлённые файлы, Ограничения и observations, Перемещённые тесты, Статус, Удалённые файлы и команда

### Community 76 - "Development report — Спринт 4"
Cohesion: 0.25
Nodes (8): Development report — Спринт 4, Implementation decisions, Выполненные проверки, Задачи Test Agent, Изменённые файлы, Ограничения и observations, Созданные файлы, Статус

### Community 77 - "20. Спринт 6 — impact analysis"
Cohesion: 0.17
Nodes (12): 20.10. Что отложить в Спринт 7, 20.11. Критерии приёмки, 20.1. Цель, сложность и подтверждённый blast radius, 20.2. Ownership и целевая граница, 20.3. Typed DOM renderer contract и lifecycle, 20.4. Сохранение DOM, CSS, ARIA, focus и validation contract, 20.5. Persistence lifecycle и delegated events, 20.6. Точная карта файлов (+4 more)

### Community 78 - "formRenderer.ts"
Cohesion: 0.54
Nodes (7): summarizeFieldValue(), chevron(), createSection(), Entry, error(), make(), summary()

### Community 79 - "sessionState.js"
Cohesion: 0.23
Nodes (15): SESSION_STORAGE_KEYS, readCurrentScreen(), readLegacyFormValues(), readSavedActiveSection(), readSavedFormValues(), readSelectedCapsule(), readSessionValue(), readUrlValue() (+7 more)

### Community 80 - "createKapsulaForm.ts"
Cohesion: 0.18
Nodes (11): buildCapsuleMap(), createConfiguredForm(), CreateKapsulaFormOptions, ElementConstructor, FormSessionAdapter, FormShellNodes, getCapsule(), initialId() (+3 more)

### Community 81 - "createReactiveForm.test.js"
Cohesion: 0.22
Nodes (6): createKapsulaForm(), kapsulaFormEffects, kapsulaFormRenderer, kapsulaFormSessionAdapter, createReactiveForm, effectMocks

### Community 82 - "renderForm.ts"
Cohesion: 0.21
Nodes (12): createFormRendererController(), controllers, destroyRenderedForm(), getController(), RendererController, renderForm(), renderFormValidationErrors(), RenderOptions (+4 more)

### Community 83 - "21. Спринт 7 — impact analysis отделения Kapsula-эффектов"
Cohesion: 0.17
Nodes (12): 21.10. Тесты и parity criteria, 21.11. Риски и защита, 21.1. Подтверждённая исходная точка и scope, 21.2. Текущие и целевые границы, 21.3. Контракт config composition, 21.4. Visual effects contract, 21.5. Session storage adapter, 21.6. Popup, lead payload и hotels (+4 more)

### Community 85 - "setupScreenFlow"
Cohesion: 0.21
Nodes (13): HEADER_SELECTORS, KAPSULA_ROOT_SELECTOR, METRIKA_COUNTER_ID, ROUTE_ATTRIBUTE, SESSION_SCHEMA_VERSION, URL_SEARCH_KEYS, createHostReady$(), kapsula() (+5 more)

### Community 86 - "formConfig.test.ts"
Cohesion: 0.39
Nodes (5): parseFormConfig(), kapsulaFormConfig, capsuleBase, expectIssuePath(), parseFormConfigResult()

### Community 87 - "FormValues"
Cohesion: 0.09
Nodes (12): FormValues, ValidationResult, FieldRenderContext, FormCommands, FormExperience, FormLifecycleHandle, FormSnapshot, FormEffectsAdapter (+4 more)

### Community 88 - "createHeaderLogo.js"
Cohesion: 0.70
Nodes (3): createHeaderLogo(), joinClasses(), createLogo()

### Community 89 - "Summary"
Cohesion: 0.50
Nodes (3): Summary, Проверки и ограничения, Статус

### Community 90 - "Development report — Спринт 5"
Cohesion: 0.25
Nodes (8): Development report — Спринт 5, Implementation decisions, Выполненные проверки, Задачи Test Agent, Изменённые файлы, Ограничения и observations, Созданные файлы, Статус

### Community 91 - "validation.ts"
Cohesion: 0.36
Nodes (4): buildCapsuleSchema(), buildSectionSchema(), capsuleSchemaCache, validateFormValues()

### Community 92 - "development.md"
Cohesion: 0.29
Nodes (6): Development report — Спринт 8, Observations и checklist Test Agent, Изменённый scope, Принятые и скорректированные partial-изменения, Проверки, Статус

### Community 93 - "Development report — Спринт 3"
Cohesion: 0.29
Nodes (7): Development report — Спринт 3, Implementation decisions, Выполненные проверки, Задачи Test Agent, Изменённые файлы, Ограничения и observations, Статус

### Community 94 - "syncEmblaCarousel.js"
Cohesion: 0.48
Nodes (5): createEmblaCarousel(), ensureViewportNode(), carouselRegistry, resolveOptions(), syncEmblaCarousel()

### Community 95 - "sanitizeRichText.js"
Cohesion: 0.43
Nodes (5): decodeEntities(), ENTITY_PATTERN, NAMED_ENTITIES, sanitizeRichText(), render()

## Knowledge Gaps
- **638 isolated node(s):** `name`, `private`, `version`, `type`, `rewrite:images` (+633 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 695 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `logWarning()` connect `logWarning` to `renderer.ts`, `setupScreenFlow`, `setupScreenFlow.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `План рефакторинга проекта Kapsula` connect `План рефакторинга проекта Kapsula` to `18. Спринт 4 — impact analysis`, `14. Спринт 1 — impact analysis`, `Спринт 3. Основа TypeScript`, `4. Целевая архитектура`, `Спринт 0. Фиксация архитектуры и стабилизация baseline`, `Спринт 1. Characterization-тесты формы`, `Спринт 2. Разделение тестов и служебных инструментов`, `Спринт 4. Выделение чистого ядра формы`, `Спринт 5. Контракт и реестр типов полей`, `Спринт 6. Декомпозиция runtime и DOM-renderer`, `Спринт 7. Отделение Kapsula-специфичных эффектов`, `Спринт 8. Завершение TypeScript-миграции затронутого runtime`, `12. Спринт 0 — impact analysis`, `15. Спринт 1 — feedback loop`, `Спринт 9. Финальная проверка и документация`, `22. Спринт 8 — impact analysis завершения TypeScript-миграции form runtime`, `3. Исходное состояние`, `16. Спринт 2 — impact analysis`, `17. Спринт 3 — impact analysis`, `19. Спринт 5 — impact analysis`, `20. Спринт 6 — impact analysis`, `21. Спринт 7 — impact analysis отделения Kapsula-эффектов`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `FormValues` connect `FormValues` to `index.ts`, `CapsuleConfig`, `fieldRenderers.ts`, `values.ts`, `renderer.ts`, `formRenderer.ts`, `createKapsulaForm.ts`, `renderForm.ts`, `validation.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _638 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `_utils.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._
- **Should `animateFormImageOverlay.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09176470588235294 - nodes in this community are weakly interconnected._
- **Should `bindFormPopup.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10034013605442177 - nodes in this community are weakly interconnected._