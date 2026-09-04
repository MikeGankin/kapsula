import js from "@eslint/js";
import {configs, plugins} from "eslint-config-airbnb-extended";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Airbnb-стиль на ESLint 9 (flat config).
 *
 * Оригинальный `eslint-config-airbnb-base` объявляет peer `eslint: ^7 || ^8`
 * и написан под legacy `.eslintrc`, поэтому взят поддерживаемый форк
 * `eslint-config-airbnb-extended` с теми же правилами под flat config.
 */
export default [
  {
    ignores: [
      "@CMS/**",
      "dist/**",
      "node_modules/**",
      // Индексы блоков генерируются скриптами из src/lib — править их руками нельзя.
      "src/markup/index.js",
      "src/scripts/index.js",
      "src/styles/index.js",
    ],
  },

  js.configs.recommended,

  /*
   * Плагины регистрируются отдельно от правил: конфиги airbnb-extended задают
   * только `rules`, поэтому без этих объектов ESLint падает на первом же
   * правиле вида `import-x/...` с «could not find plugin».
   */
  plugins.stylistic,
  plugins.importX,
  plugins.node,

  ...configs.base.recommended,

  ...tseslint.configs.recommended,

  {
    /**
     * Форматирование остаётся за редактором, поэтому весь стилистический слой
     * Airbnb выключен: кавычки, отступы, точки с запятой, переносы операторов.
     * Линтер должен ловить ошибки, а не спорить с автоформатом — иначе 80%
     * его вывода превращается в шум, который никто не читает.
     */
    name: "kapsula/disable-stylistic",
    rules: Object.fromEntries(
      Object.keys(plugins.stylistic.plugins["@stylistic"].rules)
        .map((rule) => [`@stylistic/${rule}`, "off"]),
    ),
  },

  {
    /**
     * Языковые настройки идут ПОСЛЕ конфигов airbnb: они задают
     * `parserOptions.ecmaVersion: 2018`, а он приоритетнее `ecmaVersion`
     * верхнего уровня. Из-за этого синтаксис новее ES2018 — например, `catch`
     * без параметра в `src/lib` — падал с «Parsing error».
     */
    name: "kapsula/language",
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },

  {
    /*
     * Браузерные глобалы — только клиентскому коду. Глобалы в flat config
     * мержатся, а не заменяются: объяви их на верхнем уровне — и `window`
     * с `document` станут «валидными» в сборочных скриптах, где их нет,
     * а `no-undef` промолчит.
     */
    name: "kapsula/browser",
    files: [
      "src/main.js",
      "src/scripts/**/*.{js,ts}",
      "src/utils/**/*.js",
      // Лежит в src/lib рядом со сборочными скриптами, но исполняется в браузере:
      // переписывает src/srcset на dev-CDN уже в смонтированном DOM.
      "src/lib/rewriteAssetsDev.js",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Шина маршрутов хост-сайта: объявлена глобально самим coral.ru.
        CoralRouteBus: "readonly",
      },
    },
  },

  {
    name: "kapsula/typescript",
    files: ["**/*.ts"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },

  {
    name: "kapsula/rules",
    rules: {
      /*
       * Отклонения от Airbnb — осознанные, под специфику проекта.
       * Каждое правило отключено с причиной, а не «чтобы не ругалось».
       */

      // Правила импортов идут с префиксом `import-x`: airbnb-extended построен
      // на eslint-plugin-import-x — форке eslint-plugin-import под flat config.
      //
      // Проект — блок для чужого сайта, а не пакет: импорты идут по относительным
      // путям, и devDependencies здесь единственный вид зависимостей сборки.
      "import-x/no-extraneous-dependencies": "off",
      // В кодовой базе принят экспорт по имени даже для единственной функции —
      // так проще искать по названию и не плодить безымянные дефолты.
      "import-x/prefer-default-export": "off",
      // Airbnb требует импорты без расширений — это правило из эпохи webpack
      // с его резолвером. Проект на нативном ESM, где расширение обязательно,
      // поэтому требуем обратное: всегда указывать `.js`.
      "import-x/extensions": ["error", "ignorePackages"],
      // Airbnb включает `noUselessIndex`, и он прямо противоречит правилу выше:
      // одно требует писать `./scripts/index.js`, другое — сократить до
      // `./scripts`. Сокращение резолвится только сборщиком, поэтому
      // побеждает явный путь.
      "import-x/no-useless-path-segments": ["error", {commonjs: true, noUselessIndex: false}],

      // Точка входа блока обязана быть дефолтным экспортом (контракт сборщика),
      // а импортируется под своим именем — это не ошибка переименования.
      "import-x/no-rename-default": "off",

      // Мутация DOM-узлов — суть императивного рендера (renderForm, overlay).

      "no-param-reassign": ["error", {props: false}],

      // Разрешаем `continue` и `for..of`: обход коллекций узлов читается лучше,
      // чем цепочки reduce, а regenerator в проекте не используется.
      "no-continue": "off",
      "no-restricted-syntax": ["error", "WithStatement", "LabeledStatement"],

      // Консоль отключена намеренно: диагностика идёт через logger.js,
      // который молчит в проде. Прямой console.* — ошибка.
      "no-console": "error",

      // Для переменных и классов правило остаётся: там обращение до объявления —
      // это TDZ и реальная ошибка. Объявления функций же поднимаются целиком,
      // и запрет ломает взаимную рекурсию (setup ↔ обработчик события
      // в setupHeaderUi.js), заставляя городить прокси-переменные.
      "no-use-before-define": ["error", {functions: false}],

      // Airbnb ограничивает длину строки 100 символами; в проекте принято 100
      // с послаблением для URL и длинных селекторов внутри строк.
      "max-len": ["warn", {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      }],
    },
  },

  {
    /*
     * logger.js — единственная точка, которой консоль разрешена: весь остальной
     * код обязан ходить через неё, чтобы диагностика молчала в проде.
     */
    files: ["src/scripts/kapsula/shared/logger.js"],
    rules: {
      "no-console": "off",
    },
  },

  {
    // Скрипты сборки и тесты живут в Node, а не в браузере.
    name: "kapsula/node",
    files: ["src/lib/**/*.{js,mjs}", "tests/**/*.{js,mjs,ts}", "*.config.{js,mjs}"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Для CLI-скриптов вывод в консоль — это и есть интерфейс.
      "no-console": "off",
      // Сборочные скрипты обрабатывают файлы строго последовательно: параллельный
      // Promise.all по десяткам файлов упирается в лимит дескрипторов и путает
      // порядок вывода. Здесь последовательный await — намерение, а не недосмотр.
      "no-await-in-loop": "off",
      // `__dirname`/`__filename` — имена из Node, а не «приватная» венгерская нотация.
      "no-underscore-dangle": ["error", {allow: ["__dirname", "__filename"]}],
    },
  },

  {
    /*
     * Тесты на vitest: глобальные describe/it/expect включены через
     * `globals: true` в конфиге vitest, поэтому линтеру их надо объявить —
     * иначе каждый тест утонет в `no-undef`.
     */
    name: "kapsula/tests",
    files: ["**/*.{test,spec}.{js,mjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
];
