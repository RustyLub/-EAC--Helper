# EAC Helper — Discord Bot for Windows

Запускаемая на Windows версия Discord-бота. Для работы бота не нужны веб-панель, GitHub Pages или Render.

## Один раз подготовить компьютер

Установи:
- Node.js 22 LTS или новее: https://nodejs.org/
- Git for Windows: https://git-scm.com/download/win

Открой командную строку в папке, где хочешь хранить бота, и выполни один раз:

```bat
git clone https://github.com/RustyLub/-EAC--Helper.git
```

Открой созданную папку `-EAC--Helper` и запусти `Setup.bat`.

## Настройка

В файле `.env` укажи:
- `DISCORD_TOKEN` — токен бота из Discord Developer Portal → Bot.
- `CLIENT_ID` — Application ID из General Information.
- `GUILD_ID` — необязательно, ID тестового сервера для быстрой регистрации slash-команд.
- Firebase — нужен текущим функциям XP, уровней, языка, автомодерации, приветствий и прощаний. Создай Firebase project, включи Firestore и укажи путь к JSON-ключу сервисного аккаунта в `GOOGLE_APPLICATION_CREDENTIALS`.

В Discord Developer Portal включи **Server Members Intent** и **Message Content Intent**. Пригласи бота на сервер со scope `bot` и `applications.commands`, выдай необходимые права.

## Запуск

Каждый раз просто запускай `Start.bat`. Окно консоли должно оставаться открытым, пока бот работает.

## Обновление без повторного скачивания

Когда появится новая версия, запусти `Update.bat`. Он выполнит `git pull` и обновит зависимости. Полный архив повторно скачивать не нужно; твой `.env` остаётся на месте.

## Ручные команды

- `npm run bot` — запуск.
- `npm run lint` — проверка TypeScript.

## Безопасность

Не отправляй токен Discord и JSON-ключ Firebase другим людям. Не загружай их в GitHub. Файл `.env` уже исключён из Git.
