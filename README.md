# Портфолио — Эльдар Рагимов

Лендинг-портфолио FullStack-разработчика с рабочей формой обратной связи и AI-интеграцией.

## Стек

| Слой     | Технологии                                                  |
|----------|-------------------------------------------------------------|
| Frontend | HTML5, SCSS (скомпилированный в CSS), Vanilla TypeScript/JS |
| Backend  | Node.js + Express                                           |
| Email    | Nodemailer (SMTP)                                           |
| AI       | OpenRouter API openrouter/free                              |

---

## Запуск проекта

### 1. Клонировать и установить зависимости

```bash
git clone 
cd portfolio-dev
npm install
```

### 2. Настроить переменные окружения

Заполнить `.env`:

```env
PORT=5656
OWNER_EMAIL=your@email.com

# Gmail — нужен Пароли приложений (не пароль аккаунта)
# Включить 2FA -> Безопасность -> Пароли приложений
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx

# OpenRouter: https://openrouter.ai/
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### 3. Собрать CSS и JS

```bash
npm run build
```

### 4. Запустить сервер

```bash
npm start
```

Сайт доступен на **http://localhost:5656**

---

## Структура проекта

```
portfolio-dev/
├── backend/server.ts
│
├── dist/
│   ├──backend/server.js
│   └──frontend/main.js
│
├── frontend/
│   ├── scss/main.scss
│   └── js/main.ts 
│
├── public/
│   ├── index.html
│   └── css/main.css/main.css.map
│
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

---

## Как работает форма

**Клиент:**
- Валидация полей в реальном времени (blur + input)
- Loading / success / error состояния кнопки
- Запрос `POST /api/contact` с JSON-телом

**Сервер (`/api/contact`):**
1. Валидирует входные данные (имя, телефон, email)
2. Параллельно отправляет два письма через SMTP:
   - Владельцу — форматированное HTML с данными заявки
   - Пользователю — подтверждение с его комментарием
3. Возвращает `{ ok: true }` или `{ message: "ошибка" }` с нужным HTTP-кодом

---

## AI-интеграция

**OpenRouter** — используется бесплатная модель `openrouter/free`.

Кнопка «Помочь составить сообщение с ИИ»:
- Берёт имя пользователя и черновик комментария (если есть)
- Отправляет `POST /api/ai-helper`
- Сервер вызывает `openrouter/free` — быстрая и бесплатная модель для коротких задач
- Результат возвращается в UI с возможностью вставить в поле

**Почему openrouter/free:** задача простая (2-3 предложения), и бесплатно.

---

## Что использовалось с ИИ

- **Gemini** — сбор технической информации, написание README.md
- **Claude** — базовая архитектура бэкенда (Express), проектирование дизайн-системы в SCSS,
      визуальная концепция сайта, генерация сложной логики (валидатор форм, обработка payloads)
- **Ручные правки:** — Исправление путей: отладил __dirname, PUBLIC_PATH,
      Типизация TS: проставил дженерики, поправил интерфейсы запросов/ответов,
      Логика форм: добавил валидацию blur/input, обработку ошибок без перезагрузки,
      Адаптив: дописал @media-запросы, поправил z-index, flex-wrap, sticky,
      Маршруты Express: выстроил порядок middleware, чтобы статику не перехватывал catch-all,
      Сборка: настроил esbuild/sass флаги, исправил пути в package.json скриптах,
      Баги: поправил -webkit- префиксы, IntersectionObserver пороги, overflow у мобильного меню"# Portfolio" 
