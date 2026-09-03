# Development report — Спринт 6

## Статус

Реализация Спринта 6 завершена последовательно по acceptance points 6A → 6B → 6C.
DOM renderer lifecycle, delegated events и persistence выделены в отдельные границы;
`createReactiveForm.js` остаётся Kapsula composition root. Обязательный config-driven
контракт нескольких полей `type: "text"` покрыт integration/unit tests.

Feedback loop после независимой проверки завершён: устранены только 9 предупреждений
`max-len` минимальными переносами строк без изменения поведения. Повторные lint, targeted
tests, typecheck и diff-check проходят; blockers отсутствуют.

## Созданные файлы

- `src/modules/form-configurator/dom/rendererRegistry.ts` — изолированный typed renderer
  registry с deterministic duplicate/unknown errors;
- `src/modules/form-configurator/dom/fieldRenderers.ts` — cards/textarea/text handles и
  incremental sync без потери identity/focus;
- `src/modules/form-configurator/dom/formRenderer.ts` — section controller, validation и
  ownership lifecycle handles;
- `src/modules/form-configurator/runtime/bindFormEvents.ts` — единый delegated DOM binding;
- `src/modules/form-configurator/runtime/bindFormPersistence.ts` — RxJS debounce и browser
  flush lifecycle через injected adapters;
- `src/scripts/kapsula/kapsulaFieldRenderers.ts` — composition registry и Flatpickr adapter;
- `tests/unit/form-configurator/rendererRegistry.test.ts`;
- `tests/unit/form-configurator/runtimeBindings.test.ts`;
- `tests/unit/kapsula/createCalendarContent.test.js`.

## Изменённые файлы

- `dom/renderer.ts`: добавлены `FieldRenderContext`, `FieldRenderHandle`, `UpdateFormState`;
- `form-configurator/index.ts`: опубликованы renderer factory/type contracts;
- `createCalendarContent.js`: добавлен lifecycle-aware handle с идемпотентным Flatpickr
  teardown, legacy facade сохранён;
- `renderForm.js`: заменён тонким совместимым facade над controller, добавлен явный teardown;
- `createReactiveForm.js`: события/persistence делегированы bindings, renderer cleanup включён
  в идемпотентный public destroy;
- integration tests усилены lifecycle, identity/caret и multi-text contract assertions.

## Acceptance points

- **6A PASS:** registry duplicate/unknown; calendar `onChange`; Flatpickr destroy ровно один
  раз; typecheck/lint.
- **6B PASS:** прежний DOM/CSS/ARIA contract, option identity/focus, text identity/caret,
  summary/error separation, calendar cleanup на full render/root destroy.
- **6C PASS:** click/cards/textarea/text/submit delegation, unknown id no-op, cleanup no-op,
  debounce/pagehide/visibility lifecycle, exact serialization и hydration нескольких text
  fields без business-specific orchestration.

## Выполненные проверки

- Targeted gates: **18 suites / 103 tests — PASS**.
- `npm run typecheck`: PASS.
- `npm run lint -- --quiet`: PASS, 0 errors/warnings.
- `git diff --check`: PASS.
- Feedback-loop targeted run: **6 suites / 30 tests — PASS**.
- Полный suite намеренно оставлен независимому Test Agent согласно workflow.
- Build/template не запускались и не являются gate.

## Ограничения и observations

- Domain registry/config union, `formConfig.json`, sessionState internals, popup/hotels,
  screen flow, dependencies, build/template и `graphify-out/**` не изменялись Спринтом 6.
- Persistence shape и debounce `150ms` сохранены; textarea исключается, text сохраняется.
- Kapsula effects остались в composition и не импортируются generic DOM/runtime modules.
- Legacy `createCalendarContent`, `renderForm`, `renderFormValidationErrors` и public form
  handle сохранены.

## Задачи Test Agent

1. Повторить targeted lifecycle/runtime/text suites.
2. Выполнить полный `npm test -- --reporter=dot`, typecheck, lint и diff-check.
3. Проверить public handle, capsule switching, calendar teardown и отсутствие запрещённых
   изменений текущего спринта.
4. Подтвердить несколько text fields: hydration, isolated delegated update, required issue
   path, summary, persistence и no-op после destroy.

---

# Development report — Спринт 5

## Статус

Реализация Спринта 5 завершена. Четыре production field type собраны в закрытом domain
registry; initial value, normalization, validation schema, persistence serialization и
summary делегируются definition. Production `FieldConfig`/Zod boundary остаются закрытыми,
а расширяемость подтверждена только изолированным registry test.

## Созданные файлы

- `src/modules/form-configurator/core/fieldTypes.ts` — contracts, registry, четыре built-in
  definition и aggregate summary helper;
- `src/modules/form-configurator/core/serialization.ts` — aggregate persistence serialization;
- `src/modules/form-configurator/dom/renderer.ts` — type-only DOM renderer seam Спринта 6;
- `tests/unit/form-configurator/fieldTypes.test.ts`;
- `tests/unit/form-configurator/serialization.test.ts`.

## Изменённые файлы

- `core/types.ts`: `BaseFieldConfig` экспортирован и допускает custom discriminant только как
  базовый контракт; production `FieldConfig` union не расширен;
- `core/values.ts`: type switches заменены делегированием definition, stable cascade сохранён;
- `core/validation.ts`: capsule schema/WeakMap cache сохранены, schema поля берётся из registry;
- `form-configurator/index.ts`: опубликованы factory/helpers и type-only contracts без mutable
  built-in map;
- `createReactiveForm.js`: локальная persistence projection заменена `serializeFormValues()`;
- `renderForm.js`: private summary/date helpers заменены `summarizeFieldValue()`; DOM registry,
  incremental sync и calendar lifecycle не менялись;
- `formValidation.test.js`: legacy fixtures получили реальные type discriminants, сценарии и
  assertions сохранены;
- `renderForm.test.js`: synthetic unknown input теперь проверяет явную registry error.

## Implementation decisions

- Built-in registry создаётся один раз и доступен production consumers только через getter;
  runtime registration не опубликована. Factory создаёт отдельные mutable registry для тестов
  и будущих composition boundaries.
- В generic registry имеется один скрытый helper cast для variance; consumers не используют
  `any` или casts. Core не импортирует DOM, RxJS, storage или project config.
- Cards summary использует labels только видимых options и legacy fallback values. Textarea
  summary пуст; calendar single/range formats сохранены буквально.
- `undefined` serialization исключает textarea key; cards/text/calendar fallback и JSON
  container сохранены, включая legacy calendar empty value `""`.
- DOM renderer остаётся только compile-time interface и не связан с domain definition.

## Выполненные проверки

- Targeted core/facade/contract/runtime suites: PASS — 13 suites / 89 tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 errors/warnings.
- `git diff --check`: PASS.
- Полный suite намеренно оставлен независимому Test Agent согласно workflow.
- Build/template не запускались и не являются gate.

## Ограничения и observations

- `graphify-out/**`, dependencies/configs, `formConfig.json`, popup/hotels, calendar lifecycle,
  build/template и UI markup/styles не изменялись в рамках Спринта 5.
- Custom definition не принимается `parseFormConfig()` и не расширяет runtime config.
- Известный multiline re-export `formValidation.js` сохранён без изменений; Graphify-specific
  workaround не добавлялся.

## Задачи Test Agent

1. Повторить новые registry/serialization suites и существующие core/facade/contract suites.
2. Проверить exact persistence JSON, textarea exclusion, summary и incremental DOM integration.
3. Выполнить полный `npm test -- --reporter=dot`, typecheck, lint и diff-check.
4. Проверить односторонние core imports, закрытый config union и отсутствие изменений
   запрещённых областей/Graphify.

---

# Development report — Спринт 4

## Статус

Реализация Спринта 4 завершена. Чистые conditions, values/normalization,
initial/expanded state, state transitions и validation перенесены в строгие TypeScript
core-модули. Legacy JS import paths, публичный `createReactiveForm()`, persistence contract,
Zod safeParse shape и RxJS referential behavior сохранены.

## Созданные файлы

- `src/modules/form-configurator/core/conditions.ts`;
- `src/modules/form-configurator/core/values.ts`;
- `src/modules/form-configurator/core/state.ts`;
- `src/modules/form-configurator/core/validation.ts`;
- `tests/unit/form-configurator/conditions.test.ts`;
- `tests/unit/form-configurator/values.test.ts`;
- `tests/unit/form-configurator/state.test.ts`;
- `tests/unit/form-configurator/validation.test.ts`.

## Изменённые файлы

- `core/types.ts`: добавлены state, expanded/touched и validation contracts;
- `form-configurator/index.ts`: опубликован стабильный core API и типы;
- `formConditions.js`, `formValues.js`, `formValidation.js`: оставлены совместимыми
  re-export фасадами;
- `formSchema.js`: Kapsula selectors сохранены, initial/expanded helpers делегированы core;
- `createReactiveForm.js`: встроенные section/choice/text transitions заменены pure core
  functions; storage, RxJS, DOM, rendering и effects остались в orchestration;
- `createCalendarContent.js`: обновление calendar state делегировано `setFieldValue()`;
- legacy fixtures в `formValues.test.js` и `formSchema.test.js`: устаревший `choice`
  приведён к фактическому discriminant `cards`.

## Implementation decisions

- Core принимает capsule/sections/values явно и не импортирует project config, DOM,
  browser APIs, RxJS, storage, popup/hotels или effects.
- Normalization сохраняет проходы по снимку предыдущего шага и ограничение
  `sections.length`; `text` обрабатывается явно как строковое поле.
- `render: false` исключается из initial/expanded state, а normalization сохраняет
  legacy contract работы с переданным набором sections.
- Неизвестные transitions возвращают исходный state. Валидные transitions создают новые
  `values`/`expandedState` ссылки; `saveActiveSection()` вызывается runtime только после
  успешного section transition.
- Validation сохраняет WeakMap cache и результат Zod `safeParse`; JS-фасад экспортирует
  `validateSchema` как alias `validateFormValues`.

## Выполненные проверки

- Targeted core + legacy facade + contract + integration: PASS — 11 suites / 78 tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 errors/warnings.
- `git diff --check`: PASS.
- Полный suite намеренно оставлен независимому Test Agent согласно workflow.
- Build не запускался и не является gate текущего спринта.

## Ограничения и observations

- `graphify-out/**`, build/template, `formConfig.json`, dependencies/configs,
  popup/hotels/UI не изменялись в рамках Спринта 4.
- В working tree сохранены пользовательские и ранее согласованные изменения прошлых
  спринтов, включая отдельное обновление Graphify.
- Calendar сохраняет существующую границу: initial `null` заменяется пустым range через
  nullish fallback, normalization допускает `null`.

## Задачи Test Agent

1. Повторить четыре новые core suites и четыре legacy facade suites.
2. Повторить contract suite, `createReactiveForm` и `sessionState` integration suites.
3. Выполнить полный `npm test -- --reporter=dot`, typecheck, lint и diff-check.
4. Проверить отсутствие импортов side effects/project config в core и неизменность
   persistence keys/shape, запрещённых областей и Graphify.

---

# Development report — Спринт 3

## Статус

Реализация Спринта 3 завершена. Добавлены строгая TypeScript-основа, типизированная
модель form config, runtime Zod boundary и contract tests. Массовая миграция legacy JS,
core extraction Спринта 4, сборщик/шаблон и Graphify не затрагивались.

## Изменённые файлы

- `package.json`: добавлены `typecheck`, прямые devDependencies `typescript@^6.0.3` и
  `typescript-eslint@^8.67.0`;
- `package-lock.json`: минимально синхронизированы root devDependencies; у ставшего
  прямым `typescript` снят флаг `peer`, unrelated dependency tree не обновлялся;
- `tsconfig.json`: строгий Bundler-mode контур только для новых TS/d.ts и TS tests,
  legacy JS оставлен с `checkJs: false`, emit запрещён;
- `eslint.config.mjs`: подключён flat recommended config `typescript-eslint`, TS
  overrides, `.ts` browser/node/test patterns; устаревший ignore `*.d.ts` удалён;
- `vitest.config.js`: discovery расширен на TS tests, coverage — на TS production
  sources нового модуля;
- `src/modules/form-configurator/core/types.ts`: текущие config/value/conditions
  модели и discriminated union четырёх поддерживаемых field types;
- `src/modules/form-configurator/core/config.ts`: fail-fast Zod parser с loose-object
  границами, сохраняющими project-specific и presentation keys;
- `src/modules/form-configurator/index.ts`: узкий публичный экспорт parser и типов;
- `src/scripts/kapsula/kapsulaFormConfig.ts`: project composition boundary для
  существующего `formConfig.json`;
- `src/scripts/kapsula/formSchema.js`: только прямой JSON import заменён на уже
  проверенный config из TS boundary;
- `tests/contract/formConfig.test.ts`: contract coverage реального config, четырёх
  field types, invalid type/options/conditions и сохранения unknown keys.

## Implementation decisions

- Generic core не импортирует project JSON и не знает о Kapsula-specific popup,
  hotels или mail настройках.
- Известные core-поля типизированы явно; index signatures сохраняют расширяемые
  project keys, а `z.looseObject` предотвращает их runtime stripping.
- Cards требуют `options`; textarea/text/calendar проверяются по своим текущим
  минимальным контрактам. Уникальность id и cross-field references оставлены
  следующему согласованному спринту.
- Lockfile сначала был перестроен npm из-за peer resolution; этот собственный diff
  отменён, затем lock синхронизирован через `--legacy-peer-deps`, итоговый diff — 3 строки.

## Выполненные проверки

- `npm run typecheck` — PASS.
- `npm run lint` — PASS, 0 errors/warnings.
- Targeted contract + formSchema + integration — PASS: 5 suites / 45 tests.
- `git diff --check` — PASS.
- Полный suite намеренно оставлен независимому Test Agent согласно workflow.
- Build не запускался и не является gate текущего спринта.

## Ограничения и observations

- `parseFormConfig()` использует структурный runtime contract; semantic refinements
  уникальности ids и валидности condition references не входят в Спринт 3.
- `src/scripts/formConfig.json`, `src/lib/**`, `landing.config.mjs`, `src/order.json`,
  build/template и `graphify-out/**` не изменялись этим агентом.
- В общем working tree сохранены изменения предыдущих спринтов и пользовательские
  Graphify/документационные изменения.

## Задачи Test Agent

1. Повторить contract suite и проверить issue paths/сохранение unknown keys.
2. Повторить `npm run typecheck`, полный `npm test`, `npm run lint` и `git diff --check`.
3. Проверить минимальность package-lock diff и отсутствие изменений запрещённых файлов.
4. Проверить runtime совместимость импорта TS boundary из `formSchema.js` на связанных
   unit/integration suites; build/template и Graphify не трогать.

---

# Development report — Спринт 2

## Статус

Спринт 2 завершён: девять colocated unit suites перенесены из `src/` в `tests/unit/`, неиспользуемый preview удалён, test discovery и документация актуализированы. Все 94 теста и ESLint проходят. Production-код в рамках этого спринта не изменялся.

## Перемещённые тесты

- `src/scripts/kapsula/buildCapsuleHref.test.js` → `tests/unit/kapsula/buildCapsuleHref.test.js`;
- `src/scripts/kapsula/formConditions.test.js` → `tests/unit/kapsula/formConditions.test.js`;
- `src/scripts/kapsula/formSchema.test.js` → `tests/unit/kapsula/formSchema.test.js`;
- `src/scripts/kapsula/formValidation.test.js` → `tests/unit/kapsula/formValidation.test.js`;
- `src/scripts/kapsula/formValues.test.js` → `tests/unit/kapsula/formValues.test.js`;
- `src/scripts/kapsula/sanitizeRichText.test.js` → `tests/unit/kapsula/sanitizeRichText.test.js`;
- `src/scripts/kapsula/hotels/hotelsNormalize.test.js` → `tests/unit/kapsula/hotels/hotelsNormalize.test.js`;
- `src/scripts/kapsula/popup/popupContactForm.test.js` → `tests/unit/kapsula/popup/popupContactForm.test.js`;
- `src/scripts/kapsula/popup/popupLeadPayload.test.js` → `tests/unit/kapsula/popup/popupLeadPayload.test.js`.

Test cases, describe/it и assertions сохранены. Изменены только относительные production imports, а также точечные browser globals после выхода файлов из `src/scripts/**/*.js`. JSDOM pragma остался первой строкой в `buildCapsuleHref`, `popupContactForm` и `sanitizeRichText`.

## Удалённые файлы и команда

- удалены `tests/serve.mjs` и `tests/host.html` как подтверждённо неиспользуемый preview;
- из `package.json` удалён `test:serve`;
- `package-lock.json` не изменялся; dependencies не менялись.

## Обновлённые файлы

- `vitest.config.js`: test include сокращён до `tests/**/*.{test,spec}.js`; Node environment, per-file jsdom и coverage source include `src/scripts/**/*.js` сохранены;
- `eslint.config.mjs`: убрано устаревшее упоминание тестового стенда в комментарии, функциональные rules не менялись;
- `README.md`: описана структура `tests/unit`, `tests/integration`, fixtures/helpers и фактическое DOM/lifecycle-покрытие;
- `PROJECT.md`: quick start и раздел проверок переведены на `npm test`/`npm run test:watch`, удалены preview-раздел и связанная устаревшая «грабля».

## Выполненные проверки

- Targeted moved unit suites — PASS: 9 suites / 71 tests.
- Targeted integration suites — PASS: 3 suites / 23 tests.
- Полный suite `npm test -- --reporter=dot` — PASS: 12 suites / 94 tests.
- `npm run lint` — PASS, 0 errors и warnings.
- `git diff --check` — PASS.
- `rg --files src | rg '\.(test|spec)\.[cm]?[jt]s$'` — совпадений нет.
- `rg` по `README.md`, `PROJECT.md`, `package.json` — ссылок на `test:serve`, `tests/serve.mjs`, `tests/host.html` нет.
- Coverage include проверен статически: instrumented scope остаётся `src/scripts/**/*.js`; сами tests/fixtures/helpers в него не входят.
- Build не запускался: not applicable по ограничению Спринта 2.

## Ограничения и observations

- `express` не удалялся: это отдельный существующий dependency debt вне scope.
- `src/scripts/index.js`, `package-lock.json`, production, build/template и `graphify-out/` Developer Agent Спринта 2 не изменял.
- В общем working tree присутствуют изменения предыдущих спринтов и внешние изменения `graphify-out/`; они не перезаписывались.

## Задачи Test Agent

1. Повторить 9 moved unit suites и подтвердить 71/71 tests.
2. Повторить 3 integration suites и полный suite 94/94.
3. Проверить jsdom pragma/global comments и отсутствие tests/specs в `src/`.
4. Проверить отсутствие preview references и неизменность package lock/coverage source scope.
5. Повторить lint и `git diff --check`; build/template и `graphify-out/` не трогать.
