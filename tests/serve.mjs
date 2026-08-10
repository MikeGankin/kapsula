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
 *
 * Стоит на голом `node:http`: задача — отдать одну страницу и статику,
 * ради этого держать express в зависимостях смысла нет.
 */
import {createServer} from "node:http";
import {createReadStream} from "node:fs";
import {readFile, stat} from "node:fs/promises";
import {dirname, extname, join, normalize, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(ROOT, "public");
const PORT = Number(process.env.PORT) || 4321;

/**
 * Точка входа `kapsula.js` активируется только на «своих» маршрутах
 * (TARGET_ROUTES) и ждёт готовности React-хоста через `CoralRouteBus`.
 * На localhost ни того, ни другого нет, поэтому отдаём страницу по пути
 * `/elite-service/constructor/` и подкладываем минимальную заглушку шины.
 */
const HOST_ROUTE = "/elite-service/constructor/";
const PAGE_ROUTES = new Set(["/", HOST_ROUTE]);

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

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

/**
 * Конфигурация отелей на проде приходит от хоста в `window.KAPSULA_HOTELS_CONFIG`.
 * Без неё попап не делает запрос за отелями, поэтому подкладываем dev-набор.
 */
async function readHotelsConfigStub() {
  const source = await readFile(
    resolve(ROOT, "src/scripts/kapsula/hotelsConfig.dev.js"),
    "utf8",
  );

  return `<script>${source}</script>`;
}

async function renderPage() {
  const [host, block, hotelsConfigStub] = await Promise.all([
    readFile(resolve(__dirname, "host.html"), "utf8"),
    readFile(resolve(ROOT, "@CMS/kapsula.html"), "utf8"),
    readHotelsConfigStub(),
  ]);

  // Замена только функцией: в строковом виде `replace` трактует
  // `$&`, `` $` ``, `$'` как спецпоследовательности, а минифицированный
  // бандл их содержит — код молча искажался и падал с SyntaxError.
  return host.replace(
    '<div id="cms-root"></div>',
    () => ROUTE_BUS_STUB + hotelsConfigStub + block,
  );
}

/**
 * Путь из запроса нормализуем и держим внутри `public/`: без этой проверки
 * `../` в URL отдал бы наружу любой файл на диске.
 */
function resolvePublicPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const filePath = join(PUBLIC_DIR, normalize(decoded));

  return filePath.startsWith(PUBLIC_DIR) ? filePath : null;
}

async function serveStatic(pathname, res) {
  const filePath = resolvePublicPath(pathname);

  if (!filePath) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const stats = await stat(filePath);

    if (!stats.isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
      "Content-Length": stats.size,
      "Cache-Control": "no-cache",
    });

    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404).end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const {pathname} = new URL(req.url, `http://localhost:${PORT}`);

  if (!PAGE_ROUTES.has(pathname)) {
    await serveStatic(pathname, res);
    return;
  }

  try {
    const html = await renderPage();

    res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"}).end(html);
  } catch (error) {
    res
      .writeHead(500, {"Content-Type": "text/plain; charset=utf-8"})
      .end(
        `Не удалось собрать страницу: ${error.message}\n\n`
        + "Сначала соберите блок: node src/lib/build-cms.mjs",
      );
  }
});

server.listen(PORT, () => {
  console.log(`[test-server] http://localhost:${PORT}${HOST_ROUTE}`);
});
