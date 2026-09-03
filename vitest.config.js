import {defineConfig} from "vitest/config";

/**
 * Конфиг тестов держим отдельно от `vite.config.js`: тот собирает userscript
 * через vite-plugin-monkey, и подмешивать его в тестовый прогон незачем —
 * плагин лезет в сеть за метаданными и требует dev-сервер.
 */
export default defineConfig({
  test: {
    // Глобальные describe/it/expect: без них каждый файл начинался бы
    // с импорта из "vitest". Соответствует настройке globals.vitest в ESLint.
    globals: true,

    /*
     * jsdom нужен точечно — большая часть покрытой логики чистая. Тесты,
     * которым нужен DOM (buildCapsuleHref читает window.location), помечают
     * себя строкой `// @vitest-environment jsdom`, остальные бегут в node,
     * что заметно быстрее.
     */
    environment: "node",

    include: ["tests/**/*.{test,spec}.{js,ts}"],

    coverage: {
      provider: "v8",
      // Покрываем только код блока: сборочные скрипты проверяются самим
      // фактом успешной сборки, а не юнит-тестами.
      include: ["src/scripts/**/*.{js,ts}", "src/modules/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
});
