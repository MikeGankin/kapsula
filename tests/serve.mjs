/**
 * Тестовый сервер для визуальной проверки блока Kapsula.
 *
 * Отдаёт `tests/host.html` с подставленным содержимым `@CMS/kapsula.html`
 * и раздаёт `public/` как статику — то есть воспроизводит окружение CMS-хоста.
 *
 * Запуск:
 *   node src/lib/build-cms.mjs && node tests/serve.mjs
 *
 * Порт по умолчанию 4321, переопределяется через PORT.
 */
import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 4321;

const app = express();

/**
 * Точка входа `kapsula.js` активируется только на «своих» маршрутах
 * (TARGET_ROUTES) и ждёт готовности React-хоста через `CoralRouteBus`.
 * На localhost ни того, ни другого нет, поэтому отдаём страницу по пути
 * `/elite-service/constructor/` и подкладываем минимальную заглушку шины.
 */
const HOST_ROUTE = '/elite-service/constructor/';

const ROUTE_BUS_STUB = `
<script>
  // Минимальная заглушка шины маршрутов хоста: отдаёт текущий путь
  // сразу при подписке, чего достаточно для активации блока.
  window.CoralRouteBus = {
    subscribe(handler) {
      handler({path: window.location.pathname});
      return () => {};
    },
  };
</script>
`;

/**
 * Конфигурация отелей на проде приходит от хоста в `window.KAPSULA_HOTELS_CONFIG`.
 * Без неё попап не делает запрос за отелями, поэтому подкладываем dev-набор.
 */
async function readHotelsConfigStub() {
  const source = await readFile(
    resolve(ROOT, 'src/scripts/kapsula/hotelsConfig.dev.js'),
    'utf8',
  );

  return `<script>${source}</script>`;
}

app.get(['/', HOST_ROUTE], async (_req, res) => {
  try {
    const [host, block, hotelsConfigStub] = await Promise.all([
      readFile(resolve(__dirname, 'host.html'), 'utf8'),
      readFile(resolve(ROOT, '@CMS/kapsula.html'), 'utf8'),
      readHotelsConfigStub(),
    ]);
    // Замена только функцией: в строковом виде `replace` трактует
    // `$&`, `` $` ``, `$'` как спецпоследовательности, а минифицированный
    // бандл их содержит — код молча искажался и падал с SyntaxError.
    res.type('html').send(
      host.replace(
        '<div id="cms-root"></div>',
        () => ROUTE_BUS_STUB + hotelsConfigStub + block,
      ),
    );
  } catch (error) {
    res
      .status(500)
      .type('text/plain; charset=utf-8')
      .send(
        `Не удалось собрать страницу: ${error.message}\n\n` +
          'Сначала соберите блок: node src/lib/build-cms.mjs',
      );
  }
});

app.use(express.static(resolve(ROOT, 'public')));

app.listen(PORT, () => {
  console.log(`[test-server] http://localhost:${PORT}${HOST_ROUTE}`);
});
