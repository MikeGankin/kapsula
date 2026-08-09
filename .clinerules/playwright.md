# Тестирование в браузере (Playwright CLI)

Для любых проверок вёрстки, снятия замеров и скриншотов используй скилл `playwright-cli`.
Подход через прямое подключение к CDP (см. `docs/VISUAL_AUDIT.md`) устарел — не повторяй его.

## Запуск страницы

Блок `@CMS/kapsula.html` самодостаточен, но требует CSS-переменных хоста, поэтому открывать
его нужно не файлом, а через тестовый сервер:

```bash
npm run test:serve        # собирает блок и поднимает http://localhost:4321
```

Сервер (`tests/serve.mjs`) подставляет собранный блок в `tests/host.html` и раздаёт `public/`.
После правок стилей или разметки блок надо пересобрать — скрипт делает это сам.

## Работа с браузером

Используй именованную сессию, чтобы не мешать другим задачам:

```bash
playwright-cli -s=kapsula open http://localhost:4321/
playwright-cli -s=kapsula resize 1024 900
playwright-cli -s=kapsula --raw eval "document.documentElement.scrollWidth - window.innerWidth"
playwright-cli -s=kapsula screenshot --filename=check.png
playwright-cli -s=kapsula close
```

По завершении задачи всегда закрывай сессию (`close`) и гаси сервер (`pkill -f tests/serve.mjs`) —
иначе процессы висят в фоне.

## Особенности окружения

- `node` и `npm` стоят под nvm и **отсутствуют в неинтерактивном PATH**. Перед вызовом `node`/`npm`
  подгружай окружение: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`.
- Сам `playwright-cli` доступен всегда — в `/opt/homebrew/bin/playwright-cli` лежит wrapper,
  который подставляет нужный путь к ноде.

## Известные шумы в консоли

Не считай эти ошибки дефектами блока, это артефакты локального окружения:

- CORS на шрифт `TrajanPro3Regular.woff2` с `b2ccdn.coral.ru` — на проде страница отдаётся с того же домена;
- 404 на `/favicon.ico`.

## Чего Playwright не покажет

Проблему `100vh` vs `dvh` (`_steps.scss`, `_form-screen.scss`) headless не воспроизводит:
сворачивающаяся адресная строка есть только на реальном устройстве. Проверять руками на телефоне.
