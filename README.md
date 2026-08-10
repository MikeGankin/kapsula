# Landing blocks / CMS-ready верстка

> 📄 Описание самого лендинга «Капсула» — в [PROJECT.md](PROJECT.md):
> архитектура, ключевые файлы, запуск и грабли. Этот README — про сборщик.

Проект предназначен для разработки **блочной верстки**, которая:

- разрабатывается локально с удобным dev-окружением
- отображается **в реальном времени прямо на боевом сайте** через Tampermonkey
- собирается в **CMS-готовые HTML-файлы**
- не требует доработок при интеграции в CMS

---

## Ключевая особенность проекта

🔥 **Realtime-верстка на реальном сайте через Tampermonkey**

Благодаря связке **Vite + vite-plugin-monkey + Tampermonkey**:

- верстка инжектится **прямо в боевой сайт**, а не в абстрактный localhost
- HTML / CSS / JS обновляются **мгновенно**
- можно верстать и тестировать блоки **в реальном DOM сайта**
- не нужно ждать CMS, деплой или сборку

👉 Это сильно ускоряет верстку и снижает количество интеграционных багов.

---

## Общая идея

- **`src/order.json`** — единый источник порядка блоков
- каждый блок описывается одним ключом (`hero`, `welcome`, `test`)
- блок может состоять из:
    - разметки (`markup`)
    - стилей (`styles`)
    - скриптов (`scripts`)
- отсутствие стилей или скриптов — **нормальное и ожидаемое состояние**

---

## Структура проекта

```txt
src/
  order.json

  markup/
    hero.html
    welcome.html

  styles/
    hero.scss
    welcome.css

  scripts/
    hero.js
    welcome.js

  lib/
    gen-markup-index.mjs
    gen-styles-index.mjs
    gen-scripts-index.mjs
    build-cms.mjs
    rewriteAssetsBuild.mjs


public/
  hero-bg.jpg
  banner.png
  promo.webp

@CMS/
  hero.html
  welcome.html
```

---

## order.json

`src/order.json` определяет **порядок блоков**:

```json
{
  "blocks": [
    "hero",
    "welcome",
    "test"
  ]
}
```

⚠️ Указываются **только ключи**, без расширений.

По ключу автоматически ищутся файлы:

- `markup/<key>.html`
- `styles/<key>.scss` (приоритет)
- `styles/<key>.css`
- `scripts/<key>.js`

---

## Разметка (markup)

📁 `src/markup/<key>.html`

- обычный HTML
- **без оберток**
- **без служебных атрибутов**
- вставляется в CMS **как есть**

Пример:

```html

<section class="hero" id="test">
    <h1>Заголовок</h1>
</section>
```

Если файла нет — блок пропускается.

### Вложенные части через `<include>`

Для больших секций можно держать один корневой блок и собирать его из частей.

Пример для блока `kapsula`:

```html
<section class="kapsula">
  <include src="./kapsula/hero.html"></include>
  <include src="./kapsula/content.html"></include>
</section>
```

- `src` считается относительно текущего HTML-файла
- поддерживаются вложенные include-файлы
- include разворачивается через `posthtml` + `posthtml-include`
- один и тот же posthtml-пайплайн используется и в dev-генерации, и в CMS build

---

## Стили (styles)

📁 `src/styles/<key>.scss | <key>.css`

- поддерживается **SCSS**
- можно использовать `@use`, импорты, вложенность
- сборка выполняется через **Vite**
- при CMS-сборке:
    - стили минифицируются
    - инлайнятся в `<style>`
- если стили импортируются из JS — они тоже попадают в итоговый HTML


---

## Скрипты (scripts)

📁 `src/scripts/<key>.js`

### Контракт (ОБЯЗАТЕЛЬНО)

Каждый скрипт **обязан экспортировать `default`-функцию**.

```js
export default function init() {
  const host = document.querySelector("#test");
  if (!host) return;

  const el = document.createElement("span");
  el.textContent = "Текст из скрипта";
  host.appendChild(el);
}
```

### Поведение

- **dev**:
    - разметка вставляется в DOM
    - затем вызывается `init()`

- **CMS build**:
    - JS инлайнится в `<script>`
    - `init()` вызывается автоматически

❌ НЕ нужно:

- IIFE
- `DOMContentLoaded`
- глобальные сайд-эффекты
- привязка к dev-окружению

---

## Vue внутри блоков

Поддержка **отключена**: `.vue`-файлов в проекте нет, а `@vitejs/plugin-vue`
тянул за собой Vue в зависимости и участвовал в каждой сборке впустую.

Если Vue снова понадобится — вернуть плагин в devDependencies и добавить
`vue()` в список плагинов `bundleJsInline` (`src/lib/build-cms.mjs`). Стили из
компонентов инлайнятся в HTML блока тем же механизмом, что и SCSS.

---

## Тесты

Юнит-тесты на **Vitest** лежат рядом с кодом (`*.test.js`).

```bash
npm test          # разовый прогон
npm run test:watch
```

Покрыта чистая логика, где ошибка не видна глазом и не падает в консоли:
нормализация значений формы, условная видимость опций, валидация, сопоставление
отелей из ответа API и сборка payload лида для менеджера.

DOM-рендер и анимации тестами не покрыты намеренно — их дешевле проверять
в браузере (см. `docs/VISUAL_AUDIT.md` и скилл `playwright-cli`).

---


## Работа с картинками

### Хранение

Все картинки кладутся **в корень папки `public/`**:

```txt
public/
  hero-bg.jpg
  banner.png
  promo.webp
```

### Использование

```html
<img src="/hero-bg.jpg" alt="">
```

```css
.hero {
    background-image: url("/hero-bg.jpg");
}
```

❌ не используем `localhost`  
❌ не используем `img/`, `assets` и другие префиксы

---

### SCSS миксин для фоновых картинок

Для фонов используем миксин `bg-cdn` из `src/styles/_mixins.scss`:

```scss
@use "./mixins" as *;

.hero {
  @include bg-cdn("/hero-bg.jpg");
}
```

Миксин генерирует две строки `background-image`:

- `url("/hero-bg.jpg")` — базовый путь (используется на build)
- `url(var(--cdn-prefix)/hero-bg.jpg)` — dev‑путь через локальный CDN

В dev переменная `--cdn-prefix` задаётся в `src/main.js` (сейчас это `http://127.0.0.1:5173`),  
поэтому фон берётся с dev‑сервера Vite.


В build переменная не задана, вторая строка становится невалидной и игнорируется,  
а первая переписывается на CDN через `rewriteAssetsBuild.mjs` (если задан `assetsPrefix`).

---

## Раздача картинок в dev

Ассеты раздаёт **сам dev-сервер Vite**: он отдаёт `public/` в корне и шлёт
`Access-Control-Allow-Origin: *`, поэтому картинки грузятся и на чужом домене,
куда Tampermonkey инжектит блок.

Раньше рядом жил отдельный express-сервер на порту 3001 (`npm run cdn`),
который делал ровно то же самое. Он удалён вместе с зависимостью — база
задаётся константой `CDN_BASE` в `src/main.js` и указывает на порт Vite.

Пути переписываются на лету:

```
/hero-bg.jpg → http://127.0.0.1:5173/hero-bg.jpg
```

Переписывание **строго ограничено контейнером верстки**,  
картинки всего сайта не затрагиваются.


---

## Dev-режим (Realtime)

```bash
npm run dev
```

Что происходит:

- генерируются index-файлы
- запускаются вотчеры разметки / стилей / скриптов
- запускается Vite + Tampermonkey (он же раздаёт картинки из `public/`)
- верстка отображается **прямо на сайте**

- изменения видны **мгновенно**

⚠️ `vite-plugin-monkey` работает **только в dev**  
и **никогда не участвует в CMS build**.

---

## CMS build

```bash
npm run build
```

Результат:

- создается папка `@CMS`
- каждый блок из `order.json` → отдельный HTML-файл

Формат:

```html

<style>
    /* минифицированный CSS */
</style>

<!-- HTML блока -->

<script>
    /* минифицированный JS */
</script>
```

Каждый файл полностью автономен и готов для CMS.

---

## Проверка перед билдом

```bash
npm run check
```

Проверяет, что `assetsPrefix` в `src/order.json` задан и не является плейсхолдером.

Запускается автоматически первым шагом `npm run build`. Без этого пустой
префикс просто пропускал rewrite: сборка завершалась успешно, а в CMS уезжали
корне-относительные пути вида `/hero-bg.jpg`, которые там не резолвятся.

### Поведение при ошибках

- Блоки собираются в память, и `@CMS` перезаписывается **только после того,
  как собрались все**. Падение на одном блоке больше не оставляет каталог
  пустым — предыдущий результат остаётся на месте.
- Если `scripts/<key>.js` экспортирует `default`, который не является функцией,
  блок соберётся, но в консоль браузера уйдёт явная ошибка. Раньше такой блок
  молча ничего не делал.


---

## Rewrite путей картинок под CMS

Если CMS требует другой путь для картинок, укажите префикс (относительно CDN базы):

CDN база зашита в скрипт:

```
https://b2ccdn.coral.ru/content
```

Префикс можно передать через CLI:

```bash
npm run build -- landing-pages/uae-segmentation
```

Или укажите префикс в `src/order.json`:

```json
{
  "assetsPrefix": "landing-pages/uae-segmentation",
  "blocks": ["hero", "welcome"]
}
```

Что происходит:

1. выполняется CMS build
2. пути к картинкам переписываются:

- из `/hero-bg.jpg`
- в `https://b2ccdn.coral.ru/content/landing-pages/uae-segmentation/hero-bg.jpg`

Если аргумент **не передан** и `assetsPrefix` пустой — rewrite пропускается.
`assetsPrefix` — это путь до папки, **без имени файла**.

### Что переписывается

- `<img src>`
- `<img srcset>`
- `<source srcset>`
- `poster`
- `url("/...")` внутри `<style>` и inline-стилей

Поддерживаемые расширения:

```
jpg / jpeg / png / webp
```

❌ скрипты, ссылки и шрифты не затрагиваются

---

## CLI для блоков

### Создание блока

```bash
npm run block:add hero
```

Создает:

- `markup/hero.html`
- `styles/hero.scss`
- `scripts/hero.js`
- добавляет `hero` в `order.json`

### Переименование блока

```bash
npm run block:rename hero intro
```

- переименовывает файлы
- обновляет `order.json`
- **ничего не удаляет**

---

## Что считается нормальным

✔ блок без стилей  
✔ блок без скриптов  
✔ блок только с HTML  
✔ ключ в `order.json` без файлов  
✔ defensive-логика в JS

---

## Что НЕ допускается

❌ расширения файлов в `order.json`  
❌ IIFE в `scripts/*.js`  
❌ `DOMContentLoaded`  
❌ dev-зависимости в CMS  
❌ служебные обертки в разметке

---

## Чеклист верстки блока

1. Добавить ключ в `src/order.json`
2. Создать файлы блока (или `block:add`)
3. Сверстать HTML
4. (опционально) добавить SCSS
5. (опционально) добавить JS с `export default`
6. Проверить в `npm run dev`
7. Проверить результат `npm run build`
