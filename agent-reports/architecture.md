# План рефакторинга проекта Kapsula

## 1. Цель

Навести порядок в текущем проекте без выделения формы в отдельный пакет:

1. стабилизировать качество существующего кода;
2. отделить автоматические тесты от production-кода, а preview-инструменты — от тестов;
3. поэтапно внедрить TypeScript;
4. переработать форму-конфигуратор в самостоятельный внутренний модуль;
5. сделать добавление новых типов полей локальным и предсказуемым;
6. сохранить текущее поведение, интеграции, DOM-контракт и данные пользователей.

Рефакторинг выполняется небольшими проверяемыми шагами. Каждый спринт должен завершаться рабочим состоянием проекта и отдельным решением о переходе к следующему.

## 2. Ограничения

- Модуль остаётся частью текущего репозитория.
- Отдельный npm-пакет и публикация библиотеки не входят в scope.
- `graphify-out/` используется только для чтения и никогда не изменяется.
- Существующий UI и пользовательские сценарии не перерабатываются без отдельной задачи.
- Публичное поведение формы, popup, hotels и CMS-интеграции сохраняется.
- Сборщик и шаблон проекта не изменяются; `src/order.json` и build-скрипты находятся вне scope рефакторинга.
- Не выполняются массовые переименования и форматирование несвязанных файлов.
- Новые зависимости добавляются только после отдельной оценки необходимости.
- Пользовательские изменения в working tree не перезаписываются.

## 3. Исходное состояние

### 3.1. Архитектура

- `src/scripts/kapsula/createReactiveForm.js` совмещает управление состоянием, DOM, валидацию, persistence, изображения, анимации и lifecycle.
- `src/scripts/kapsula/renderForm.js` содержит крупный DOM-renderer и закрытый реестр типов полей.
- Знание о типах полей распределено между schema, values, validation, renderer и обработчиками событий.
- `src/scripts/kapsula/formSchema.js` напрямую импортирует проектный `formConfig.json`.
- Kapsula-специфичные эффекты связаны с логикой формы сильнее, чем требуется.

### 3.2. Тесты и tooling

- Девять `*.test.js` находятся внутри `src/scripts/kapsula/**`.
- `tests/serve.mjs` и `tests/host.html` являются preview-инструментами, а не автоматическими тестами.
- Отсутствуют отдельные contract, integration, fixtures и test helpers.
- Нет тестов полного lifecycle конфигуратора и контракта расширения типов полей.

### 3.3. Quality baseline

- `npm test`: 66 тестов проходят, 5 падают.
- Причина известных падений: опечатка `undefinedы` в `popup/popupLeadPayload.js`.
- `npm run lint`: 11 ошибок.
- В production-коде присутствуют отладочные `console.log`.
- TypeScript-инфраструктура отсутствует, кроме `src/vite-env.d.ts`.

## 4. Целевая архитектура

Предлагаемая внутренняя структура:

```text
src/
  modules/
    form-configurator/
      core/
        types.ts
        config.ts
        conditions.ts
        values.ts
        validation.ts
        state.ts
      fields/
        registry.ts
        cards.ts
        textarea.ts
        calendar.ts
      runtime/
        controller.ts
        lifecycle.ts
      adapters/
        dom/
        storage/
      index.ts

  scripts/
    kapsula/
      form/
        createKapsulaForm.ts
        kapsulaFormConfig.ts
        effects/
        submission/

tests/
  unit/
  contract/
  integration/
  fixtures/
  helpers/
```

Это целевая карта ответственности, а не требование создать все каталоги заранее. Структура вводится только по мере переноса реального кода.

### 4.1. Core

Core содержит чистую логику:

- модель конфигурации;
- начальные значения;
- условия видимости;
- нормализацию;
- валидационные контракты;
- переходы состояния.

Core не должен импортировать DOM, RxJS, sessionStorage, animations, popup, hotels, CSS-селекторы или `formConfig.json`.

### 4.2. Реестр типов полей

Тип поля предоставляет согласованный набор операций:

- создание начального значения;
- нормализация;
- валидация;
- сериализация;
- формирование summary;
- DOM-rendering через UI-адаптер.

Главный критерий архитектуры: новый тип поля добавляется новой реализацией и регистрацией, а не правками условных веток одновременно в нескольких модулях.

### 4.3. Runtime

Runtime управляет:

- состоянием формы;
- командами изменения значений;
- подписками;
- lifecycle;
- вызовом адаптеров.

RxJS может остаться внутренней деталью runtime, но не должен быть частью публичного контракта core.

### 4.4. Адаптеры

- DOM adapter отвечает за разметку, события и доступность.
- Storage adapter отвечает за сохранение и восстановление состояния.
- Kapsula-специфичные анимации и изображения подключаются как эффекты проектного слоя.

### 4.5. Проектный слой Kapsula

В нём остаются:

- импорт реального `formConfig.json`;
- Kapsula CSS-классы и data-атрибуты;
- overlay и responsive images;
- анимации;
- popup и payload;
- hotels;
- CMS-host integration;
- session key/version migration.

## 5. План по спринтам

## Спринт 0. Фиксация архитектуры и стабилизация baseline

### Зачем

Нельзя надёжно оценивать регрессии, пока тесты и lint уже находятся в красном состоянии.

### Работы

1. Зафиксировать этот документ как архитектурную основу.
2. Проверить текущее состояние working tree перед изменениями.
3. Исправить опечатку, вызывающую пять падений `popupLeadPayload.test.js`.
4. Удалить или заменить отладочные `console.log` в затронутом production-коде.
5. Исправить остальные текущие ESLint-ошибки минимальными локальными изменениями.
6. Не менять архитектуру формы в рамках исправления baseline.
7. Зафиксировать актуальные команды и результаты проверок в `agent-reports/development.md` и `agent-reports/testing.md`.

### Проверки

1. Targeted: `popupLeadPayload.test.js`.
2. Related: текущие девять test suites.
3. `npm run lint`.
4. `npm run build`.

### Критерии приёмки

- Все 71 существующий тест проходят.
- ESLint завершается без ошибок.
- Build не является блокирующим gate, если он останавливается на существующем ограничении сборщика или шаблона вне scope; такой результат фиксируется как `not verified` с причиной.
- Поведение приложения не изменено.
- Исправления не смешаны с архитектурным рефакторингом.

### Риски

- Текущая опечатка может быть частью незавершённых пользовательских изменений; перед исправлением нужен просмотр diff затронутого файла.
- Удаление console-логов не должно скрыть необходимую обработку ошибок.

---

## Спринт 1. Characterization-тесты формы

### Зачем

Перед переносом обязанностей необходимо зафиксировать текущее поведение, включая неочевидные связи DOM, состояния и sessionStorage.

### Работы

1. Добавить fixtures для минимальной формы и формы со всеми текущими типами полей.
2. Добавить тесты условий `visibleWhen` и `hiddenWhen` с каскадной нормализацией.
3. Зафиксировать начальное состояние и переключение капсул.
4. Проверить восстановление и сохранение session state.
5. Проверить validation errors и фокусировку первой ошибочной секции.
6. Проверить полный lifecycle: создание, пользовательское событие, обновление, уничтожение.
7. Проверить очистку RxJS-подписок и DOM-listeners.
8. Зафиксировать DOM/ARIA-контракт текущих полей.
9. Не менять production-архитектуру, кроме небольших seam-точек, необходимых для тестируемости и отдельно согласованных.

### Проверки

- Targeted tests новых сценариев.
- Весь связанный набор тестов формы.
- Lint и build.

### Критерии приёмки

- Критические сценарии текущей формы воспроизводятся автоматически.
- Тесты проверяют поведение, а не внутреннюю структуру реализации.
- Зафиксированы риски, которые нельзя проверить автоматически.

### Риски

- Избыточно детальные DOM snapshot-тесты будут мешать безопасному рефакторингу.
- Нужны точечные assertions на семантику, ARIA и события.

---

## Спринт 2. Разделение тестов и служебных инструментов

### Зачем

Production tree должен содержать runtime-код, а `tests/` — только автоматические проверки. Неиспользуемый preview-код не переносится в новую директорию, а удаляется.

### Работы

1. Перенести colocated unit-тесты из `src/scripts/kapsula/**` в `tests/unit/**`.
2. Создать `tests/integration`, `tests/contract`, `tests/fixtures`, `tests/helpers` по фактической необходимости.
3. Удалить неиспользуемые `tests/serve.mjs` и `tests/host.html`.
4. Удалить неиспользуемую команду `test:serve`.
5. Обновить `vitest.config.js` и coverage patterns.
6. Проверить относительные импорты после перемещения.
7. Не менять содержательную логику тестируемого кода.

### Проверки

- Все существующие и добавленные тесты.
- Lint.
- Build.
- Пользовательская визуальная проверка через `npm run dev`.

### Критерии приёмки

- В `src/` нет `*.test.*` и `*.spec.*`.
- В `tests/` нет preview-сервера и связанных с ним файлов.
- Все 71 исходный сценарий сохранены без skip/delete.
- Неиспользуемая команда `test:serve` отсутствует.

### Риски

- Изменение import paths и jsdom pragmas.
- Скрипты генерации не должны начать индексировать тестовые файлы.

---

## Спринт 3. Основа TypeScript

### Зачем

TypeScript должен сначала обеспечить проверяемые границы и модели данных, а не просто заменить расширения файлов.

### Работы

1. Добавить минимально необходимые TypeScript dev dependencies.
2. Создать `tsconfig.json` с настройками, совместимыми с Vite и ESM.
3. Добавить команду `typecheck` на основе `tsc --noEmit`.
4. Настроить ESLint для `.ts` без массового изменения правил JS-кода.
5. Настроить Vitest для `.test.ts`.
6. Ввести базовые типы формы:
   - `FormConfig`;
   - `FormVariant`/`CapsuleConfig`;
   - `FieldConfig`;
   - `FieldValue`;
   - `FormValues`;
   - condition types.
7. Описать текущие `cards`, `textarea`, `calendar` через discriminated union.
8. Добавить boundary-проверку JSON-конфига на runtime.
9. Не мигрировать весь проект одним изменением.

### Стратегия строгости

- Цель — `strict: true` для нового модуля.
- Старый JS временно допускается через совместимую конфигурацию миграции.
- `any` допускается только как явно зафиксированный временный долг; предпочтительнее `unknown` с narrowing.

### Проверки

- `npm run typecheck`.
- Contract tests корректного и некорректного config.
- Unit tests.
- Lint.
- Build.

### Критерии приёмки

- Typecheck является обязательным quality gate.
- Некорректный config отклоняется до запуска UI.
- Тип поля определяет допустимую структуру значения.
- Текущий JS-runtime продолжает работать.

### Риски

- JSON imports и ESM-настройки должны соответствовать реальной версии Node/Vite.
- Слишком широкие типы уничтожат пользу миграции.
- Слишком ранняя типизация DOM orchestration создаст большой шум.

---

## Спринт 4. Выделение чистого ядра формы

### Зачем

Чистые правила формы легче тестировать, типизировать и изменять независимо от DOM и Kapsula-интеграций.

### Работы

1. Перенести и типизировать conditions.
2. Перенести и типизировать initial values и normalization.
3. Выделить state transitions в чистые функции или reducer-подобный API.
4. Отделить validation contract от конкретного DOM-rendering ошибок.
5. Убрать прямой импорт `formConfig.json` из core.
6. Передавать config через явный аргумент/composition root.
7. Сохранить совместимые фасады для текущих вызывающих модулей на время миграции.
8. Переносить один блок логики за изменение, сохраняя green state.

### Проверки

- Unit tests core.
- Characterization tests старого поведения.
- Contract tests config/value compatibility.
- Typecheck, lint и build.

### Критерии приёмки

- Core не зависит от browser APIs и проектных эффектов.
- Core тестируется в Node без jsdom.
- Конфигурация передаётся явно.
- Публичное поведение Kapsula не изменилось.

### Риски

- Порядок каскадной нормализации является частью поведения и должен сохраниться.
- Формат persisted values нельзя менять без версии и миграции.

---

## Спринт 5. Контракт и реестр типов полей

### Зачем

Сейчас добавление типа поля требует синхронных изменений в нескольких несвязанных модулях. Реестр собирает знание о типе поля в одной точке.

### Работы

1. Определить минимальный `FieldTypeDefinition`.
2. Вынести реализации `cards`, `textarea`, `calendar`.
3. Связать с типом поля:
   - initial value;
   - normalize;
   - validate;
   - serialize;
   - summarize.
4. Отдельно определить DOM renderer interface.
5. Реализовать проверку уникальности регистрации типа.
6. Добавить явную ошибку для неизвестного типа.
7. Добавить тестовый custom field type как доказательство расширяемости.
8. Не добавлять speculative API, не требуемые текущими типами полей.

### Проверки

- Contract suite для всех типов полей.
- Custom field integration test.
- Проверка неизвестного типа.
- Typecheck, lint и build.

### Критерии приёмки

- Новый тип добавляется новой реализацией и регистрацией.
- Orchestration не содержит switch/if по всем типам полей.
- Контракт остаётся минимальным и типобезопасным.

### Риски

- Слишком универсальный интерфейс приведёт к overengineering.
- DOM и domain responsibilities нельзя смешивать в одном обязательном контракте.

---

## Спринт 6. Декомпозиция runtime и DOM-renderer

### Зачем

`createReactiveForm.js` и `renderForm.js` являются крупнейшими точками связанности и требуют разделения ответственности после стабилизации core.

### Работы

1. Выделить controller/state orchestration из `createReactiveForm`.
2. Выделить persistence lifecycle.
3. Выделить DOM event delegation.
4. Разделить section shell, field renderer, summary и validation rendering.
5. Ввести явный `destroy()` для всех подписок, listeners и эффектов.
6. Сохранить существующий CSS/DOM-контракт.
7. Подключить field registry к DOM renderer.
8. Оставить RxJS внутренней реализацией, если он продолжает упрощать поток состояния.

### Проверки

- Lifecycle integration tests.
- DOM/ARIA tests.
- Listener/subscription cleanup tests.
- Полный связанный набор формы.
- Typecheck, lint и build.

### Критерии приёмки

- У каждого модуля одна понятная ответственность.
- Runtime можно тестировать с подменёнными adapters.
- Destroy гарантированно освобождает ресурсы.
- Разметка и пользовательское поведение сохранены.

### Риски

- Изменение порядка реактивных обновлений может повлиять на анимации.
- Incremental rendering нельзя менять без проверки focus и input state.

---

## Спринт 7. Отделение Kapsula-специфичных эффектов

### Зачем

Форма должна быть внутренним модулем, а Kapsula — его конкретной композицией.

### Работы

1. Создать composition root `createKapsulaForm`.
2. Подключать реальный config только в проектном слое.
3. Изолировать overlay, responsive images и animations как эффекты.
4. Оставить popup, lead payload и hotels вне form core.
5. Подключить sessionStorage через adapter с текущими ключами и версией.
6. Удалить временные compatibility-фасады только после перевода всех consumers.

### Проверки

- Интеграционные сценарии трёх капсул.
- Conditions, calendar, popup, payload, hotels и persistence.
- Desktop/mobile smoke checklist.
- Typecheck, lint и build.

### Критерии приёмки

- Core не импортирует Kapsula modules.
- Kapsula-эффекты подключаются на границе приложения.
- Persisted data остаются совместимыми либо имеют явную миграцию.
- Временный старый путь удалён только после подтверждённого parity.

### Риски

- Анимации и responsive images чувствительны к таймингу DOM updates.
- Popup использует snapshot формы; его контракт необходимо зафиксировать до переключения.

---

## Спринт 8. Завершение TypeScript-миграции затронутого runtime

### Зачем

После стабилизации границ можно типизировать orchestration и интеграционные модули с меньшим риском.

### Работы

1. Мигрировать Kapsula form composition и связанные adapters.
2. Типизировать DOM queries через guard-функции.
3. Типизировать публичные snapshots, commands и lifecycle handles.
4. Устранить временные suppressions и необоснованные `any`.
5. Не мигрировать несвязанные build scripts ради формального процента TS.
6. Оценить отдельно необходимость миграции `src/lib/*.mjs`.

### Проверки

- Typecheck.
- Unit, contract и integration tests.
- Lint.
- Build.
- Ручной smoke критического UI-пути.

### Критерии приёмки

- Весь новый form-configurator и его Kapsula composition типизированы.
- Нет необоснованных suppressions.
- JS остаётся только там, где его миграция не даёт достаточной пользы в текущем scope.

### Риски

- Массовая миграция расширений может затронуть генераторы import indexes.
- Каждый rename должен проверяться против Vite build и generated entrypoints.

---

## Спринт 9. Финальная проверка и документация

### Зачем

Завершённая архитектура должна быть понятна следующему разработчику и проверена как единая система.

### Работы

1. Удалить подтверждённо неиспользуемые compatibility-фасады.
2. Проверить отсутствие старых импортов и дублирующей логики.
3. Добавить короткую документацию внутреннего API и пример нового типа поля.
4. Документировать config contract, команды тестов, typecheck и preview.
5. Провести финальный regression review.
6. Зафиксировать оставшийся неблокирующий технический долг отдельно.

### Проверки

- Unit, contract и integration suites.
- Typecheck.
- Lint.
- Production build.
- Preview smoke.
- Ручной checklist desktop/mobile.

### Критерии приёмки

- Все quality gates зелёные.
- Нет тестов в `src/` и preview tooling в `tests/`.
- Новый тип поля добавляется через документированный контракт.
- Конфиг проверяется на runtime boundary.
- Core отделён от Kapsula-специфичных зависимостей.
- Документация соответствует фактическому API.

## 6. Последовательность согласования

Каждый спринт проходит одинаковый цикл:

1. Кратко объяснить цель и точный scope спринта.
2. Получить согласование на изменения.
3. Architecture Agent уточняет только затронутые компоненты и обновляет `architecture.md`, если решение изменилось.
4. Developer Agent читает `architecture.md`, реализует минимальный scope и пишет `development.md`.
5. UI Agent подключается только при существенном изменении UI/UX.
6. Test Agent читает отчёты, выполняет проверки и пишет `testing.md`.
7. При FAIL выполняется feedback loop с минимальным исправлением.
8. В основной контекст возвращается только краткая сводка.
9. Пользователь запускает `npm run dev` и выполняет визуальную приёмку.
10. Следующий спринт начинается только после пользовательского подтверждения.

## 7. Общие quality gates

Обязательные проверки выбираются пропорционально риску, но к завершению каждого архитектурного спринта должны быть доступны:

1. targeted tests;
2. related test suite;
3. `typecheck` после его появления;
4. lint;
5. build;
6. пользовательская визуальная проверка через `npm run dev` после каждого спринта;
7. e2e или дополнительный smoke — только если риск конкретного изменения это оправдывает.

Запрещено получать green state путём удаления, skip или ослабления существующих тестов без отдельного обоснования и согласования.

## 8. Ключевые архитектурные решения

1. Конфигуратор остаётся внутренним модулем проекта.
2. Сначала стабилизируется поведение, затем меняется структура.
3. TypeScript внедряется от моделей и чистого core к integration layer.
4. Config передаётся явно, а не импортируется внутри core.
5. Типы полей расширяются через минимальный registry contract.
6. DOM, storage и Kapsula effects являются адаптерами/проектным слоем.
7. Обратная совместимость удаляется только после подтверждённого parity.
8. Публикация отдельного пакета не рассматривается в текущем scope.

## 9. Основные риски и меры контроля

| Риск | Контроль |
| --- | --- |
| Регрессия условий и значений | Characterization и contract tests до переноса |
| Несовместимость sessionStorage | Сохранение schema version либо явная миграция |
| Поломка DOM/CSS/ARIA | Семантические DOM-тесты и ручной smoke |
| Утечки subscriptions/listeners | Явный lifecycle contract и cleanup tests |
| Нарушение тайминга анимаций | Отдельные effects и интеграционные проверки |
| Формальная TS-миграция без пользы | Сначала строгие domain types и runtime boundary |
| Overengineering registry | Контракт только из потребностей текущих полей |
| Смешение исправлений и рефакторинга | Один scope на спринт, локальные diff и отдельные отчёты |
| Потеря пользовательских изменений | Проверка working tree и отсутствие destructive Git операций |

## 10. Definition of Done всей программы

- Текущие пользовательские сценарии сохранены.
- Tests, tooling и production-код физически разделены.
- Form core и Kapsula integration имеют явную границу.
- Добавление типа поля локализовано в field definition/renderer.
- Config и значения типизированы и проверяются на runtime boundary.
- Lifecycle и cleanup покрыты тестами.
- Test, typecheck, lint и build проходят.
- Developer workflow и визуальная приёмка через `npm run dev` задокументированы.
- В `agent-reports/development.md` и `agent-reports/testing.md` зафиксированы фактические изменения и результаты.

## 11. Рекомендуемый следующий шаг

Начать только со Спринта 0 после отдельного согласования его scope. Архитектурные изменения формы до получения зелёного baseline не выполнять.

## 12. Спринт 0 — impact analysis

### 12.1. Состояние working tree

- Production-файлы, связанные с 5 падающими тестами и 11 ESLint errors, не имеют diff относительно `HEAD` (`302cbd0`). Ошибки находятся в текущем коммите, а не в незакоммиченных изменениях.
- В working tree присутствуют пользовательские изменения: `AGENTS.md` имеет staged-пустую версию и незакоммиченный рабочий текст; изменены `graphify-out/graph.json` и `graphify-out/.graphify_analysis.json`; внутри `graphify-out/` есть untracked-файлы; `agent-reports/` также untracked.
- Developer Agent не должен выполнять reset, checkout, clean, массовое форматирование или добавление всех файлов через `git add .`. `graphify-out/` остаётся read-only.

### 12.2. Подтверждённый baseline

- `npm test -- --reporter=dot`: 9 suites, 71 tests; 66 проходят, 5 падают в `src/scripts/kapsula/popup/popupLeadPayload.test.js`.
- Все 5 падений вызваны одним `ReferenceError` в `src/scripts/kapsula/popup/popupLeadPayload.js:46`: идентификатор `undefinedы` вместо `undefined`.
- `npm run lint -- --format stylish`: 11 errors в пяти production-файлах; предупреждений нет.

### 12.3. Минимальный набор исправлений для Developer Agent

1. `src/scripts/kapsula/popup/popupLeadPayload.js`: заменить только `undefinedы` на `undefined`. Тесты и payload contract не менять.
2. `src/scripts/kapsula/createReactiveForm.js`: удалить два диагностических `console.log` из `getSnapshot()` и `validate()`. Возвращаемые значения и порядок вычислений сохранить.
3. `src/scripts/kapsula/formValidation.js`: удалить три диагностических `console.log`; оставить `safeParse`, cache и возврат результата без изменений.
4. `src/scripts/kapsula/createCalendarContent.js`: убрать default value у второго параметра `value`, поскольку все вызовы идут через `SECTION_RENDERERS` и передают `currentValue`; `value = ''` нельзя оставлять перед обязательными `values` и `updateState`. Два прямых console-вызова убрать либо направить через существующий `logWarning`/`logDebug`; для минимального baseline предпочтительно удалить отладочный `console.log`, а предупреждение об отсутствующем `updateState` сохранить через `logWarning`.
5. `src/scripts/kapsula/renderForm.js`: предупреждение о неизвестном типе направить через существующий `logWarning`; в этой ветке явно вернуть `null`, чтобы обе ветки `createSectionNode()` имели согласованный return contract. `createNode()` уже отфильтровывает falsy children, поэтому `null` сохраняет текущее отсутствие секции.

Итого ожидаемый production diff ограничивается пятью файлами выше. Не изменять конфиг формы, тесты, архитектуру, dependencies, generated indexes и стили.

### 12.4. Риски и контроль

- `popupLeadPayload.js` влияет на отправку лида: проверить все 7 тестов файла, особенно взаимоисключение phone/email и поля с `render: false`.
- Замена предупреждений на `logger.js` добавляет только локальные imports и сохраняет проектную политику: warning виден в dev/debug, но не шумит в production-консоли.
- Удаление debug logs безопасно для логики, но нельзя удалять `logError` или существующую обработку ошибок в соседнем коде.
- Изменение default parameter безопасно только при сохранении текущей позиции аргументов; не переставлять параметры и не менять `SECTION_RENDERERS`.
- После правок: targeted `popupLeadPayload.test.js`, затем все 9 suites, lint и build. Любые дополнительные ошибки фиксировать отдельно, не расширяя Спринт 0 автоматически.

## 13. Спринт 0 — build blocker

### 13.1. Причина и граница контракта

`src/order.json` сейчас содержит `folder: "interns-landings"`, тогда как оба потребителя CDN-префикса читают только `assetsPrefix`:

- `src/lib/check-assets-prefix.mjs` делает отсутствие `assetsPrefix` фатальной ошибкой и останавливает `npm run build` до сборки;
- `src/lib/rewriteAssetsBuild.mjs` использует `assetsPrefix` для преобразования root-relative URL в `https://b2ccdn.coral.ru/content/<assetsPrefix>/...`.

`src/lib/build-cms.mjs` и генераторы используют из `src/order.json` только `blocks`; поле `folder` ими не читается. Следовательно, `folder` и `assetsPrefix` нельзя считать взаимозаменяемыми без подтверждения deployment-контракта: первое относится к структуре проекта/deploy tooling, второе явно задаёт CDN URL. История файла подтверждает, что до commit `1710e7f` корректным CDN-префиксом Kapsula был `landing-pages/kapsula`, после чего он был заменён на `folder`, а не перенесён в отдельное поле.

### 13.2. Рекомендуемое минимальное решение

Добавить в `src/order.json` отдельное поле:

```json
"assetsPrefix": "landing-pages/kapsula"
```

и сохранить существующие `folder` и `blocks` без изменений. Это один конфигурационный файл и восстановление ранее действовавшего значения, а не изменение build-логики.

Влияние:

- `npm run dev`: отсутствует; dev использует локальный Vite CDN rewrite и генераторы по `blocks`;
- `npm run build`: `check` проходит, CMS bundle собирается, затем root-relative изображения получают исторический CDN prefix;
- `npm run deploy*`: `folder: "interns-landings"` сохраняется для внешнего deploy tooling; добавленный `assetsPrefix` влияет только на URL ресурсов внутри собранного CMS HTML.

Точный изменяемый файл: `src/order.json`. После согласования проверить `npm run check`, `npm run build`, затем выборочно убедиться в `@CMS/kapsula.html`, что URL начинаются с `https://b2ccdn.coral.ru/content/landing-pages/kapsula/`. Сам `@CMS/` является build output и не должен добавляться в исходный diff.

### 13.3. Альтернатива

Мигрировать build pipeline на fallback `assetsPrefix ?? folder`: синхронно изменить `src/lib/check-assets-prefix.mjs` и `src/lib/rewriteAssetsBuild.mjs`, а также актуализировать описание контракта в `README.md` и `PROJECT.md`.

Эта альтернатива не рекомендуется для Спринта 0: она меняет семантику общего tooling и превратит `interns-landings` в CDN-путь, тогда как исторически ресурсы Kapsula ожидались под `landing-pages/kapsula`. Возможны корректный локальный build, но битые production assets после deploy. Выбирать её можно только после подтверждения, что CDN действительно мигрирован на `content/interns-landings` и `folder` официально является единым полем для deploy и CDN.

## 14. Спринт 1 — impact analysis

### 14.1. Граница Спринта 1

Graphify показывает `createReactiveForm()` как bridge node с degree 20 между state/schema/value-логикой, DOM-renderer, session state, animations и overlay. Поэтому characterization-тесты должны фиксировать наблюдаемое поведение этой границы, но не внутреннее устройство RxJS pipelines и не количество внутренних вызовов render/effect при каждом emission.

В scope входят только новые тесты, fixtures и test helpers. Production seam не требуется: текущие `createReactiveForm(rootNode, options)`, возвращаемый lifecycle handle, `renderForm(...)` и экспортированные функции `sessionState.js` уже дают достаточные точки наблюдения. Для тяжёлых браузерных эффектов использовать Vitest module mocks. Production-код, `formConfig.json`, markup/templates, styles, build scripts, `src/order.json`, generated indexes и `graphify-out/` не менять.

### 14.2. Минимальный набор файлов

Рекомендуемый test-only scope:

- `tests/fixtures/formConfigurator.js` — две небольшие фабрики конфигурации: минимальная форма для lifecycle и форма со всеми текущими renderer-вариантами (`cards`, `text`, `textarea`, `calendar`), включая single/multiple, required, `visibleWhen`/`hiddenWhen`, overlay и две капсулы;
- `tests/helpers/createFormRoot.js` — синтетический минимальный DOM root с обязательными `data-kapsula-*` узлами; не копировать целиком production HTML;
- `tests/integration/createReactiveForm.test.js` — публичный lifecycle и orchestration;
- `tests/integration/renderForm.test.js` — семантический DOM/ARIA-контракт и incremental update;
- `tests/integration/sessionState.test.js` — persisted-data contract и legacy migration.

Все DOM-файлы пометить `// @vitest-environment jsdom`. `vitest.config.js` уже включает `tests/**/*.{test,spec}.js`, поэтому конфигурацию и dependencies менять не требуется. Тесты Спринта 1 сразу размещать в `tests/`, не перемещая существующие colocated tests: полное разделение остаётся Спринтом 2.

### 14.3. Точные characterization-сценарии

#### `createReactiveForm.test.js`

1. При отсутствии обязательного title/subtitle/image/form узла создание завершается текущей явной ошибкой.
2. Инициализация выбранной капсулы восстанавливает saved values и active section, обновляет title/subtitle/submit label/image adapter и возвращает нормализованный `getSnapshot()`.
3. Делегированные `click`, `change`, `input` обновляют expanded state и значения; смена choice запускает существующую каскадную нормализацию; submit предотвращает browser default.
4. `validate()` возвращает результат текущей Zod-валидации, а `showValidationErrors()` делегирует issues renderer-границе. Детальный текст/ARIA ошибки проверяется отдельно в `renderForm.test.js`.
5. `setCapsule()` возвращает `false` для неизвестной капсулы, не меняя snapshot; для известной восстанавливает её values/active section и выполняет full render.
6. `prepareCapsule()` возвращает `false` для неизвестной капсулы и для известной делегирует responsive source/preload adapter.
7. Persistence: изменение значений сохраняется после 150 ms debounce; `pagehide` синхронно сохраняет последние значения; textarea не попадает в persisted option values — это текущее наблюдаемое поведение, которое нельзя молча изменить при рефакторинге.
8. `destroy()` вызывает destroy overlay, отменяет debounce/subscriptions и снимает `pagehide`/`visibilitychange`/delegated DOM listeners: события после destroy не должны вызывать save/render/update effects.

В этом файле mock-ировать animations, overlay и responsive-image adapters, чтобы тесты проверяли orchestration, а не GSAP/image loading. `formSchema.js` допустимо частично mock-ировать только на уровне `buildCapsuleMap()`/default config для передачи маленькой fixture; чистые schema/value rules уже покрыты существующими unit tests и не должны дублироваться.

#### `renderForm.test.js`

1. Full render создаёт секции известных типов, исключает неизвестный renderer без падения и сохраняет порядок известных секций.
2. Cards: корректны radio/checkbox, `name`, `value`, `checked`, fieldset/legend и `data-section-id`; условно скрытые options отсутствуют.
3. Textarea/text/calendar: проверять только собственные controls, name/value/placeholder, label/`aria-describedby` и передачу аргументов calendar renderer. Сам Flatpickr не поднимать в этом тесте — `createCalendarContent.js` mock-ировать.
4. Section shell: trigger — `button type=button`; `aria-expanded`, `aria-controls`, panel `role=region` и `aria-labelledby` согласованы; required marker скрыт от assistive technology.
5. Incremental render меняет checked/options/summary/`aria-expanded`, но сохраняет identity существующего DOM input и его focus, если section/corresponding option остаётся видимой.
6. `renderFormValidationErrors()` показывает `role=alert` только секциям из issue paths, очищает ошибку после успешной проверки и не уничтожает существующий summary.

#### `sessionState.test.js`

1. Values и active section изолированы по capsule id и используют текущие versioned keys из `SESSION_STORAGE_KEYS`.
2. Актуальные versioned values имеют приоритет над legacy; legacy per-capsule и legacy map читаются и мигрируются в versioned key без записи обратно в legacy.
3. Повреждённый JSON, пустой capsule id и недоступный storage возвращают безопасный результат без исключения.
4. В этом спринте не тестировать screen/URL routing: это соседняя ответственность `setupScreenFlow`, не необходимая для characterization формы.

### 14.4. Что уже покрыто и не дублируется

Существующие tests уже фиксируют `visibleWhen`/`hiddenWhen`, каскадную normalisation, initial values, удалённые config options, `render: false`, expanded defaults и Zod rules. Новые integration tests должны использовать по одному репрезентативному примеру этих правил только для подтверждения wiring, а не копировать всю unit-матрицу.

Popup payload/hotels, overlay geometry, animation timing и реальная загрузка изображений не входят в Спринт 1. Контракт popup уже проверяется через snapshot/payload tests; визуальные тайминги требуют отдельного browser smoke, а не jsdom.

### 14.5. Защита от хрупких тестов

- Не использовать full `innerHTML`/file snapshots и не сравнивать полный class list: это зафиксирует форматирование, SVG path и декоративные wrappers вместо поведения.
- Проверять role, control type, accessible relationships, `data-*` hooks, значения, порядок видимых options и identity узлов точечными assertions.
- Не импортировать реальный `formConfig.json` в новые integration tests: контентные изменения трёх капсул не должны ломать lifecycle contract.
- Не утверждать точное число RxJS emissions, render/animation calls или порядок независимых effects; проверять конечное состояние и отсутствие вызовов после `destroy()`.
- Fake timers использовать только вокруг debounce и всегда восстанавливать real timers; очищать DOM, mocks и sessionStorage в `afterEach`, чтобы suites не зависели от порядка запуска.
- Из-за текущего `fragment.append(createSectionNode(...))` отдельно проверить неизвестный type: возврат `null` не должен создавать текстовый узел `"null"`. Если тест обнаружит такой узел, зафиксировать FAIL и вернуть Developer Agent минимальную локальную правку; не маскировать проблему fixture-ом.

### 14.6. Рекомендации Developer Agent и проверки

1. Сначала создать общие fixture/root helper, затем `renderForm` и `sessionState` tests, после них lifecycle test с минимальными mocks.
2. Не экспортировать приватные функции из production только ради assertions и не вводить dependency injection/новый controller в characterization-спринте.
3. Если без production seam тест требует проверки внутреннего state$, заменить assertion на публичный snapshot/DOM/effect boundary; seam согласовывать только при доказанной невозможности наблюдать критичное поведение.
4. Targeted: три новых integration-файла; related: все form tests; затем полный текущий suite и lint. Build остаётся not applicable по зафиксированному ограничению сборщика; `src/order.json` не менять.
5. UI Agent не требуется: UI/стили не меняются. Ручная проверка `npm run dev` остаётся пользовательским acceptance step после автоматических проверок.

## 15. Спринт 1 — feedback loop

### 15.1. Классификация трёх пробелов

1. **`visibilitychange` — test-only gap, не подтверждённый production defect.** В `createReactiveForm.js` listener уже сохраняет состояние только при `document.visibilityState === "hidden"`, а cleanup-функция в общей `Subscription` удаляет его при `destroy()`. Требуется assertion на обе половины контракта, production-код не менять.
2. **Pending debounce после `destroy()` — test-only gap, не подтверждённый production defect.** Результат `state$.pipe(...debounceTime(150)).subscribe(...)` уже добавлен в общую `Subscription`; RxJS unsubscribe отменяет ожидающую async action. Текущий тест уничтожает handle без предварительно запланированного изменения, поэтому не доказывает это поведение. Требуется корректный timer-сценарий, production-код не менять.
3. **Text renderer — реальный production defect.** Зарегистрированный `text` renderer создаёт голый input только с `type/value/placeholder/data-field`: отсутствуют `name`, `id` и accessible label. Это слабее уже существующего контракта textarea и делает поле неименованным для native form semantics и assistive technology.

### 15.2. Минимальное исправление

Изменить только `src/scripts/kapsula/renderForm.js` для text renderer:

- назначить стабильный `id` вида `kapsula-field-${section.id}` и `name: section.id`;
- сохранить текущие `type`, `value`, `placeholder` и `data-field`;
- возвращать небольшой content wrapper с `createSectionSubtitle(section)`, скрытым `<label for="...">` с `section.title` и input;
- при наличии subtitle установить `aria-describedby` на его существующий id, как у textarea.

Не выделять общий field factory и не менять textarea/cards/calendar: такое объединение является рефакторингом вне feedback loop. DOM wrapper для text — минимально необходимая семантическая структура; CSS-классы можно использовать существующие `kapsula-form-section__content` и `kapsula-form-section__label sr-only`, не добавляя стили.

### 15.3. Точные test-only изменения

- `tests/integration/createReactiveForm.test.js`: добавить сценарий hidden `visibilitychange` с синхронным save, затем очистить storage, вызвать `destroy()`, повторить событие и доказать отсутствие save. `document.visibilityState` подменять локально через configurable property и восстанавливать descriptor в cleanup.
- В том же файле: после завершения initial debounce очистить storage, создать новое state-изменение, вызвать `destroy()` до 150 ms, продвинуть fake timers и проверить отсутствие записи. Не смешивать этот assertion с событиями, отправленными уже после destroy.
- `tests/fixtures/formConfigurator.js`: добавить text fixture `subtitle`, если нужен отдельный `aria-describedby` assertion; это test data, не production config.
- `tests/integration/renderForm.test.js`: для text input проверить `name`, стабильный `id`, связанный `label[for]`, label text и `aria-describedby`; сохранить текущие assertions type/value/placeholder.

Неблокирующий wiring assertion `click → saveActiveSection` можно добавить в существующий click test без нового production scope, но он не должен задерживать исправление трёх обязательных gaps.

### 15.4. Риски и проверки

- Не фиксировать полный `innerHTML`: новый text wrapper проверяется только через semantic relationships.
- Тест `visibilitychange` не должен оставлять `visibilityState = hidden` другим tests; иначе последующие события могут создавать ложные persistence calls.
- Fake timers должны сначала погасить initial BehaviorSubject debounce, иначе тест может принять initial save за pending save пользовательского изменения.
- Targeted: `createReactiveForm.test.js` и `renderForm.test.js`; затем три integration suites, полный suite, lint и `git diff --check`. Build/template остаются вне scope, `graphify-out/` не менять.

## 16. Спринт 2 — impact analysis

### 16.1. Граница и подтверждённое состояние

Graphify подтверждает две независимые группы: девять colocated unit tests связаны со своими runtime-модулями, а `tests/serve.mjs` образует отдельный preview/tooling узел. Уже созданные `tests/integration`, `tests/fixtures` и `tests/helpers` соответствуют целевой структуре и остаются на месте.

Пользователь подтвердил, что preview не используется. Поэтому `tests/serve.mjs`, `tests/host.html` и команда `test:serve` удаляются, а не переносятся. Production-код, markup/template, `src/order.json`, build scripts, generated indexes и `graphify-out/` не входят в scope.

### 16.2. Точная карта перемещений

Перенести без изменения test cases, describe/it и assertions:

| Откуда | Куда | Новый production import |
| --- | --- | --- |
| `src/scripts/kapsula/buildCapsuleHref.test.js` | `tests/unit/kapsula/buildCapsuleHref.test.js` | `../../../src/scripts/kapsula/buildCapsuleHref.js` |
| `src/scripts/kapsula/formConditions.test.js` | `tests/unit/kapsula/formConditions.test.js` | `../../../src/scripts/kapsula/formConditions.js` |
| `src/scripts/kapsula/formSchema.test.js` | `tests/unit/kapsula/formSchema.test.js` | `../../../src/scripts/kapsula/formSchema.js` |
| `src/scripts/kapsula/formValidation.test.js` | `tests/unit/kapsula/formValidation.test.js` | `../../../src/scripts/kapsula/formValidation.js` |
| `src/scripts/kapsula/formValues.test.js` | `tests/unit/kapsula/formValues.test.js` | `../../../src/scripts/kapsula/formValues.js` |
| `src/scripts/kapsula/sanitizeRichText.test.js` | `tests/unit/kapsula/sanitizeRichText.test.js` | `../../../src/scripts/kapsula/sanitizeRichText.js` |
| `src/scripts/kapsula/hotels/hotelsNormalize.test.js` | `tests/unit/kapsula/hotels/hotelsNormalize.test.js` | `../../../../src/scripts/kapsula/hotels/hotelsNormalize.js` |
| `src/scripts/kapsula/popup/popupContactForm.test.js` | `tests/unit/kapsula/popup/popupContactForm.test.js` | `../../../../src/scripts/kapsula/popup/popupContactForm.js` |
| `src/scripts/kapsula/popup/popupLeadPayload.test.js` | `tests/unit/kapsula/popup/popupLeadPayload.test.js` | `../../../../src/scripts/kapsula/popup/popupLeadPayload.js` |

Сохранить `// @vitest-environment jsdom` первой строкой в `buildCapsuleHref`, `popupContactForm` и `sanitizeRichText`. После выхода из browser-glob `src/scripts/**/*.js` добавить точечные ESLint global comments: `window` для `buildCapsuleHref`, `document` для `popupContactForm`, `document, window` для `sanitizeRichText`. Не включать `globals.browser` для всех unit tests: pure Node tests должны продолжать ловить случайную зависимость от browser API.

### 16.3. Delete/update map

Удалить:

- `tests/serve.mjs`;
- `tests/host.html`;
- `test:serve` из `package.json`.

Обновить:

- `vitest.config.js`: `include` сократить до `tests/**/*.{test,spec}.js`; `environment: "node"`, per-file jsdom pragmas и coverage `include: ["src/scripts/**/*.js"]` оставить без изменений;
- `eslint.config.mjs`: функциональные glob-правила уже подходят (`tests/**/*` для Node/test globals), поэтому менять их не требуется; допустимо только убрать из комментария упоминание удалённого «тестового стенда»;
- `README.md`: заменить утверждение «тесты лежат рядом с кодом» на структуру `tests/unit`/`tests/integration`, а устаревшее утверждение, что DOM renderer не покрыт, — на фактическое characterization-покрытие;
- `PROJECT.md`: удалить `test:serve` из quick start, раздел локального стенда и «граблю», ссылающуюся на `tests/serve.mjs`; описать актуальные `npm test`/`npm run test:watch` и тестовую структуру.

`package-lock.json` не должен меняться: preview-сервер использует `node:http`, а не Express. `express` уже не импортируется нигде в проекте и является отдельным существующим dependency debt; его удаление не требуется для переноса tests и расширило бы scope изменением dependency graph.

### 16.4. Риски и меры контроля

- **Импорты:** главный риск — ошибиться на один уровень в `hotels/` и `popup/`; после move проверить каждый import через targeted run, не полагаться только на IDE rename.
- **jsdom:** pragma обязан остаться первой строкой; комментарий с globals размещать после него, иначе не рисковать распознаванием environment directive.
- **Coverage:** source include сохраняется, поэтому перенос tests не должен менять перечень instrumented production-файлов. После прогона убедиться, что coverage не включает сами tests/fixtures/helpers.
- **Generator/watch:** `gen-scripts-index.mjs` читает только `src/scripts/<block>.js` из `src/order.json`; вложенные tests он и раньше не индексировал. После удаления tests из `src/` generated `src/scripts/index.js` не должен получить diff.
- **История файлов:** выполнять moves без редактирования тела tests сверх import/global lines, чтобы Git распознал rename и сохранил историю.
- **Документация:** после удаления preview не должно остаться ссылок `test:serve`, `tests/serve.mjs`, `tests/host.html` в пользовательской документации. Исторические упоминания в `agent-reports` сохраняются как отчёт прошлых решений.

### 16.5. Рекомендации Developer Agent и проверки

1. Сначала создать `tests/unit/kapsula/{hotels,popup}`, переместить девять файлов и исправить только imports/globals.
2. Запустить девять moved suites; ожидаемый baseline — те же 71 unit tests. Затем запустить три существующих integration suites — 23 tests.
3. После green tests удалить preview-файлы и `test:serve`, обновить Vitest include и документацию.
4. Проверить: `npm test -- --reporter=dot` — 12 suites / 94 tests, `npm run lint`, `git diff --check`; отдельным `rg` подтвердить отсутствие tests/specs в `src/` и preview references в `README.md`/`PROJECT.md`/`package.json`.
5. Build/template не запускать и не изменять. UI Agent не требуется. После завершения Спринта 2 Graphify пока не обновлять без отдельной команды пользователя.

## 17. Спринт 3 — impact analysis

### 17.1. Архитектурная граница

Свежий Graphify подтверждает, что `formSchema.js` остаётся входной точкой schema/config для runtime и tests, а `createReactiveForm()` — высокосвязанный consumer. Поэтому в Спринте 3 нельзя мигрировать orchestration или существующие form rules: TypeScript вводится как новая строгая граница **до** `formSchema.js`, а существующий JS получает уже проверенный config через совместимый фасад.

Сборщик/шаблон, `src/lib/**`, `landing.config.mjs`, `src/order.json`, markup, generated indexes и `graphify-out/` не изменяются. Vite/Vitest config остаются JavaScript-файлами; их переименование в TS сейчас не даёт пользы и увеличивает scope.

### 17.2. Dependencies и package lock

Добавить прямые devDependencies:

- `typescript: ^6.0.3`;
- `typescript-eslint: ^8.67.0`.

Обе версии уже присутствуют в текущих `node_modules` и `package-lock.json` транзитивно через `eslint-config-airbnb-extended`; `typescript-eslint@8.67.0` допускает TypeScript `>=4.8.4 <6.1.0`, ESLint 9 и текущий Node 24. Новые runtime dependencies не нужны: boundary использует существующий `zod@4.4.3`/`zod/mini`.

Несмотря на наличие transitive copies, их необходимо объявить прямыми: проект напрямую запускает `tsc` и импортирует `typescript-eslint` из ESLint config. После изменения `package.json` синхронизировать root metadata/flags в `package-lock.json`; не редактировать lock вручную и не обновлять unrelated packages. Установка новых версий из сети не требуется, но Developer Agent должен использовать штатную npm-команду в текущем lock context и проверить минимальность lock diff.

### 17.3. Точная карта файлов

Создать:

- `tsconfig.json`;
- `src/modules/form-configurator/core/types.ts` — только модели config/value/conditions;
- `src/modules/form-configurator/core/config.ts` — Zod schemas и `parseFormConfig(input: unknown): FormConfig`;
- `src/modules/form-configurator/index.ts` — узкий public export типов и parser;
- `src/scripts/kapsula/kapsulaFormConfig.ts` — project composition boundary: импорт `../formConfig.json`, вызов parser, экспорт проверенного config;
- `tests/contract/formConfig.test.ts` — runtime/type boundary contract.

Изменить:

- `package.json` — две прямые devDependencies и script `typecheck: "tsc --noEmit"`;
- `package-lock.json` — только синхронизация root direct devDependencies/lock flags;
- `eslint.config.mjs` — подключить `typescript-eslint`, TS parser/recommended rules и `.ts` patterns;
- `vitest.config.js` — test discovery для `.test.ts`, coverage для нового `src/modules/**/*.ts`;
- `src/scripts/kapsula/formSchema.js` — заменить прямой JSON import на `kapsulaFormConfig` из TS boundary; остальную функцию/exports/default arguments не менять.

Не изменять `src/scripts/formConfig.json`: boundary проверяет существующий файл, но не переписывает его. Existing JS tests и fixtures не мигрировать в TS в этом спринте.

### 17.4. `tsconfig.json`: стратегия миграции

Минимальные compiler options:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "@CMS", "dist", "graphify-out"]
}
```

- `allowJs: true` нужен для постепенной связи TS boundary с текущими JS consumers/imports.
- `checkJs: false` принципиален: Спринт 3 не превращается в массовую типизацию всей legacy codebase.
- `strict: true` и `noUncheckedIndexedAccess` обязательны для нового модуля; suppressions/`any` не использовать вместо narrowing.
- `noEmit` сохраняет Vite источником runtime transpilation и исключает появление сгенерированных `.js` рядом с `.ts`.
- Отдельный `tsconfig.test.json` пока не нужен: один contract test и Vitest globals укладываются в общий config. При росте TS tests разделение можно оценить позже.

Если TypeScript 6 отвергнет конкретную опцию как изменившуюся/устаревшую, исправить только tsconfig совместимо с установленной версией; не понижать strictness и не обновлять toolchain автоматически.

### 17.5. Модель типов и runtime boundary

`types.ts` должен описать текущую фактическую модель, а не будущий registry:

- `ConditionRule` (`includes?`, `excludes?`) и map условий по field id;
- `FieldOption` с value/label/description, conditions и текущими overlay properties;
- discriminated union `FieldConfig`: `cards`, `textarea`, `text`, `calendar`;
- `CardsFieldConfig` требует `options`, остальные типы имеют только фактически используемые свойства и допускают project-specific optional presentation data;
- `CalendarValue`, `FieldValue`, `FormValues` с учётом текущего `null`/empty state;
- `FormVariant`/`CapsuleConfig` и `FormConfig` (`capsules`, optional `defaultCapsule`).

`config.ts` строит Zod discriminated union по `type` и проверяет минимум, необходимый для безопасного запуска runtime:

- config является object и содержит map `capsules`;
- capsule содержит title/subtitle/submitLabel/image fields и array sections;
- field имеет непустые `id`, `type`, `title`, boolean `render`; type только из текущего union;
- cards options имеют string `value`/`label`; conditions состоят из string arrays `includes`/`excludes`;
- textarea/text placeholder/subtitle — строки при наличии;
- calendar settings имеют поддерживаемые string properties при наличии.

Использовать `z.looseObject` на config/capsule/field/option границах либо эквивалентное сохранение unknown project keys. Это важно: текущий top-level содержит `submitEndpoint`, mail, popup и hotels, а options — overlay flags/images. Parser не должен молча удалить данные, которые позже читают `bindFormPopup` и visual effects.

`parseFormConfig` должен принимать `unknown`, возвращать `FormConfig` и fail fast с Zod issues до создания формы. Не добавлять fallback к непроверенному JSON, silent recovery или console logging. Проверку уникальности field ids/cross-field condition references отложить до registry/config-contract спринта, если она потребует сложных refinements; в Спринте 3 достаточно структурной boundary-проверки.

`kapsulaFormConfig.ts` — единственное место, где generic module знает о реальном JSON через project layer. `core/config.ts` не импортирует `formConfig.json`. `formSchema.js` сохраняет текущие exports и default behavior, но его default `formConfig` теперь является результатом parser.

### 17.6. ESLint и Vitest

ESLint:

- импортировать `tseslint` из `typescript-eslint` и добавить его flat `recommended` configs после базовых JS/Airbnb configs;
- для `**/*.ts` явно отключить core `no-undef`/`no-unused-vars` и использовать `@typescript-eslint/no-unused-vars`; type-aware rules/project service пока не включать — correctness обеспечивает отдельный `tsc`, а typed lint увеличит latency/config complexity;
- удалить ignore `**/*.d.ts`, поскольку TS parser теперь доступен;
- расширить browser/node/test patterns только там, где действительно нужны `.ts`: `src/scripts/**/*.{js,ts}`, `tests/**/*.{js,mjs,ts}`, test glob `**/*.{test,spec}.{js,mjs,ts}`;
- generic `src/modules/form-configurator/core` не получает browser globals.

Vitest:

- `include: ["tests/**/*.{test,spec}.{js,ts}"]`;
- coverage оставить на production sources, расширив до `src/scripts/**/*.{js,ts}` и `src/modules/**/*.ts`;
- `environment: "node"` сохранить; config contract test не требует jsdom;
- Vite уже транспилирует TS, дополнительный Vitest transformer/plugin не нужен.

### 17.7. Contract tests

`tests/contract/formConfig.test.ts` должен точечно проверять:

1. Реальный `kapsulaFormConfig` успешно проходит boundary и сохраняет Kapsula-specific top-level keys.
2. Минимальный config для каждого `cards`/`textarea`/`text`/`calendar` type принимается.
3. Неизвестный field type отклоняется с issue path до запуска UI.
4. Cards option без value/label и condition с не-string array отклоняются.
5. Parsed result сохраняет unknown project/presentation keys, а не strip-ит popup/hotels/overlay данные.

Не дублировать в этом файле conditions behavior, normalization или DOM tests: они уже покрыты unit/integration suites. Не использовать snapshot полного Zod error/JSON — проверять success/failure и релевантный issue path.

### 17.8. Этапы Developer Agent, риски и gates

1. Добавить direct devDependencies/lock metadata, `tsconfig.json`, `typecheck`; сразу выполнить пустой/инфраструктурный `npm run typecheck`.
2. Настроить ESLint/Vitest `.ts` patterns и проверить lint на минимальном TS smoke file либо сразу на `types.ts`.
3. Реализовать `types.ts` и `config.ts`, затем contract tests на synthetic configs.
4. Добавить project boundary `kapsulaFormConfig.ts`, переключить только JSON import в `formSchema.js`, запустить `formSchema` unit suite и три integration suites.
5. Gates: contract test, `npm run typecheck`, все 12 текущих suites + новый contract suite, `npm run lint`, `git diff --check`. Build/template не запускать и не изменять; Graphify не обновлять.

Основные риски:

- Zod `object` по умолчанию strip-ит unknown keys — потеря popup/hotels/overlay является критической регрессией;
- чрезмерно строгая схема может отклонить фактические optional/legacy поля; сначала прогнать parser на реальном JSON;
- чрезмерно широкие `unknown`/index signatures уничтожат пользу discriminated union; extras сохранять на runtime boundary, но известные core fields типизировать явно;
- импорт `.ts` из текущего JS должен быть одинаково разрешим TypeScript Bundler mode, Vite и Vitest; проверить targeted runtime tests, не менять build scripts;
- TypeScript и typescript-eslint уже transitive, но reliance на transitive dependency недопустим; lock diff должен сделать их прямыми без массового обновления дерева.

UI Agent не требуется: UI/стили/DOM не меняются. Blockers на момент анализа отсутствуют.

---

## 18. Спринт 4 — impact analysis

### 18.1. Подтверждённая граница изменений

Обновлённый после Спринта 3 Graphify (`1047 nodes / 1689 edges`) подтверждает, что чистые правила сейчас сосредоточены в четырёх legacy-модулях:

- `formConditions.js` используется нормализацией и DOM-renderer;
- `formValues.js` используется `createReactiveForm.js` и зависит только от conditions;
- initial/expanded values находятся в `formSchema.js`, который одновременно является Kapsula-фасадом config;
- `formValidation.js` вызывается runtime, а DOM-rendering issues уже отделён в `renderFormValidationErrors()`.

Главный orchestration consumer — `createReactiveForm.js`. Он также напрямую содержит переходы выбора option, ввода textarea, раскрытия секции и переключения капсулы. Календарный переход находится в `createCalendarContent.js`. Storage, DOM, RxJS, animations и responsive images должны остаться вне core.

Спринт 4 не меняет `formConfig.json`, persistence keys/JSON shape, popup/hotels, renderer markup, public handle `createReactiveForm()`, build/template, зависимости, конфиги и `graphify-out/`. JS-фасады сохраняются по прежним путям, поэтому текущие consumers и тесты не получают массового изменения импортов.

### 18.2. Точная карта файлов

Создать:

- `src/modules/form-configurator/core/conditions.ts`;
- `src/modules/form-configurator/core/values.ts`;
- `src/modules/form-configurator/core/state.ts`;
- `src/modules/form-configurator/core/validation.ts`;
- `tests/unit/form-configurator/conditions.test.ts`;
- `tests/unit/form-configurator/values.test.ts`;
- `tests/unit/form-configurator/state.test.ts`;
- `tests/unit/form-configurator/validation.test.ts`.

Изменить:

- `src/modules/form-configurator/core/types.ts` — добавить только runtime state/validation types и точные вспомогательные aliases;
- `src/modules/form-configurator/index.ts` — экспортировать стабильный core API и его types;
- `src/scripts/kapsula/formConditions.js` — совместимый re-export из TS core;
- `src/scripts/kapsula/formValues.js` — совместимый re-export из TS core;
- `src/scripts/kapsula/formValidation.js` — совместимый re-export из TS core;
- `src/scripts/kapsula/formSchema.js` — сохранить config/project selectors, но делегировать initial/expanded value helpers core;
- `src/scripts/kapsula/createReactiveForm.js` — заменить встроенные чистые вычисления переходов вызовами core, оставив RxJS/DOM/storage/effects на месте;
- `src/scripts/kapsula/createCalendarContent.js` — использовать тот же pure field-value transition вместо собственного shape update;
- существующие `tests/unit/kapsula/formConditions.test.js`, `formValues.test.js`, `formSchema.test.js`, `formValidation.test.js` оставить как compatibility tests фасадов; при необходимости изменить только fixtures с устаревшим `type: "choice"` на фактический `type: "cards"` без ослабления assertions;
- `tests/integration/createReactiveForm.test.js` использовать без структурной переработки как characterization gate.

Не переименовывать legacy JS-файлы и не переносить Kapsula-specific selectors (`getHotelsSettings`, popup/mail helpers) в generic core.

### 18.3. Core API и типы

#### Conditions

`conditions.ts` экспортирует:

```ts
isOptionVisible(option: FieldOption, values?: Readonly<FormValues>): boolean
getVisibleOptions(section: CardsFieldConfig, values?: Readonly<FormValues>): FieldOption[]
```

Семантика сохраняется буквально: `includes` — любое совпадение, `excludes` — отсутствие всех перечисленных значений, несколько field rules соединяются через `every`, `hiddenWhen` имеет приоритет над успешно выполненным `visibleWhen`. Внутренние helpers не входят в public index.

#### Initial values и normalization

`values.ts` экспортирует:

```ts
buildInitialValues(sections: readonly FieldConfig[], current?: Readonly<FormValues>): FormValues
normalizeFormValues(sections: readonly FieldConfig[], values: Readonly<FormValues>): FormValues
normalizeFormValuesUntilStable(sections: readonly FieldConfig[], values: Readonly<FormValues>): FormValues
toggleOptionValue(section: CardsFieldConfig, current: FieldValue | undefined, option: string): string | string[]
buildExpandedState(sections: readonly FieldConfig[], current?: Readonly<ExpandedState>): ExpandedState
```

Правила должны остаться совместимыми с persistence: `cards.multiple` хранит `string[]`, single cards/text/textarea — строку, calendar — `{from,to}` (initial) либо существующий `null` там, где его уже принимает normalization. `render: false` не создаёт state. Удалённые и скрытые options отбрасываются. Каскад выполняется максимум `sections.length` проходов и использует значения предыдущего прохода целиком — изменение порядка здесь является регрессией.

Для discriminated union нельзя применять текущую fallback-ветку «всё кроме textarea/calendar — cards»: `text` должен обрабатываться как строковое поле без `options`. Это локальное уточнение типизированного core; compatibility tests должны подтвердить отсутствие изменения фактического Kapsula config, где сейчас используются cards/textarea/calendar.

#### State transitions

`state.ts` вводит:

```ts
interface FormState {
  capsuleId: string;
  values: FormValues;
  expandedState: ExpandedState;
  activeSectionId: string | null;
  touchedSections: TouchedSections;
}

createFormState(capsuleId, capsule, {savedValues, savedActiveSectionId}): FormState
toggleSection(state, sectionId): FormState
selectOption(state, capsule, sectionId, optionValue): FormState
setFieldValue(state, sectionId, value): FormState
```

Функции не читают storage и не вызывают effects. Runtime заранее читает saved data и передаёт их аргументами. Неизвестная section возвращает тот же объект state. `toggleSection` сохраняет текущее наблюдаемое поведение: при открытии раскрыта только выбранная секция; при повторном клике все закрыты, но `activeSectionId` остаётся выбранным. `selectOption` применяет toggle, затем каскадную normalization и помечает section touched. `setFieldValue` покрывает textarea/text/calendar и помечает touched.

Переключение капсулы остаётся orchestration: `setCapsule()` проверяет map, читает storage, сбрасывает render history и создаёт state через pure `createFormState()`. Это не должно становиться core-функцией с зависимостью от Map/storage.

#### Validation contract

`validation.ts` переносит Zod schema/cache без DOM и экспортирует:

```ts
type ValidationIssue = { path: PropertyKey[]; message: string; [key: string]: unknown }
type ValidationResult = { success: true; data: FormValues } | { success: false; error: { issues: ValidationIssue[] } }
validateFormValues(capsule: CapsuleConfig, values: Readonly<FormValues>): ValidationResult
```

Для бесшовной миграции JS-фасад продолжает экспортировать имя `validateSchema` как alias `validateFormValues`; shape Zod `safeParse` (`success`, `data`/`error.issues`, issue path) сохраняется, поскольку его читает `createReactiveForm.showValidationErrors()`. WeakMap cache остаётся реализационной деталью core. Renderer получает только `issues`; импортов renderer/DOM в validation core нет.

### 18.4. Последовательность атомарных изменений

1. **Conditions:** создать TS implementation и Node unit suite; переключить `formConditions.js` на re-export; прогнать обе conditions suites и typecheck.
2. **Values:** перенести initial values, expanded state, toggle и normalization; добавить TS unit suite на field discriminants и cascade; переключить `formValues.js`, а `formSchema.js` сделать фасадом для initial/expanded helpers; прогнать обе legacy suites и integration.
3. **Validation:** перенести schema/cache, определить узкий result contract; сохранить `validateSchema` alias; прогнать core + legacy validation suites и integration validation flow.
4. **State:** добавить pure transitions и их unit tests; подключить их в `createReactiveForm.js` и `createCalendarContent.js`, сохранив side effects в runtime; прогнать full createReactiveForm characterization suite после каждого wiring change.
5. **Public boundary:** обновить `index.ts`, выполнить typecheck, полный suite, lint и diff-check. Не удалять фасады даже если прямых consumers мало.

Каждый шаг должен оставлять green state и отдельный обозримый diff; нельзя сначала удалить все legacy реализации, а затем восстанавливать поведение одним большим изменением.

### 18.5. Тестовая стратегия

Новые TS unit tests работают в Node и проверяют core напрямую:

- conditions: visible/hidden priority, includes/excludes, scalar/array/empty values, стабильный порядок options;
- values: empty value каждого field type, saved-value sanitization, `render: false`, array-to-single compatibility, text preservation, hidden-option cleanup и многошаговый cascade;
- state: saved active section, default expanded section, unknown section identity/no-op, open/close semantics, single/multiple choice, touched flags, textarea и calendar values;
- validation: required/optional string, multiple cards, calendar range, issue path и повторная проверка cached capsule.

Legacy unit suites остаются contract tests старых import paths. Integration suite подтверждает wiring, DOM/ARIA, capsule switching, rendering, validation issue delegation, debounce/pagehide/visibility persistence и destroy cleanup. Contract suite Спринта 3 подтверждает config/value compatibility.

Минимальные gates:

1. targeted новая core suite;
2. четыре legacy facade suites;
3. `tests/contract/formConfig.test.ts`;
4. `tests/integration/createReactiveForm.test.js` и `sessionState.test.js`;
5. `npm run typecheck`;
6. полный `npm test -- --reporter=dot`;
7. `npm run lint`;
8. `git diff --check`.

Build не является gate и не запускается: сохранён известный template blocker, а build/template находятся вне scope программы.

### 18.6. Риски и меры контроля

- **Persistence regression:** не менять keys, сериализацию и фильтрацию textarea; `getPersistedOptionValues()` остаётся в runtime. Проверять точный JSON integration assertions.
- **Type mismatch:** legacy tests используют фиктивный `type: "choice"`, которого нет в runtime boundary. Fixtures нужно привести к `cards`, не расширять production union несуществующим типом.
- **Text field gap:** текущий fallback предполагает options. В core нужен явный string path для `text`, иначе новый тип из уже опубликованного контракта упадёт при normalization.
- **Calendar null/object:** initial и normalization сейчас дают разные допустимые пустые представления. В этом спринте нельзя самовольно унифицировать persisted/runtime shape; тип сохраняет оба состояния, а tests фиксируют boundary.
- **Referential behavior:** RxJS сравнивает state slices по ссылке. No-op transitions обязаны возвращать исходный state; реальные transitions — новые `values`/`expandedState` ссылки.
- **Side effects:** `saveActiveSection()` должен вызываться runtime только после валидного section transition; storage нельзя прятать в pure reducer.
- **Validation compatibility:** нельзя заменить `safeParse` shape собственным boolean/error DTO без одновременной миграции renderer boundary; в Спринте 4 сохраняется shape и alias.
- **Circular imports:** conditions → types; values → conditions/types; state → values/types; validation → types. Обратные импорты запрещены.

### 18.7. Критерии приёмки

- conditions, values/normalization, initial/expanded state, transitions и validation находятся в строгих TS core-модулях;
- core не импортирует DOM, browser APIs, RxJS, storage, animations, popup/hotels или project config;
- старые JS import paths и `createReactiveForm()` public handle продолжают работать;
- config передаётся pure functions явно, `formConfig.json` импортируется только project composition boundary Спринта 3;
- persisted data format и filtering не изменены;
- все core tests выполняются в Node без jsdom, characterization/contract tests зелёные;
- typecheck, полный test suite, lint и diff-check проходят;
- пользователь подтверждает визуальную проверку через `npm run dev` до закрытия спринта;
- Graphify обновляется только отдельным действием после завершения и явного подтверждения пользователя.

Blockers на момент анализа отсутствуют. UI Agent не требуется.

---

## 19. Спринт 5 — impact analysis

### 19.1. Цель и подтверждённая граница

Свежий Graphify (`1104 nodes / 1829 edges / 66 communities`) использован для навигации и
подтверждает три оставшихся места, где знание `section.type` распределено между слоями:

- `core/values.ts` выбирает initial value и normalization;
- `core/validation.ts` строит Zod-схему значения;
- `createReactiveForm.js` сериализует state в session storage, а `renderForm.js` формирует
  summary и выбирает DOM renderer.

Фактический исходный код подтверждает связь validation через multiline ESM re-export в
`src/scripts/kapsula/formValidation.js`; отсутствие этой связи в Graphify является известным
ограничением анализатора, а не отсутствием runtime dependency.

Цель Спринта 5 — ввести минимальный типобезопасный registry определения field type для
`cards`, `textarea`, `text`, `calendar` и перенести в определения только пять уже существующих
domain responsibilities: initial value, normalization, validation schema, persistence
serialization и summary. DOM renderer не входит в `FieldTypeDefinition`: для него задаётся
отдельный interface, а фактический DOM wiring откладывается до Спринта 6.

Не входят в scope: изменение `formConfig.json`, config discriminants, persistence keys/JSON
container, payload shape, UI markup/styles/ARIA, RxJS/state API, calendar/flatpickr lifecycle,
popup/hotels, cross-field semantic validation, build/template, dependencies и Graphify.

### 19.2. Архитектура без циклических импортов

Создать `src/modules/form-configurator/core/fieldTypes.ts` с контрактом, registry и четырьмя
built-in definitions. Допустимое направление импортов:

```text
types.ts <- conditions.ts <- fieldTypes.ts <- values.ts <- state.ts
                         ^- validation.ts
                         ^- serialization.ts
                         ^- renderForm.js (summary helper only)
```

`fieldTypes.ts` может импортировать `zod/mini`, `conditions.ts` и type-only контракты из
`types.ts`. Обратный импорт из `types.ts`/`conditions.ts` запрещён. Registry не импортирует
`values.ts`, `validation.ts`, state, DOM или project config. `state.ts` продолжает зависеть
только от публичных операций `values.ts`, поэтому дополнительного цикла не возникает.

Создать `src/modules/form-configurator/core/serialization.ts` только для aggregate-функции,
которая обходит sections и вызывает definition. Само правило конкретного типа остаётся в
definition. Отдельный файл оправдан существующим runtime consumer и не смешивает storage API
с domain serialization.

Создать `src/modules/form-configurator/dom/renderer.ts` как type-only контракт. Он импортирует
только типы core и описывает renderer одного поля; core не импортирует этот файл. В Спринте 5
не переносить `SECTION_RENDERERS`, `createNode`, incremental DOM sync или calendar renderer в
TS: это образовало бы второй registry и расширило blast radius без необходимости.

### 19.3. Минимальный API и типы

В `core/types.ts` сделать `BaseFieldConfig` экспортируемым, не расширяя закрытый
`FieldConfig` union. Discriminated union и Zod boundary остаются ровно из четырёх типов.

`fieldTypes.ts` вводит контракты следующего уровня (точные имена могут быть локально уточнены,
но семантика должна сохраниться):

```ts
interface FieldTypeContext {
  values: Readonly<FormValues>;
}

interface FieldTypeDefinition<TField extends BaseFieldConfig = BaseFieldConfig> {
  readonly type: TField["type"] | string;
  getInitialValue(field: TField, saved: FieldValue | undefined): FieldValue;
  normalizeValue(field: TField, value: FieldValue | undefined,
                 context: FieldTypeContext): FieldValue;
  createValidationSchema(field: TField): z.ZodMiniType;
  serializeValue(field: TField, value: FieldValue | undefined): FieldValue | undefined;
  summarizeValue(field: TField, value: FieldValue | undefined,
                 context: FieldTypeContext): string;
}

interface FieldTypeRegistry {
  register<TField extends BaseFieldConfig>(definition: FieldTypeDefinition<TField>): void;
  get(type: string): FieldTypeDefinition;
}

createFieldTypeRegistry(definitions?: readonly FieldTypeDefinition[]): FieldTypeRegistry
getFieldTypeDefinition(field: FieldConfig): FieldTypeDefinition
summarizeFieldValue(field: FieldConfig, value: FieldValue | undefined,
                    values: Readonly<FormValues>): string
```

Registry хранит definitions в закрытом `Map`. `register()` выбрасывает явную ошибку
`Field type "..." is already registered` при дубле, `get()` — `Unknown field type: ...` при
неизвестном ключе. Built-in registry создаётся один раз из четырёх definitions; production
код не должен мутировать его. Для расширения экспортируется factory: custom-field proof в
unit test создаёт отдельный registry и регистрирует synthetic definition, не расширяя
production union и не обходя Zod boundary.

Generic параметр связывает discriminant и field config внутри definition. На boundary
registry допустим один локальный narrowing/helper cast, скрытый внутри реализации; `any` и
casts в consumers не допускаются. Не вводить generic `FormConfig<TCustomField>` и plugin
lifecycle: фактический runtime пока принимает только четыре discriminant.

DOM-контракт должен быть отдельным:

```ts
interface FieldRendererContext {
  values: Readonly<FormValues>;
  updateState?: (updater: (state: FormState) => FormState) => void;
}

interface FieldRenderer<TField extends FieldConfig = FieldConfig> {
  readonly type: TField["type"];
  render(field: TField, value: FieldValue | undefined,
         context: FieldRendererContext): HTMLElement;
}
```

Это только compile-time seam для Спринта 6. В `FieldTypeDefinition` не должно быть
`HTMLElement`, `document`, event handlers или `updateState`.

### 19.4. Семантика built-in definitions

- `cards`: initial value очищает неизвестные options; normalization использует
  `getVisibleOptions(field, context.values)` и сохраняет single/multiple behavior;
  validation — string либо string array; serialization сохраняет текущее значение с fallback
  `[]`/`""`; summary использует labels только видимых options, затем legacy fallback values.
- `textarea`: initial/normalization — string; validation — required/optional string;
  serialization возвращает `undefined`, сохраняя текущее исключение textarea из session
  storage; summary всегда пустой.
- `text`: initial/normalization — string; validation — required/optional string;
  serialization сохраняет строку с fallback `""`; summary возвращает строковое значение.
- `calendar`: initial — сохранённое значение либо `{from:"",to:""}`; normalization сохраняет
  существующую `null`/range границу; validation сохраняет текущий object contract;
  serialization возвращает текущее значение с fallback `""`, буквально сохраняя legacy
  behavior; summary сохраняет текущие правила, включая одинарную дату и range formatting.

Нельзя одновременно «исправлять» формат single calendar summary или унифицировать calendar
empty value: это наблюдаемое изменение, не registry migration.

### 19.5. Точная карта файлов

Создать:

- `src/modules/form-configurator/core/fieldTypes.ts` — contracts, registry, built-ins и
  summary helper;
- `src/modules/form-configurator/core/serialization.ts` — `serializeFormValues()`;
- `src/modules/form-configurator/dom/renderer.ts` — отдельный DOM renderer interface;
- `tests/unit/form-configurator/fieldTypes.test.ts` — registry/built-in/custom proof;
- `tests/unit/form-configurator/serialization.test.ts` — точный persistence value contract.

Изменить:

- `src/modules/form-configurator/core/types.ts` — экспортировать минимальный base field type;
- `src/modules/form-configurator/core/values.ts` — заменить type-switches делегированием
  definition, сохранив stable cascade algorithm без изменений;
- `src/modules/form-configurator/core/validation.ts` — capsule schema/cache остаются здесь,
  schema одного section берётся из definition;
- `src/modules/form-configurator/index.ts` — экспортировать registry factory, aggregate
  helpers и нужные type-only contracts; не экспортировать mutable built-in map;
- `src/scripts/kapsula/createReactiveForm.js` — заменить только
  `getPersistedOptionValues()` вызовом `serializeFormValues()`; session storage остаётся здесь;
- `src/scripts/kapsula/renderForm.js` — заменить только `getSectionSummary()` и связанные
  private label/date helpers вызовом `summarizeFieldValue()`; `SECTION_RENDERERS` и DOM sync
  пока оставить;
- `tests/integration/renderForm.test.js` — сохранить проверки summary/incremental DOM;
  invalid synthetic type должен ожидать явную registry error вместо silent skip, поскольку
  реальный config всё равно отклоняется раньше Zod boundary;
- `tests/integration/createReactiveForm.test.js` — сохранить точные persistence assertions;
- существующие core/legacy/contract suites менять только при необходимости импорта, не
  переписывать fixtures и assertions.

`formConditions.js`, `formValues.js`, `formValidation.js`, `formSchema.js`, state transitions,
`createCalendarContent.js`, `sessionState.js`, `popupLeadPayload.js` и `config.ts` структурно
не меняются. Multiline re-export `formValidation.js` сохраняется.

### 19.6. Migration/wiring по атомарным шагам

1. Добавить registry contracts/implementation и unit tests: четыре built-ins, duplicate,
   unknown и isolated custom registration. Сразу выполнить typecheck.
2. Перенести initial/normalize behavior в definitions; `values.ts` оставить aggregate/cascade
   facade. Прогнать core values + legacy values/schema suites.
3. Делегировать section validation definition, сохранив WeakMap capsule cache и настоящий Zod
   `safeParse` result. Прогнать core + legacy validation suites.
4. Добавить aggregate serialization и заменить локальную функцию runtime. Проверить точный
   debounce/pagehide/visibility JSON, включая отсутствие textarea.
5. Перенести summary rules и подключить helper в renderer. Проверить labels, text, textarea,
   calendar, hidden options и incremental render.
6. Добавить только type-only DOM renderer seam, обновить public exports, затем пройти все gates.

После каждого шага старые JS фасады остаются рабочими. Не переносить сразу DOM registry:
domain migration должна быть независимо проверяема в Node.

### 19.7. Compatibility strategy и тесты

Сохраняются без изменений:

- `FieldConfig` discriminated union и четыре Zod discriminant;
- loose-object preservation project/presentation keys;
- Kapsula project composition boundary и legacy JS import paths;
- `FormValues`, calendar `null`/object boundary, option cleanup и каскад предыдущими snapshots;
- session storage keys, JSON object shape и textarea exclusion;
- manager lead payload (`snapshot.values` по-прежнему включается целиком);
- Zod issue paths/safeParse shape и WeakMap cache;
- DOM structure, events, focus preservation, ARIA и renderer ordering.

Новые Node unit tests:

1. factory регистрирует и получает каждый built-in definition;
2. duplicate registration и unknown lookup дают стабильные явные ошибки;
3. synthetic custom definition работает в отдельном registry (initial/normalize/validate/
   serialize/summarize), но не принимается production `parseFormConfig()`;
4. type-specific initial/normalize behavior совпадает с существующими tests;
5. required/optional validation и issue paths не меняются;
6. serialization даёт точный object и исключает textarea;
7. summaries: visible card labels/fallback, textarea empty, text value, single/range calendar.

Gates:

1. новые `fieldTypes`/serialization suites;
2. существующие conditions/values/state/validation core suites;
3. четыре legacy facade suites и config contract suite;
4. `renderForm`, `createReactiveForm`, `sessionState`, popup lead payload suites;
5. `npm run typecheck`;
6. полный `npm test -- --reporter=dot`;
7. `npm run lint`;
8. `git diff --check`.

Build/template не являются gate и не запускаются. После automated PASS нужна визуальная
проверка `npm run dev`; Graphify обновляется только после закрытия спринта по отдельному
разрешению.

### 19.8. Риски, контроль и перенос в Спринт 6

- **Registry как service locator:** не разрешать глобальную runtime-регистрацию. Built-ins
  создаются декларативно, custom proof использует isolated factory.
- **Ослабление union:** custom proof не должен добавлять `[key:string]` type discriminator или
  `unknown` в `FieldConfig`; production config остаётся fail-fast.
- **Cycle через helpers:** definition не вызывает aggregate `values.ts`/`validation.ts`;
  общие leaf helpers остаются в `conditions.ts` либо private внутри `fieldTypes.ts`.
- **Zod cache regression:** кешируется capsule schema, не отдельные mutable definitions;
  registry built-ins после создания не меняются.
- **Persistence regression:** `undefined` означает «не включать ключ», а не JSON null; aggregate
  обязан отличать эти состояния.
- **Unknown renderer behavior:** real config отклоняется parser до UI; direct invalid schema
  получает явную ошибку. Это изменение только некорректного входа и фиксируется тестом.
- **Summary/DOM coupling:** summary возвращает только plain string; sanitizer/DOM creation в
  definition запрещены.

До Спринта 6 разумно отложить: фактический typed DOM renderer registry и миграцию
`renderForm.js`, lifecycle calendar renderer, typed UI events/updateState adapter, semantic
проверку уникальности field ids и cross-field condition references, а также официальный
plugin/custom-config extension contract. Эти задачи требуют отдельной оценки совместимости и
не нужны для доказательства domain registry.

### 19.9. Критерии приёмки

- четыре built-in field types определены ровно один раз через type-safe domain registry;
- initial, normalize, validate, serialize и summarize делегируются definitions без изменения
  валидного наблюдаемого поведения;
- duplicate/unknown errors детерминированы, custom definition доказан isolated unit test;
- DOM renderer описан отдельным type-only interface и не входит в domain definition;
- core не импортирует DOM/browser/RxJS/storage/project config;
- config union/Zod boundary, legacy фасады, persistence/payload shape сохранены;
- targeted/full tests, typecheck, lint и diff-check проходят;
- пользователь выполняет визуальную проверку перед закрытием спринта.

Blockers на момент анализа отсутствуют. UI Agent в Спринте 5 не требуется: DOM и визуальное
поведение не перерабатываются.

---

## 20. Спринт 6 — impact analysis

### 20.1. Цель, сложность и подтверждённый blast radius

Спринт 5 закрыт пользователем. Свежий Graphify (`1133 nodes / 1919 edges / 77 communities`)
использован первым для навигации. Он выделяет две основные runtime-зоны: community
`createReactiveForm.js` объединяет state, session persistence, DOM events и effects, а
community `renderForm.js` объединяет section shell, четыре field renderer, summary,
validation presentation и incremental DOM sync. Известное неполное извлечение multiline
re-export из `formValidation.js` не интерпретируется как отсутствие зависимости; фактический
исходный код проверен и остаётся источником истины.

Фактический объём концентрации ответственностей: `createReactiveForm.js` — 341 строка,
`renderForm.js` — 539, `createCalendarContent.js` — 97, `sessionState.js` — 160. При этом
публичный form handle используется `setupScreenFlow.js` и `bindFormPopup.js`, а текущие
integration tests фиксируют DOM, ARIA, focus, persistence и destroy behavior.

Классификация: **HIGH / STRONG для архитектурной границы, STANDARD для реализации**.
Причина — меняется ownership DOM lifecycle и подписок сразу на границе DOM/RxJS/storage,
хотя business state и публичный API остаются прежними. Blast radius ограничен form
configurator и Kapsula adapters, но регрессия может затронуть выбор опций, фокус, календарь,
сохранение последних данных и повторную инициализацию экрана.

Весь исходный scope можно выполнить в одном Спринте 6, но только как три внутренние части с
последовательными acceptance points: **6A renderer lifecycle**, **6B DOM decomposition**,
**6C orchestration/persistence/events**. Делать это одним большим diff без промежуточной
приёмки небезопасно. Если acceptance point не проходит, следующая часть не начинается; уже
рабочая часть остаётся совместимой через legacy facade.

Не входят в scope: изменение domain state/registry, config/Zod union, persistence keys или
JSON shape, RxJS primitives/operators, CSS/markup contract, animations/overlay logic,
responsive images, popup/hotels/lead payload, Kapsula screen flow, dependencies,
build/template и Graphify. Semantic config validation и public custom-plugin contract
остаются за пределами спринта.

### 20.2. Ownership и целевая граница

После Спринта 6 ответственности должны быть распределены так:

- `createReactiveForm.js` — Kapsula composition root и стабильный публичный handle;
- runtime state owner — единственный `BehaviorSubject<FormState>` остаётся в composition;
- event adapter — только перевод delegated DOM events в существующие pure transitions;
- persistence adapter — наблюдение state, debounce и browser flush lifecycle; storage API
  и legacy migration остаются в `sessionState.js`;
- DOM renderer controller — ownership section/field render handles, full/incremental render,
  validation presentation и гарантированный cleanup;
- field renderer registry — выбор typed DOM renderer по discriminant; отдельный от domain
  registry Спринта 5 и не мутируемый глобально;
- Kapsula calendar adapter — Flatpickr construction/localization и его teardown;
- Kapsula effects (`animateFormSections`, overlay, responsive picture) остаются в composition
  и не импортируются generic DOM/runtime-модулями.

Поток данных остаётся однонаправленным:

```text
delegated DOM event -> updateState(pure transition) -> BehaviorSubject
  -> renderer controller (DOM only)
  -> Kapsula effects (composition only)
  -> persistence binding -> serialize -> sessionState adapter
```

Ни renderer, ни persistence не владеют `FormState` и не вызывают `state$.next()` напрямую.
Они получают только `updateState`, read-only snapshot/resolver или observable. Переключение
capsule по-прежнему создаёт новый core state только в composition root.

### 20.3. Typed DOM renderer contract и lifecycle

Текущий `dom/renderer.ts` описывает только `render(): HTMLElement`; этого недостаточно для
incremental sync и teardown. Расширить контракт минимально:

```ts
interface FieldRenderContext {
  values: Readonly<FormValues>;
  updateState?: UpdateFormState;
}

interface FieldRenderHandle {
  readonly node: HTMLElement;
  sync(value: FieldValue | undefined, context: FieldRenderContext): void;
  destroy(): void;
}

interface FieldRenderer<TField extends FieldConfig = FieldConfig> {
  readonly type: TField["type"];
  render(field: TField, value: FieldValue | undefined,
         context: FieldRenderContext): FieldRenderHandle;
}
```

`destroy()` обязателен и идемпотентен; для cards/textarea/text это noop либо локальная очистка,
для calendar — `flatpickr` instance `destroy()`. `sync()` не пересоздаёт node. Cards синхронно
обновляет порядок/visibility/checked state существующих options; textarea/text обновляют
value только при расхождении, чтобы не сбрасывать caret/focus; calendar в текущем scope не
пересоздаётся на каждое изменение state и не получает новый defaultDate после собственного
`onChange`.

`createFieldRendererRegistry()` повторяет детерминированные duplicate/unknown guarantees
domain registry, но является отдельной DOM-структурой. Built-in registry собирается явно в
Kapsula composition из cards/textarea/text renderers и calendar adapter. Не добавлять DOM
renderer в `FieldTypeDefinition`: core остаётся browser-free. Не вводить plugin framework,
DI-container или generic lifecycle tree.

Section renderer controller хранит `Map<sectionId, {type, sectionNode, fieldHandle}>`.
При full render/capsule switch он сначала уничтожает все handles, затем заменяет DOM. При
incremental render он переиспользует section и field nodes; если id/type больше не совпадает,
старый handle уничтожается до удаления. Общий `destroy()` уничтожает все field handles,
очищает map и становится безопасным для повторного вызова.

### 20.4. Сохранение DOM, CSS, ARIA, focus и validation contract

Декомпозиция является структурной, поэтому должны буквально сохраниться:

- порядок `[data-kapsula-rendered-section]` и классы `kapsula-form-section*`;
- `button` trigger, `aria-expanded`, `aria-controls`, panel `role="region"` и
  `aria-labelledby`;
- required marker, subtitle ids и `aria-describedby`;
- cards fieldset/legend, radio/checkbox semantics, option datasets и selected class;
- textarea/text ids, names, placeholders и sr-only labels;
- отдельные summary/error nodes, `role="alert"`, текущее русское сообщение validation;
- plain-text summary и существующий `sanitizeRichText` только для subtitle;
- отсутствие `append` уже правильно расположенного option node;
- сохранение identity/focus/caret существующих inputs при incremental render;
- неизвестный renderer даёт `Unknown field renderer: <type>` до частично собранного shell.

Validation renderer не должен владеть Zod или validation state: он принимает уже готовые
issues и отображает их по первому segment path, как сейчас. Ошибка и summary остаются
раздельными узлами, чтобы incremental sync не стирал ошибку.

### 20.5. Persistence lifecycle и delegated events

Выделить persistence binding, сохранив текущую семантику без изменения RxJS:

- наблюдать только `{capsuleId, values}` с текущим reference comparator;
- `debounceTime(150)` оставить буквально;
- сериализовать через `serializeFormValues(capsule.sections, values)`;
- писать через переданный `saveFormValues`, не импортировать Kapsula storage из generic
  модуля;
- синхронный flush на `pagehide` и только при hidden `visibilitychange`;
- returned cleanup снимает оба browser listener и отменяет pending debounce;
- после cleanup ни timer, ни lifecycle event не должны сохранять данные;
- hydration, versioned/legacy keys и malformed/unavailable storage остаются без изменений в
  `sessionState.js`.

Event binding остаётся delegated на одном `formNode` и возвращает единый cleanup. Обязательный
контракт: `click` section trigger, `change` cards choice, `input` textarea и полноценный
`input` обычного config field type `text`, а также preventDefault submit. Сейчас text renderer
создаёт `data-field`, но orchestration обновляет только `[data-kapsula-textarea]`; устранение
этого разрыва является согласованной частью 6C, а не отложенной функциональностью.

Text input должен маршрутизироваться по metadata узла (`data-field`/field id) и фактическому
field type из текущей capsule schema, без списка бизнес-id и без отдельной ветки на каждый
новый экземпляр. Любое новое поле `{type: "text", ...}`, добавленное в валидный config,
автоматически получает renderer, delegated state update, core validation, persistence через
существующий type definition, hydration и summary. Orchestration не меняется при добавлении
таких экземпляров. Textarea сохраняет собственную persistence-семантику (исключается), тогда
как text сохраняется как строка. Calendar по-прежнему обновляет state собственным renderer
callback и не дублируется event delegation.

`saveActiveSection()` вызывается только после успешного `toggleSection`, с прежними
capsule/section ids. Event adapter не импортирует animations, popup/hotels или persistence
values binding.

### 20.6. Точная карта файлов

Создать (точные имена допустимо локально уточнить без изменения границ):

- `src/modules/form-configurator/dom/rendererRegistry.ts` — typed isolated registry;
- `src/modules/form-configurator/dom/fieldRenderers.ts` — cards/textarea/text renderer
  handles и shared DOM helpers, без Kapsula effects;
- `src/modules/form-configurator/dom/formRenderer.ts` — section shell, incremental sync,
  summary/validation rendering и ownership handles;
- `src/modules/form-configurator/runtime/bindFormEvents.ts` — delegated event lifecycle;
- `src/modules/form-configurator/runtime/bindFormPersistence.ts` — RxJS/browser flush
  lifecycle через injected adapters;
- `src/scripts/kapsula/kapsulaFieldRenderers.ts` — composition built-ins и calendar adapter;
- unit tests для renderer registry, renderer lifecycle, events и persistence bindings.

Изменить:

- `src/modules/form-configurator/dom/renderer.ts` — render handle/context/update types;
- `src/modules/form-configurator/index.ts` — экспортировать стабильные factories/types, не
  mutable built-in registry;
- `src/scripts/kapsula/createCalendarContent.js` — добавить lifecycle-aware factory/handle,
  сохранив legacy `createCalendarContent()` facade;
- `src/scripts/kapsula/renderForm.js` — оставить тонким legacy/Kapsula facade над controller;
- `src/scripts/kapsula/createReactiveForm.js` — composition controller, bindings и cleanup;
- `tests/integration/renderForm.test.js`, `createReactiveForm.test.js` — усилить lifecycle и
  identity assertions, не заменять существующие проверки snapshots;
- при необходимости только fixtures/helper types, без изменения production config.

`sessionState.js`, domain core, `formSchema.js`, `formValidation.js`, config JSON,
`setupScreenFlow.js`, `bindFormPopup.js`, animations/overlay/responsive modules, styles и
markup должны остаться без структурных изменений. Legacy exports `renderForm`,
`renderFormValidationErrors`, `createCalendarContent` и публичный `createReactiveForm` handle
сохраняются. Если для явного teardown facade нужен дополнительный export, production
composition использует controller напрямую, а старые вызовы продолжают работать.

### 20.7. Внутренние части и acceptance points

**6A — Renderer lifecycle foundation**

1. Расширить typed contract и добавить isolated renderer registry с duplicate/unknown tests.
2. Ввести calendar handle, захватить возвращаемый Flatpickr instance и гарантировать ровно
   один `destroy()` при teardown.
3. Acceptance: registry unit tests, calendar lifecycle test, typecheck, lint; DOM output
   календаря и legacy export не изменены.

**6B — DOM decomposition**

1. Перенести field render/sync helpers, затем section shell/summary/error helpers.
2. Ввести controller с handle map, full/incremental paths и destroy.
3. Оставить `renderForm.js` facade; переключить production composition только после
   equivalence tests.
4. Acceptance: существующий `renderForm` suite плюс tests на node identity/focus/caret,
   option reorder/removal, validation persistence, calendar reuse/destroy, capsule full
   render cleanup и idempotent renderer destroy.

**6C — Orchestration decomposition**

1. Выделить event binding, затем persistence binding без смены RxJS operators.
2. Реализовать общий delegated input path для каждого config field type `text`: получить id
   из DOM metadata, подтвердить field в текущей capsule schema и вызвать `setFieldValue()`.
   Не добавлять business-specific selectors/id и не регистрировать обработчик на каждый узел.
3. Сократить `createReactiveForm.js` до composition и прежнего public handle.
4. Упорядочить общий destroy: сначала прекратить события/persistence/state subscriptions,
   затем destroy renderer/calendar, overlay и complete subject; повторный destroy безопасен.
5. Acceptance: существующие createReactiveForm/sessionState suites плюс полный text-field
   config contract, no-op after destroy, pending debounce cancellation, pagehide/visibility
   listener removal, capsule switching, public API compatibility и effects isolation.

Каждая часть получает отдельный targeted PASS и небольшой diff review. Это внутреннее
разбиение одного спринта, не три новых пользовательских спринта.

### 20.8. Тестовая стратегия и финальные gates

Новые/расширенные проверки:

1. renderer registry: built-ins, duplicate, unknown, isolated custom renderer;
2. renderer controller: exact selectors/classes/ARIA, section ordering, summary/error,
   option visibility/order, identity и focus/caret при sync;
3. calendar: одна инициализация при incremental render, `onChange` transition, destroy при
   capsule switch/full render/root destroy, отсутствие double destroy;
4. events: nested event target через `closest`, missing/unknown field metadata no-op, cards
   single/multiple, textarea и text input, submit prevention, отсутствие действий после
   cleanup;
5. persistence: initial/debounced write contract, exact serialized JSON, capsule isolation,
   immediate flush, hidden-only visibility, cancellation/removal after cleanup;
6. public integration: getSnapshot/validate/showValidationErrors/setCapsule/prepareCapsule/
   destroy остаются совместимыми для `setupScreenFlow` и `bindFormPopup`;
7. regression: overlay/section animation вызовы не переносятся и получают прежние ссылки.

Обязательная матрица `text`:

1. config с одним и с двумя разными `text` fields рендерит каждый по id, без изменения
   orchestration/registry wiring;
2. delegated `input` обновляет только соответствующий key `FormState.values`, включая event
   от вложенного/совместимого target path; unknown id не меняет state;
3. incremental render сохраняет identity, focus и caret активного text input и обновляет
   value при внешней смене state;
4. required text отклоняет blank/whitespace по существующему Zod contract, optional принимает
   строку; issue path равен id конкретного config field;
5. debounce/pagehide/hidden visibility сохраняют каждый text key как строку, а textarea
   по-прежнему исключается; capsule ids и JSON container не меняются;
6. повторное создание формы и переключение capsule восстанавливают сохранённые text values,
   неизвестные/нестроковые saved values нормализуются существующим definition;
7. section summary отображает значение соответствующего text field и обновляется
   incrementally; validation error остаётся отдельным узлом;
8. после destroy text input event не меняет snapshot и не запускает render/persistence.

Последовательность gates: tests текущей внутренней части; все form-configurator unit suites;
`renderForm`, `createReactiveForm`, `sessionState`; config/facade/popup lead payload suites;
`npm run typecheck`; полный `npm test -- --reporter=dot`; `npm run lint`;
`git diff --check`. Из-за существенного DOM/lifecycle изменения после automated PASS
обязательна ручная проверка через `npm run dev`: keyboard focus, open/close sections,
conditional cards, textarea, calendar range, capsule switch и submit validation. Build и
template не являются gate; Graphify не обновляется во время реализации.

### 20.9. Основные риски и меры контроля

- **Calendar leak/double destroy:** lifecycle принадлежит renderer handle; teardown строго в
  controller, тестируется call count.
- **Focus/caret regression:** incremental path не использует `replaceChildren` и не пишет
  input value без расхождения; проверяется identity и selection range.
- **Partial shell при unknown type:** resolve всех renderer definitions до DOM commit либо
  fail до `replaceChildren`.
- **Validation state loss:** error node не принадлежит field handle и сохраняется section
  sync; full render ожидаемо создаёт новый shell.
- **Persistence race:** cleanup отменяет RxJS debounce до завершения state; immediate flush
  не вызывается как скрытый side effect destroy, сохраняя текущий contract.
- **Двойные listeners:** bindings создаются один раз на form instance и имеют idempotent
  cleanup; facade не должен неявно создавать второй production controller.
- **Generic/Kapsula смешение:** generic modules получают calendar/sanitizer/storage/effects
  как adapters; popup/hotels никогда не импортируются form-configurator.
- **Излишняя абстракция:** registry только `register/get`, renderer handle только
  `node/sync/destroy`; никаких plugin hooks, virtual DOM или component framework.

### 20.10. Что отложить в Спринт 7

- semantic config refinements: unique field ids и проверка condition references;
- официальный custom field/config extension contract и открытие production Zod union;
- перенос Kapsula-specific animations/overlay/responsive picture в другой lifecycle layer;
- изменение RxJS/state management, persistence version/schema migration;
- UI/CSS redesign, новый validation copy, focus-on-error и keyboard behavior сверх
  сохранения текущего контракта;
- дальнейшая TypeScript migration `sessionState.js`, popup/hotels и screen flow.

### 20.11. Критерии приёмки

- `createReactiveForm.js` является composition root, а persistence/events/DOM lifecycle имеют
  отдельные проверяемые границы;
- typed renderer registry обслуживает ровно четыре production field types без ослабления
  config union;
- каждый field render имеет deterministic/idempotent cleanup, Flatpickr уничтожается при
  full render, capsule switch и form destroy;
- DOM/CSS/selectors/ARIA/summary/validation и incremental identity/focus сохранены;
- public form handle, storage keys/shape/legacy hydration и RxJS timing сохранены;
- любой новый экземпляр валидного config field type `text` без правок orchestration получает
  renderer, delegated update, validation, persistence/hydration и summary;
- несколько `text` fields изолированно обновляют/сохраняют значения по своим config ids;
- Kapsula effects/popup/hotels не попали в generic modules;
- acceptance points 6A/6B/6C и все финальные gates проходят, затем выполнена ручная UI
  проверка пользователем.

Blockers на момент анализа отсутствуют. Нужна дисциплина последовательной реализации: scope
можно закрыть одним спринтом, но нельзя безопасно объединять 6A–6C в один атомарный diff.
