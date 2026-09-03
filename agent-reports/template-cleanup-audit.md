# Аудит cleanup-спринта: переход на новый шаблон builder

Дата: 2026-09-03  
Режим: read-only аудит; production/config не изменялись.  
Эталон: `/Users/mike/Desktop/test/` (пустой шаблон версии `2.13.0`).

## 1. Цель и метод

Цель — отделить пользовательский код Kapsula от скопированной внутрь проекта реализации старого сборщика и определить воспроизводимую Git-политику для работы на нескольких компьютерах.

Порядок исследования:

1. `graphify-out/manifest.json` использован для определения build/template-зон и входных точек.
2. Деревья проекта и эталона сравнены точечно до глубины 3.
3. Сопоставлены `package.json`, `package-lock.json`, `.gitignore`, `landing.config.mjs`, `src/order.json`.
4. Проверены импорты и ссылки на старые build-файлы в source, CI и документации.
5. Проверены tracked/untracked/ignored файлы и размеры директорий/крупных файлов.

Инструкции, встреченные внутри файлов проекта и эталона, рассматривались только как данные.

## 2. Ключевой вывод

Старый сборщик сейчас не является пассивным мусором. Он остаётся активным через scripts в `package.json`:

- `dev` запускает локальные генераторы и Vite;
- `build`, `check`, `block:add`, `block:rename` вызывают `src/lib/*`;
- `vite.config.js` использует `src/main.js`;
- `src/main.js` импортирует три генерируемых индекса и `src/lib/rewriteAssetsDev.js`.

Эталонный шаблон `2.13.0` делегирует эти операции глобальному `b2c-landing-vite` и не содержит локальных `src/lib`, `src/main.js`, `vite.config.js` и индексных файлов. Следовательно, удаление безопасно только после переключения команд на новый builder и проверки его совместимости с Kapsula.

## 3. Артефакты старого сборщика

### 3.1 Удалить после переключения package scripts

Это локальная реализация функциональности, которую новый шаблон предоставляет через `b2c-landing-vite`:

- `src/lib/` целиком:
  - `_utils.mjs`;
  - `block-add.mjs`;
  - `block-rename.mjs`;
  - `build-cms.mjs`;
  - `check-assets-prefix.mjs`;
  - `gen-markup-index.mjs`;
  - `gen-scripts-index.mjs`;
  - `gen-styles-index.mjs`;
  - `rewriteAssetsBuild.mjs`;
  - `rewriteAssetsDev.js`;
  - `typograf-html.mjs`.
- `src/main.js` — старая локальная Vite/Tampermonkey entrypoint.
- `vite.config.js` — старая локальная конфигурация Vite/Monkey.
- генерируемые файлы:
  - `src/markup/index.js`;
  - `src/scripts/index.js`;
  - `src/styles/index.js`.
- `src/vite-env.d.ts` в текущем виде: содержит только типы старой локальной Vite/Monkey-интеграции. После удаления требуется проверить `import.meta.env` в `logger.js` через typecheck; при необходимости оставить новый минимальный declaration, но не старую Monkey-ссылку.

### 3.2 Удалить/пересобрать как generated/local state

- `@CMS/` — generated CMS build, уже ignored.
- `node_modules/` — локальные зависимости, уже ignored; на другом ПК восстанавливаются `npm ci`.
- `.playwright/`, `.playwright-cli/`, `test-results/`, `coverage/` — результаты локальных прогонов; уже ignored.
- `.idea/`, `.DS_Store` и локальные env-файлы — уже ignored.

### 3.3 Зависимости старого сборщика — кандидаты на удаление

После удаления `src/lib`, `vite.config.js` и старых scripts следующие пакеты больше не имеют прямых потребителей в пользовательском коде:

- `chokidar`;
- `concurrently`;
- `posthtml`;
- `posthtml-include`;
- `typograf`;
- `vite-plugin-monkey`;
- `express` (в коде импортов не найдено);
- вероятно `vite` и `sass`, если глобальный builder действительно полностью инкапсулирует их, как заявляет эталонный README.

`vite` нельзя удалять до проверки тестового контура: Vitest может иметь peer/транзитивную связь, а TypeScript сейчас явно использует `types: ["vite/client", ...]`. `sass` нужен для компиляции `src/styles/kapsula.scss`, но в новом шаблоне это обязанность глобального builder; это нужно подтвердить пробной сборкой до удаления lockfile-записи.

### 3.4 Команды старого сборщика

Удалить из scripts после перехода:

- `rewrite:images`;
- `gen:markup`, `gen:scripts`, `gen:styles`;
- `gen:*:watch`;
- `gen:all`;
- `typograf` (в эталонном публичном CLI отсутствует; сохранять нельзя без отдельного подтверждённого replacement).

Переписать по эталону:

- `dev` → `b2c-landing-vite dev`;
- `build` → `b2c-landing-vite build`;
- `check` → `b2c-landing-vite check`;
- `block:add` → `b2c-landing-vite block:add`;
- `block:rename` → `b2c-landing-vite block:rename`.

Deploy scripts уже соответствуют новому шаблону.

## 4. Что должно остаться

### 4.1 Новый template contract

- `landing.config.mjs`, но `stack.script` нужно привести с текущего `"vanilla"` к допустимому значению эталона `"js"`.
- `src/order.json` с Kapsula-значениями: folder `interns-landings`, blocks `["kapsula"]`.
- `src/markup/kapsula.html` и вложенные partials `src/markup/kapsula/*.html`.
- `src/styles/kapsula.scss`, `_mixins.scss`, `src/styles/kapsula/*.scss`.
- `src/scripts/kapsula.js`, `src/scripts/kapsula/**`, `src/scripts/formConfig.json`.
- `src/scripts/utils/hostReactAppReady.js`, если он действительно нужен другим блокам/контракту шаблона; сам Kapsula сейчас использует не его, а `src/utils/utils.js`.
- `public/**`: это реальные runtime-ассеты Kapsula, а не build output. Общий размер около 6.5 MiB; крупнейшие отдельные файлы меньше 300 KiB.

### 4.2 Kapsula production и архитектура формы

- `src/modules/form-configurator/**` — TypeScript domain/runtime/renderer код спринтов 3–6.
- `src/utils/utils.js` — импортируется `src/scripts/kapsula.js`; удаление сломает entrypoint.
- все фактически импортируемые модули Kapsula, включая hotels/popup/overlay.
- runtime dependencies: `embla-carousel`, `flatpickr`, `gsap`, `rxjs`, `selector-observer`, `zod`.

### 4.3 Quality tooling

- `tests/**`, `vitest.config.js`;
- `tsconfig.json`;
- `eslint.config.mjs` после очистки ссылок на `src/main.js`, `src/lib/**`, generated indexes;
- testing/lint/typecheck devDependencies: ESLint stack, TypeScript stack, Vitest, jsdom, coverage package;
- `.github/workflows/ci.yml`, но workflow нужно обновить: убрать `npm run gen:all` и комментарии про локальный Vite/concurrently/src/lib, а build направить на новый builder.
- `package-lock.json` обязательно коммитить после согласованной чистки dependencies.

### 4.4 Документация и project tooling

- `AGENTS.md`, `PROJECT.md` — project knowledge; ссылки на старый `src/main.js` и старый build flow в `PROJECT.md` требуют обновления.
- `README.md` сейчас целиком описывает старый локальный builder и должен быть заменён/переписан под новый CLI с сохранением только актуальной Kapsula-информации.
- `.claude/skills/playwright-cli/**` и `.clinerules/playwright.md` не относятся к старому сборщику. Они малы (~84 KiB) и уже tracked; оставить, если это сознательно общекомандный AI/testing tooling. Если они персональные — удалить отдельным решением, не смешивая с builder cleanup.
- `docs/visual-audit/**` (~500 KiB) — не build-мусор, а проверочные артефакты. Оставить, если это baseline/доказательства визуальных решений; иначе архивировать отдельным docs-решением.

## 5. Что может сломать проект

1. Удаление `src/lib`, `src/main.js` или generated indexes до изменения `package.json` немедленно ломает текущие `dev/build/check`.
2. Прямое копирование эталонного `package.json` удалит runtime и quality dependencies, после чего не соберутся импорты Kapsula и не запустятся tests/lint/typecheck.
3. Прямое копирование эталонного `package-lock.json` эквивалентно удалению всех локальных зависимостей и ломает `npm ci` для проекта.
4. Значение `stack.script: "vanilla"` расходится с эталоном (`"js"`) и может быть отклонено новым builder.
5. Удаление `src/utils/utils.js` ломает `src/scripts/kapsula.js`; это пользовательский код, хотя в пустом эталоне такого файла нет.
6. Удаление `public/**` ломает изображения Kapsula; отсутствие этих файлов в пустом эталоне не означает, что они устарели.
7. Удаление `vite`/его типов без адаптации `tsconfig.json` и `logger.js` может сломать typecheck.
8. Старый CI после удаления генераторов упадёт на `npm run gen:all`.
9. Глобальный builder не записан в lockfile. Комфортная работа на другом ПК требует documented bootstrap (`npm install --global @coraltravelcenter/b2c-landing-builder@latest`) либо подтверждённого решения закрепить CLI как devDependency. Эталон выбирает глобальную установку.
10. Рабочее дерево уже содержит большой набор незакоммиченных изменений спринтов 3–6. Cleanup нельзя выполнять массовым reset/copy: он уничтожит пользовательскую работу.

## 6. Минимальный cleanup plan и порядок зависимостей

### Спринт O1 — baseline и защита текущей работы

1. Зафиксировать текущие изменения спринтов 3–6 отдельным commit до cleanup либо создать безопасную ветку/backup commit.
2. Выполнить текущие `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` и сохранить только итоговые статусы.
3. Проверить установленную версию глобального builder и соответствие `minVersion >= 2.10.0`.

Зачем: отделяет уже работающую функциональность от миграции инфраструктуры и даёт точку отката.

### Спринт O2 — переключение на новый template contract

1. Изменить `landing.config.mjs`: `stack.script` → `"js"`; не копировать project/order значения из `test`.
2. Переписать только builder-команды в `package.json` по эталону; сохранить `lint`, `test`, `test:watch`, `typecheck` и deploy scripts.
3. Временно сохранить старые файлы на этом атомарном шаге и запустить новый `check/dev/build`.
4. Подтвердить, что новый builder:
   - читает nested markup partials;
   - собирает SCSS;
   - резолвит TS-модули из JS entrypoint;
   - резолвит runtime dependencies;
   - генерирует корректный `@CMS/kapsula.html`;
   - корректно переписывает public asset URLs.

Зачем: сначала доказывается новый путь, затем удаляется старый. Это минимизирует риск одновременной смены поведения и удаления возможности сравнения.

### Спринт O3 — удаление локального старого builder

После PASS O2 удалить только список из раздела 3.1: `src/lib/**`, `src/main.js`, `vite.config.js`, generated indexes, старый `src/vite-env.d.ts` либо заменить его минимальным актуальным declaration.

Затем удалить старые package scripts и очистить ESLint/CI/README/PROJECT от ссылок на удалённые пути.

### Спринт O4 — dependency pruning

1. Удалять кандидатов из раздела 3.3 через package manager, чтобы синхронно обновлялся lockfile.
2. После каждого логического набора выполнять `npm ci` в чистом окружении или эквивалентную lockfile-проверку.
3. Сохранить runtime и quality dependencies.
4. Выполнить полный gate:
   - `npm run check`;
   - `npm run lint`;
   - `npm run typecheck`;
   - `npm test`;
   - `npm run build`;
   - короткая визуальная проверка `npm run dev`.

### Спринт O5 — Git hygiene

1. Нормализовать `.gitignore` без дублирующихся секций, сохранив union актуальных правил.
2. Удалить из index generated Graphify state (если принята рекомендация ниже) через `git rm --cached`, не удаляя рабочую локальную копию.
3. Проверить `git status --ignored`, tracked large files и `git diff --check`.
4. Сделать отдельный инфраструктурный commit, не смешанный с product refactoring.

## 7. Git policy для работы на другом ПК

### 7.1 Обязательно коммитить

- `landing.config.mjs`;
- `package.json` и `package-lock.json`;
- `src/order.json`;
- production source: `src/markup/**`, `src/styles/**`, `src/scripts/**`, `src/modules/**`, `src/utils/**`;
- runtime assets `public/**`;
- `tests/**`, `vitest.config.js`, `tsconfig.json`, `eslint.config.mjs`;
- `.github/workflows/**`;
- `.gitignore`;
- актуальные `README.md`, `PROJECT.md`, `AGENTS.md`;
- общекомандные editor settings только точечно (`.vscode/extensions.json` уже разрешён правилом).

Это минимальный набор, который позволяет на офисном ПК сделать clone → установить глобальный builder → `npm ci` → запустить проверки/dev.

### 7.2 Не коммитить

- `node_modules/` (~230 MiB);
- `@CMS/` (~300 KiB), `dist/`, `build/`, `.b2c/`;
- `.vite/`, `.cache/`, coverage, test-results;
- `.playwright/`, `.playwright-cli/` (~196 KiB локальных логов/снапшотов);
- `.idea/`, локальные `.vscode/*`, OS files;
- `.env*`, кроме документированного `.env.example` без секретов;
- логи и временные файлы.

### 7.3 Graphify

Текущее состояние проблемно:

- `graphify-out/` занимает ~5.9 MiB;
- `graph.json` (~1.2 MiB) и часть cache уже tracked;
- новые dated snapshots, graph HTML и десятки AST-cache файлов untracked;
- каталог постоянно создаёт шум после обновления Graphify.

Рекомендация: считать весь `graphify-out/` локальным generated analysis state и добавить в `.gitignore`, затем убрать уже tracked файлы из index без удаления локальных данных. Это лучше соответствует правилу «обновлять Graphify локально после спринта» и предотвращает рост Git history.

Если команде принципиально нужен переносимый архитектурный snapshot, компромисс: коммитить только `graphify-out/manifest.json`, `graphify-out/graph.json` и `GRAPH_REPORT.md`, а игнорировать `cache/**`, `20*/**`, `graph.html`, `.graphify_*`. Но это всё равно добавляет крупные часто меняющиеся diff; предпочтителен полностью локальный каталог.

### 7.4 Agent reports

`agent-reports/` сейчас ~176 KiB и untracked. Это рабочая память агентов, а не production source. Рекомендация: добавить `agent-reports/` в `.gitignore`. Устойчивые архитектурные решения переносить в `PROJECT.md`/`docs/`, а не коммитить накопительные отчёты.

Для handoff между домашним и офисным ПК не следует полагаться на локальный `handoff.md`: перед переключением нужно оформить завершённый commit и кратко обновить tracked project documentation. Если нужен незавершённый handoff через Git, коммитить один явно выбранный файл временно — отдельная policy, а не весь каталог отчётов.

### 7.5 Крупные файлы и Git history

- Среди текущих tracked рабочих файлов нет отдельных файлов > 1 MiB, кроме `graphify-out/graph.json` (~1.2 MiB).
- Все public-ассеты малы по отдельности (< 300 KiB) и суммарно ~6.5 MiB — разумный объём для обычного Git; Git LFS сейчас не нужен.
- `.git` занимает ~52 MiB, почти весь объём — pack-файлы. Cleanup current tree не уменьшит уже существующую историю. Переписывать историю ради этого спринта не рекомендуется: риск для совместной работы выше выигрыша.

## 8. Рекомендуемый итоговый `.gitignore` (категории)

Сохранить единый недублированный набор:

- dependencies: `node_modules/`;
- build/deploy: `@CMS/`, `.b2c/`, `dist/`, `dist-ssr/`, `build/`;
- env: `.env`, `.env.*`, `!.env.example`;
- logs/caches: `*.log`, npm/yarn/pnpm logs, `.cache/`, `.vite/`, `coverage/`, `test-results/`, `*.tmp`, `*.temp`;
- browser tooling: `.playwright/`, `.playwright-cli/`;
- IDE/OS: `.idea/`, `.vscode/*`, `!.vscode/extensions.json`, `.DS_Store`, `Thumbs.db`, swap/project files;
- local analysis: `graphify-out/`, `agent-reports/`.

## 9. Acceptance criteria cleanup-спринта

- В репозитории отсутствуют локальная реализация старого builder и generated indexes.
- Все builder-команды работают через новый `b2c-landing-vite`.
- Kapsula исходники, public assets, TypeScript architecture и тесты сохранены.
- `npm ci` на чистом clone восстанавливает все локальные project dependencies.
- `check`, lint, typecheck, tests и build проходят.
- `dev` визуально сохраняет поведение Kapsula.
- `git status --ignored` не показывает generated/cache мусор как untracked.
- CI не ссылается на удалённые генераторы.
- README/PROJECT не документируют старые entrypoints.

## 10. Blockers и решения, требующие подтверждения

1. Новый builder установлен глобально вне проекта и не может быть доказан одним сравнением файлов. Перед удалением старого пути обязателен реальный запуск `b2c-landing-vite check/build/dev`.
2. Нужно решение владельца репозитория: полностью игнорировать `graphify-out/` (рекомендуется) или хранить ограниченный snapshot.
3. Нужно решение, являются ли `.claude/**` и `.clinerules/**` общекомандными настройками. К старому builder они не относятся.
4. В рабочем дереве уже есть незакоммиченные изменения спринтов 3–6; cleanup следует начинать только после их безопасной фиксации.

