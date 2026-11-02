# EAC Helper — Discord Bot

Локальный Discord-бот для Windows. Веб-панель и хостинг не требуются.

## Установка

1. Установи Node.js 22 LTS или новее и Git for Windows.
2. Склонируй репозиторий:
   ```bat
   git clone https://github.com/RustyLub/-EAC--Helper.git
   ```
3. Открой папку репозитория и запусти `Setup.bat`.
4. Заполни созданный файл `.env`.

## Переменные .env

- `DISCORD_TOKEN` — токен приложения из Discord Developer Portal → Bot.
- `CLIENT_ID` — Application ID из General Information.
- `GUILD_ID` — необязательно; ID тестового сервера для мгновенной регистрации команд. Без него команды публикуются глобально.
- `FIREBASE_PROJECT_ID` — ID проекта Firebase.
- `GOOGLE_APPLICATION_CREDENTIALS` — путь к JSON-ключу Firebase service account.

Создай проект Firebase, включи Cloud Firestore и выдай сервисному аккаунту права на Firestore. Для локального запуска укажи путь к JSON-ключу в `GOOGLE_APPLICATION_CREDENTIALS` (например, `C:\\EAC-Helper\\firebase-service-account.json`) либо вставь полный JSON одной строкой в `FIREBASE_SERVICE_ACCOUNT`. Без `FIREBASE_PROJECT_ID` и одного из вариантов учётных данных бот остановится при старте с понятной ошибкой. JSON-ключ не добавляй в Git. База использует коллекцию `guilds/{guildId}`; пользовательские XP и предупреждения хранятся в `guilds/{guildId}/users/{userId}`.

## Discord Developer Portal

Включи Gateway Intents:
- **Server Members Intent** — события входа и выхода участников.
- **Message Content Intent** — автомодерация, пользовательские команды и XP за сообщения.

Пригласи бота с OAuth2 scopes `bot` и `applications.commands`. Для работы функций выдай права: View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Moderate Members, Kick Members и Ban Members — только те, которые нужны включённым функциям.

## Команды бота

| Команда | Назначение |
|---|---|
| `/help` | Интерактивная справка |
| `/language` | Язык сервера ru/en |
| `/automod` | Антиспам, блокировка приглашений, капса и запрещённых слов |
| `/ban` | Бан участника |
| `/kick` | Кик участника |
| `/mute` | Тайм-аут или снятие тайм-аута |
| `/warn` | Предупреждение с записью в Firestore |
| `/clear` | Массовое удаление последних сообщений |
| `/news` | Публикация новости в текстовый канал |
| `/rank` | Уровень и XP участника |
| `/leaderboard` | Топ-10 по XP |

### Настройка автомодерации

Запусти `/automod` без параметров, чтобы посмотреть текущие настройки. Передай нужные параметры, чтобы изменить отдельные функции. В `bad_words` указывай слова через запятую; значение `CLEAR` очищает список. Все фильтры выключены по умолчанию, пока администратор их не включит.

Приветствия и сообщения об уходе включаются через документ Firestore `guilds/{guildId}`:
- `welcome: { enabled: true, channelId: "ID", message: "Привет, {user}! Добро пожаловать на {server}. Ты {membercount}-й участник." }`
- `leave: { enabled: true, channelId: "ID", message: "{user} покинул сервер {server}." }`

XP начисляется не чаще одного раза в минуту на пользователя за сервер. Уровень рассчитывается по формуле `floor(sqrt(xp / 100))`.

## Запуск и обновление

- Каждый раз запускай `Start.bat`.
- Для обновления без повторного скачивания ZIP запусти `Update.bat`.
- Проверка типов: `npm run lint`.
- `npm run build` выполняет проверку TypeScript с `--noEmit`: JavaScript-файлы не генерируются. Отдельной папки `dist`/`build` и пути к собранному JS-файлу у бота нет; фактическая точка запуска — `src/bot/main.ts`.

Окно консоли должно оставаться открытым, пока бот работает.

## Безопасность

Не отправляй Discord token и Firebase service-account JSON в чаты и не коммить их в Git. `.env` и JSON-ключи сервисных аккаунтов исключены из Git.
