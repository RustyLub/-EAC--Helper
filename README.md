# EAC Helper — Discord Bot + Web Dashboard

EAC Helper — Discord-бот и веб-панель управления. Backend, Discord Gateway и React/Vite frontend запускаются в одном Node.js процессе. **Firebase, Firestore и файловое хранилище настроек не используются.** Состояние серверов, XP и переключатели модулей хранятся только в оперативной памяти и сбрасываются после перезапуска процесса.

## Требования

- Windows 10/11 (или Linux/macOS для запуска через Node.js).
- Node.js 22 или новее.
- Discord Application с Bot и OAuth2 credentials.

## Быстрый запуск на Windows

1. Установи Node.js 22+ с https://nodejs.org/ и Git for Windows с https://git-scm.com/download/win.
2. Склонируй репозиторий:
   `git clone https://github.com/RustyLub/-EAC--Helper.git`
3. Открой папку `-EAC--Helper` и запусти `Setup.bat`. Он установит зависимости, создаст `.env` из шаблона и откроет его в Блокноте.
4. Создай приложение на https://discord.com/developers/applications:
   - **Bot** → создай бота и скопируй Bot Token.
   - **General Information** → скопируй Application ID.
   - **OAuth2** → скопируй Client Secret.
   - **Bot → Privileged Gateway Intents** → включи Server Members Intent и Message Content Intent.
5. Заполни `.env`:
   - `DISCORD_TOKEN` — токен бота.
   - `CLIENT_ID` — Application ID.
   - `CLIENT_SECRET` — OAuth2 Client Secret.
   - `APP_URL=http://localhost:3000` — локальный адрес приложения.
   - `GUILD_ID` — необязательно, ID тестового Discord-сервера для быстрой регистрации slash-команд.
6. В Discord Developer Portal → OAuth2 добавь Redirect URI: `http://localhost:3000/auth/callback`.
7. Пригласи бота на сервер через OAuth2 URL Generator со scopes `bot` и `applications.commands`. Выдай права View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Moderate Members, Kick Members и Ban Members. Роль бота должна быть выше ролей участников, которых он модерирует.
8. Запусти `Start.bat`. Открой http://localhost:3000 — там будет веб-панель. В той же консоли работают API и Discord-бот.

## Команды Discord

- `/help` — справка с интерактивной навигацией.
- `/menu`, `/settings` — панель Discord Components V2, которая обновляет то же сообщение.
- `/language` — язык сервера (ru/en).
- `/automod` — антиспам, блокировка приглашений, капса и запрещённых слов.
- `/greetings` — приветствия и сообщения об уходе.
- `/customcommand` — создание, удаление и просмотр пользовательских команд `!name`.
- `/rank`, `/leaderboard` — XP, уровни и таблица лидеров.
- `/ban`, `/kick`, `/mute`, `/warn`, `/warnings`, `/clear` — модерация и просмотр/очистка предупреждений.
- `/news` — публикация объявления.

Предупреждения хранятся в памяти процесса (до 100 на пользователя) и доступны через `/warnings`; после перезапуска они сбрасываются.

Slash-команды регистрируются автоматически при запуске. Если указан `GUILD_ID`, команды регистрируются на тестовом сервере; иначе — глобально.

## Веб-панель и модули

Вход выполняется через Discord OAuth2. Пользователь видит серверы, на которых у него есть право Administrator или Manage Server. Настройки доступны только после повторной проверки прав на сервер.

Переключатели веб-панели связаны с логикой бота:
- **Модерация** — включает/отключает slash-команды ban, kick, mute, warn, warnings и clear.
- **Автомодерация** — разрешает/приостанавливает активные фильтры; сами фильтры настраиваются через `/automod`.
- **Приветствия** — включает/отключает welcome/leave; канал и текст задаются через `/greetings`.
- **Уровни** — включает/отключает начисление XP.
- **Пользовательские команды** — включает/отключает ответы на `!name`.
- **Оповещения** — включает/отключает команду `/news`.

Модули включены по умолчанию. Изменения веб-панели действуют до перезапуска процесса.

## Конфигурация .env

```dotenv
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_APPLICATION_ID
CLIENT_SECRET=YOUR_DISCORD_OAUTH_CLIENT_SECRET
APP_URL=http://localhost:3000
GUILD_ID=
```

В production укажи `APP_URL` как публичный HTTPS-адрес Render-сервиса, например `https://your-service.onrender.com`, и добавь соответствующий Redirect URI в Discord OAuth2. Не публикуй `.env`, Bot Token или Client Secret.

## Сборка и запуск вручную

```bash
npm install
npm run build
npm start
```

- `npm run build:bot` — проверка TypeScript Discord-бота и Express-сервера.
- `npm run typecheck:web` — проверка TypeScript веб-панели и конфигурации Vite.
- `npm run build:web` — проверка frontend и сборка React/Vite в `dist/`.
- `npm run build` — обе проверки/сборки.
- `npm run lint` — повторная проверка TypeScript backend и Express-сервера.
- `npm run bot` — запуск только Discord-бота без Express API и веб-панели.
- `npm start` — запуск полного сервиса (веб-панель + API + Discord-бот).

## Развёртывание на Render

1. Создай Web Service из этого репозитория или используй Blueprint `render.yaml`.
2. Установи секреты окружения: `DISCORD_TOKEN`, `CLIENT_ID`, `CLIENT_SECRET`, `APP_URL`.
3. В `APP_URL` укажи публичный HTTPS URL этого Render-сервиса.
4. В Discord OAuth2 Redirects добавь `https://your-service.onrender.com/auth/callback`.
5. Убедись, что Discord Bot Intents включают Server Members и Message Content.

Render собирает frontend и backend вместе и отдаёт панель и API с одного origin. Это устраняет зависимость OAuth-сессии от third-party cookies. GitHub Pages для этой схемы не нужен: он может раздавать только статический frontend, но не Express API и Discord Gateway.

## Хранение данных

Firebase, Firestore, JSON-файлы и другие постоянные хранилища данных не используются. Язык, параметры автомодерации, приветствия, пользовательские команды, предупреждения, XP, уровни и переключатели веб-панели существуют только в памяти работающего процесса. После рестарта или redeploy данные сбрасываются. Это намеренное поведение текущей версии.

## Безопасность

- Не добавляй `.env`, токены и секреты в Git.
- API проверяет Discord OAuth-сессию и право управления сервером перед чтением/изменением настроек.
- OAuth state проверяется при callback.
- Не отправляй Bot Token или Client Secret в чат, issue или логи.
