# Developer report: feature-first структура styles/scripts

Дата: 2026-09-04

Статус: реализация варианта A завершена, полный QA оставлен Test Agent.

## 1. Scope

Выполнена только физическая реорганизация внутренних файлов Kapsula и обновление путей. Поведение, публичные API, selectors, SCSS declarations и build contract не менялись.

Стабильными оставлены:

- `src/scripts/kapsula.js` — block runtime entry;
- `src/styles/kapsula.scss` — block style entry;
- `src/scripts/formConfig.json`;
- `src/modules/form-configurator/**`;
- `src/lib/**` и convention `<key>.html/.scss/.js`;
- `src/scripts/utils/**` и `src/utils/**` — неоднозначные utils не удалялись;
- `graphify-out/**` — не изменялся этой работой.

## 2. Новая структура scripts

```text
src/scripts/kapsula/
├── app/
│   ├── setupInitialScreenState.js
│   └── setupScreenFlow.js
├── features/
│   ├── hero/
│   ├── header/
│   ├── navigation/
│   ├── form/
│   │   ├── schema/
│   │   └── effects/overlay/
│   └── popup/
│       ├── contact/
│       └── hotels/
└── shared/
    └── carousel/
```

Группы:

- `app`: composition flow и initial state;
- `features/hero`: hero animation/background video;
- `features/header`: host header UI, logo и CTA;
- `features/navigation`: screen nodes/registry/transitions/actions и URL builder;
- `features/form`: Kapsula form composition, renderer/calendar adapters и compatibility facade;
- `features/form/schema`: проектные schema/value/condition/validation facades;
- `features/form/effects`: section/overlay/responsive-image effects;
- `features/popup/contact`: contact field validation и lead payload;
- `features/popup/hotels`: loader, config, API, cache и normalization;
- `shared`: constants, session, logger, analytics, media/motion, animation config и image preload;
- `shared/carousel`: Embla creation/sync/dots.

Все относительные imports, dynamic import dev hotel config, JSDoc type imports, Vitest imports и mock paths обновлены.

## 3. Новая структура styles

```text
src/styles/kapsula/
├── settings/          # tokens, media
├── shared/            # accessibility, button, copy, card grids
├── features/
│   ├── hero/
│   ├── header/
│   ├── navigation/
│   ├── form/
│   └── popup/
└── integrations/      # _coral.scss
```

`src/styles/kapsula.scss` продолжает подключать partials в прежнем порядке. Изменены только import paths. Внутренние `@use "media"` заменены относительными путями до `settings/_media.scss`; form mixin path обновлён до сохранённого `src/styles/_mixins.scss`.

Крупные `_popup.scss`, `_form.scss`, `_form-screen.scss` и `_calendar.scss` только перемещены, но не разбиты: разделение содержимого в том же change увеличило бы риск изменения cascade. Пользовательская mobile-правка `_calendar.scss` сохранена в перемещённом файле.

## 4. Конфигурация и документация

Обновлены:

- `eslint.config.mjs`: специальное разрешение `console` теперь указывает на `src/scripts/kapsula/shared/logger.js`;
- `PROJECT.md`: все ссылки ведут в новое дерево;
- `docs/VISUAL_AUDIT.md`: путь к form animation обновлён;
- tests: production imports и `vi.mock()` paths обновлены.

Generated `src/scripts/index.js` и `src/styles/index.js` не изменились и по-прежнему импортируют top-level entries.

## 5. Сохранённые пользовательские изменения

До работы worktree уже содержал незавершённые изменения. Реорганизация выполнялась над актуальными версиями файлов, не над HEAD. В частности сохранены:

- новые/изменённые `createKapsulaForm.ts`, `renderForm.ts`, `createCalendarContent.ts`, `legacyFormEffects.d.ts`;
- compatibility facade `createReactiveForm.js`;
- связанные изменения form-configurator и тестов;
- mobile calendar declarations в перемещённом `features/form/_calendar.scss`;
- несвязанные изменения markup/reports/Graphify не трогались.

## 6. Выполненные проверки

- `npm run typecheck` — PASS;
- `npm run lint -- --quiet` — PASS;
- `npm test -- --reporter=dot` — PASS, 23 files / 135 tests;
- `npx sass src/styles/kapsula.scss /tmp/kapsula-structure-check.css --no-source-map` — PASS; только существующее предупреждение Dart Sass о deprecated `@import`;
- `npm run gen:scripts` — PASS;
- `npm run gen:styles` — PASS;
- generated indexes — no diff;
- `git diff --check` — PASS на момент проверки;
- repository search по старым production/test/doc paths — совпадений нет вне исторических `agent-reports/**` и read-only `graphify-out/**`.

## 7. Что проверить Test Agent

1. Повторить test/typecheck/lint и generated-index no-diff на финальном worktree.
2. Запустить `npm run build` и проверить `@CMS/kapsula.html`; build не запускался Developer Agent, чтобы не перезаписывать текущий generated output без необходимости.
3. Проверить dev/HMR и dynamic import `features/popup/hotels/hotelsConfig.dev.js`.
4. Сделать ручной smoke hero → steps → styles → form → popup, включая header/route lifecycle.
5. Проверить desktop/mobile form calendar, responsive images/overlay, hotel loading и submit states.
6. По возможности сравнить compiled CSS/визуальные screenshots до и после. Developer Agent подтвердил компиляцию, но не выполнял browser visual regression.

## 8. Ограничения и observations

- Реорганизация большая по количеству paths, хотя семантически механическая. Git может показать часть файлов как delete/add до staging; content similarity должен распознать большинство как rename.
- `PROJECT.md` уже имел пользовательские изменения; обновлены только затронутые ссылки.
- Исторические `agent-reports/**` намеренно не переписывались под новую структуру, кроме этого актуального отчёта и architecture report.
- `graphify-out/**` уже был dirty до работы; эта реализация его не обновляла и не исправляла.
- Sass `@import` deprecation существовал в entrypoint и не исправлялся, так как это отдельная behavioral/tooling migration.

## 9. Blockers

Blockers для Test Agent нет. Для окончательного принятия остаются CMS build и ручная браузерная/визуальная проверка.
