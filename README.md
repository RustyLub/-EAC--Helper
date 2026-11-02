# EAC Helper — Discord Bot

Локальный Discord-бот для Windows 10/11. Для запуска нужны Discord-приложение и проект Firebase с Cloud Firestore.

## Быстрый запуск — 8 шагов

1. **Установи Node.js 22 LTS или новее** с https://nodejs.org/ и Git for Windows с https://git-scm.com/download/win.
2. **Скачай проект** командой `git clone https://github.com/RustyLub/-EAC--Helper.git`, затем открой папку `-EAC--Helper`.
3. **Создай Discord-приложение** на https://discord.com/developers/applications. В разделе Bot создай бота и скопируй токен; в General Information скопируй Application ID. В Bot → Privileged Gateway Intents включи Server Members Intent и Message Content Intent.
4. **Пригласи бота на сервер** через OAuth2 → URL Generator: scopes `bot` и `applications.commands`. Выдай необходимые права: View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Moderate Members, Kick Members, Ban Members. Для модерации роль бота должна быть выше ролей участников.
5. **Создай Firebase-проект** на https://console.firebase.google.com/, включи Cloud Firestore (Native mode), создай сервисный аккаунт и скачай его JSON-ключ. Выдай аккаунту доступ к Firestore (например, роль Cloud Datastore User).
6. **Запусти `Setup.bat`**. Скрипт проверит Node.js 22+, установит зависимости через `npm ci`, создаст `.env` и откроет его в Блокноте.
7. **Заполни и сохрани `.env`**: `DISCORD_TOKEN`, `CLIENT_ID`, `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`. В последней переменной укажи путь к JSON-ключу, например `C:/EAC-Helper/firebase-service-account.json`. Можно вместо этого вставить JSON целиком в `FIREBASE_SERVICE_ACCOUNT`. `GUILD_ID` необязателен, но рекомендуется для мгновенной регистрации команд на тестовом сервере. Не публикуй токен и JSON-ключ.
8. **Запусти `Start.bat`**. Он проверит настройки и TypeScript, зарегистрирует slash-команды и подключится к Discord. Успех: в консоли появится сообщение о входе бота, в Discord бот будет онлайн, а команды `/help`, `/rank`, `/ban` появятся на сервере.

## Настройки .env

- `DISCORD_TOKEN` — токен бота из Discord Developer Portal → Bot.
- `CLIENT_ID` — Application ID из General Information.
- `GUILD_ID` — необязательно; ID тестового сервера. Если пусто, команды публикуются глобально и могут появиться не сразу.
- `FIREBASE_PROJECT_ID` — Project ID Firebase.
- `GOOGLE_APPLICATION_CREDENTIALS` — путь к JSON-ключу сервисного аккаунта.
- `FIREBASE_SERVICE_ACCOUNT` — альтернативный вариант: весь JSON сервисного аккаунта одной строкой.

Firebase credentials проверяются при старте. Если проект или ключ не заданы, файл отсутствует или JSON повреждён, бот завершится с понятной ошибкой. Храни ключ вне Git.

## Команды

`/help`, `/language`, `/automod`, `/ban`, `/kick`, `/mute`, `/warn`, `/clear`, `/news`, `/rank`, `/leaderboard`, `/greetings`, `/customcommand`.

Slash-команды регистрируются автоматически при запуске. Если задан `GUILD_ID`, регистрация выполняется для этого сервера; иначе глобально.

## Проверки и обновления

- `npm run build` и `npm run lint` проверяют TypeScript с `--noEmit`; отдельный JS build output не создаётся. Бот запускается из `src/bot/main.ts` через `tsx`.
- Для обновления клонированного репозитория запусти `Update.bat`. Он выполняет `git pull --ff-only` и `npm ci`, не меняя `.env`.
- BAT-файлы переходят в собственную папку и используют кавычки для путей с пробелами. При ошибке показывают сообщение и ждут нажатия клавиши.

## Безопасность

Не отправляй Discord token и Firebase service-account JSON в чат и не добавляй их в Git. `.env` и JSON-ключи сервисных аккаунтов исключены из Git.
