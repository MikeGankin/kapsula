# Testing report — Спринт 6

## Статус

**PASS** — feedback fix устранён, все обязательные gates проходят, blockers отсутствуют.
Production-код Test Agent не изменял.

## Feedback fix review

- Обновлённый `development.md` фиксирует только переносы строк для устранения 9
  предупреждений `max-len`.
- Исправления ограничены ранее отмеченными файлами renderer/runtime/composition и не меняют
  контракты, алгоритмы или runtime-поведение.
- Повторный `npm run lint` проходит чисто: 0 errors / 0 warnings.

## Выполненные проверки

- Targeted renderer registry/lifecycle/events/persistence, `renderForm`,
  `createReactiveForm`, `sessionState`: **6 suites / 30 tests — PASS**.
- Полный `npm test -- --reporter=dot`: **22 suites / 131 tests — PASS**.
- `npm run typecheck`: **PASS**.
- `npm run lint`: **PASS**, 0 errors / 0 warnings.
- `git diff --check`: **PASS**.
- Build не запускался: он не является gate Спринта 6.

## Подтверждённые контракты

- Renderer registry/lifecycle, Flatpickr exactly-once cleanup, full render/capsule switch/root
  destroy и идемпотентность.
- Incremental identity/focus/caret; DOM/CSS/ARIA/order/summary/error; unknown renderer
  fail-before-commit.
- Delegated `closest()`, unknown metadata no-op и cleanup.
- Persistence debounce/pagehide/hidden visibility/cancellation и прежний JSON contract.
- Public handle и изоляция Kapsula effects от generic DOM/runtime.
- Core не импортирует DOM, storage, RxJS или project/Kapsula modules.
- Несколько config-driven полей `type: text` проходят render/hydrate/update/validate/
  serialize/restore/summary без business-specific orchestration и прекращают работу после
  `destroy()`.
- `graphify-out/**` после предспринтового обновления в реализации Спринта 6 не изменялся.

## Проблемы и blockers

- Не обнаружены.

# Testing report — Спринт 7

## Статус

**PASS** — обязательные автоматические проверки и consumer/import audit пройдены;
production-код Test Agent не изменял.

## Выполненные проверки

- Полный `npm test -- --reporter=dot`: **23 suites / 133 tests — PASS**.
- `npm run typecheck`: **PASS**.
- `npm run lint -- --quiet`: **PASS** (ошибок и warnings нет).
- `git diff --check`: **PASS**.
- Consumer audit: единственный production consumer создаёт форму через
  `createKapsulaForm`; legacy `createReactiveForm` сохранён как exact alias facade.
- Source audit: `createConfiguredForm` принимает typed config/storage/renderer/effects;
  shell, render→section animation и overlay остаются тремя отдельными RxJS pipelines.
  Persistence продолжает использовать debounce 150 ms и pagehide/visibility flush.
- Session audit: существующие v2 keys, legacy migrate-on-read и JSON serialization
  остаются в `sessionState.js`; popup/payload/hotels остаются вне generic runtime.
- Scope audit: в production diff Спринта 7 затронуты только composition facade/root и
  screen-flow consumer; core, builder/template, config JSON, popup/hotels и UI не менялись.

## Проблемы и blockers

- Не обнаружены.
- `graphify-out/**` имеет изменения в working tree от отдельного разрешённого обновления
  после Спринта 6; они не относятся к реализации Спринта 7 и не изменялись Test Agent.
- Build не запускался согласно handoff/template contract.

# Testing report — Спринт 8

## Статус

**PASS** — обязательные автоматические gates, targeted runtime checks и source/import
audits пройдены. Production-код Test Agent не изменял.

## Выполненные проверки

- Targeted form runtime suites: **6 suites / 29 tests — PASS** (в команду были включены
  существующие suites; два ожидавшихся по старому имени файла suite отсутствуют).
- Полный `npm test -- --reporter=dot`: **23 suites / 135 tests — PASS**.
- `npm run typecheck`: **PASS**.
- `npm run lint -- --quiet`: **PASS** (ошибок и warnings нет).
- `npm run gen:scripts`: **PASS**; `src/scripts/index.js` не изменился.
- `git diff --check`: **PASS**.

## Подтверждённые контракты и audits

- Public index экспортирует `FormSnapshot`, commands и lifecycle types; composition root
  и DOM guards покрыты integration suite.
- `createReactiveForm` сохранён как exact alias `createKapsulaForm`; `setupScreenFlow`
  использует новый root.
- Atomic JS→TS imports для `renderForm` и `createCalendarContent` не оставили старых
  `.js` imports; Flatpickr lifecycle и cleanup проходят targeted tests.
- В Sprint 8 production scope не обнаружены `as unknown as`, TypeScript suppressions,
  explicit `any` или catch-all effect declarations. `expect.any(...)` встречается только
  в тестовых assertions и не является production type gap.
- `src/styles/kapsula/_calendar.scss` содержит отдельное пользовательское изменение
  (10 добавленных строк); Sprint 8 Test Agent его не менял и к спринту не приписывает.

## Проблемы и blockers

- Не обнаружены. Build не запускался согласно handoff/template contract.
- `graphify-out/**` имеет отдельные изменения от разрешённого обновления Graphify и не
  изменялся Test Agent.

# Testing report — Спринт 9

## Статус

**PASS** — финальная verification matrix 9C пройдена; production-код и документацию
Test Agent не изменял.

## Выполненные проверки

- Полный `npm test -- --reporter=dot`: **23 suites / 135 tests — PASS**.
- `npm run typecheck`: **PASS**.
- `npm run lint -- --quiet`: **PASS**.
- `npm run gen:scripts`: **PASS**; `src/scripts/index.js` byte-identical, diff отсутствует.
- `git diff --check`: **PASS**.
- Scoped consumer/path/type audit: старые `renderForm.js` и `createCalendarContent.js`
  imports отсутствуют; `setupScreenFlow` использует `createKapsulaForm`; exact alias
  `createReactiveForm` сохранён; все PROJECT.md ссылочные пути существуют.
- Documentation audit: команды, пути, четыре production field types, config boundary,
  runtime guarantees и отсутствие preview script соответствуют текущему source/package.

## Scope и ограничения

- Sprint 9 attribution ограничен `PROJECT.md` и отчётами; aggregate dirty worktree содержит
  предшествующие Sprint 8 изменения, разрешённое обновление `graphify-out/**` и отдельное
  пользовательское изменение `src/styles/kapsula/_calendar.scss`.
- README, source, tests, `graphify-out/**` и `_calendar.scss` этим этапом не менялись;
  compatibility facades сохранены.
- Build и preview: **N/A**, исключены действующим template/build contract; preview script
  отсутствует в `package.json`. Не запускались.

## Проблемы и blockers

- Не обнаружены.
