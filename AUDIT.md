# EAC Helper — технический аудит

Дата аудита: 2026-11-02

## Краткий вывод

Проект собирает React/Vite frontend и Express/Discord backend в одном Node.js сервисе. GitHub Pages может раздавать только статический frontend и не может запускать Express API или Discord gateway-клиент. Текущая схема с frontend на GitHub Pages и API на другом домене также зависит от доступности third-party cookies в браузере.

## Обнаруженные проблемы

### Развёртывание и сеть
- GitHub Pages получает публикации из двух workflow: собственного Vite workflow и автоматического workflow публикации из branch source. Источник GitHub Pages необходимо переключить на GitHub Actions в Settings → Pages.
- Frontend использует Render API URL по умолчанию. Успешная сборка Pages не подтверждает, что Render-сервис создан, доступен и настроен.
- OAuth cookie выставляется как cross-site cookie (SameSite=None; Secure). Браузеры с блокировкой сторонних cookies могут не отправлять её при запросах с GitHub Pages на Render. Надёжный вариант — отдавать frontend и API с одного Render origin.
- Render Blueprint требует секреты Discord и Firebase. Наличие render.yaml само по себе не создаёт и не конфигурирует сервис.

### Discord bot
- Не был включён GuildMembers Gateway Intent, хотя проект подписан на события входа и выхода участников. Исправлено в src/bot/index.ts.
- Discord REST-клиент для публикации slash-команд создавался при импорте модуля. Исправлено: клиент создаётся после проверки токенов.
- Ошибка публикации slash-команд не должна останавливать подключение самого бота. Исправлено: регистрация и login разделены.
- Обработчики ban/kick/mute искали участника только в cache. Это давало ложное «пользователь не найден», если участника не было в кеше. Исправлено: участник запрашивается через Discord API.
- Для mute добавлены допустимые границы длительности: 0–40320 минут (до 28 дней).
- messageCreate.ts содержит @ts-nocheck; требуется отдельная типизация и тесты автомодерации.
- Welcome/leave handlers зависят от Firestore и кеша каналов; требуется проверить наличие канала, права бота и поведение при недоступности Firebase.

### Firebase и согласованность настроек
- Веб-панель сохраняет модульные флаги в guildSettings/{guildId}.
- Обработчики бота читают язык, automod, welcome/leave, custom commands и XP из guilds/{guildId}.
- Следовательно, переключатели веб-панели сейчас не включают реальные функции бота. Нужно свести настройки к одной схеме Firestore и подключить каждый модуль к ней.
- Firebase Admin использует service-account JSON в FIREBASE_SERVICE_ACCOUNT; формат и права сервисного аккаунта должны быть проверены на реальном Render deployment.

### Веб-панель и UX
- Список модулей содержит статусы «В разработке»; их нельзя считать реализованными функциями.
- API сетевые ошибки ранее показывались как общая ошибка fetch. Добавлена диагностика с API URL и origin frontend.
- Требуется добавить API health indicator, обработку истечения OAuth access token, повторную авторизацию и end-to-end тесты входа.

### Команды и поддержка
- Кнопка поддержки в help-меню ведёт на общий Discord invite, а не на сервер поддержки проекта.
- Bug report сейчас отвечает заглушкой; нужно заменить реальным URL создания issue или реализовать форму.
- Требуется проверить права и обработку ошибок для всех slash-команд, включая права бота на целевом канале.

## Уже внесённые исправления в main
- Безопасная инициализация Discord REST-клиента при наличии токенов.
- Добавлен GuildMembers intent.
- Ошибка регистрации slash-команд больше не должна мешать login бота.
- ban/kick/mute загружают участника через Discord API.
- Ограничена длительность mute.
- Frontend показывает более подробную диагностику сетевых ошибок и HTTP-ответов.

## Обязательные внешние действия
1. В GitHub Settings → Pages установить Source = GitHub Actions.
2. Создать Render Blueprint из render.yaml и заполнить секреты.
3. Настроить Discord OAuth Redirect URI как https://<render-domain>/auth/callback.
4. Включить Discord Server Members Intent и Message Content Intent в Developer Portal.
5. Проверить, что frontend и API используют один origin, чтобы не зависеть от third-party cookies.
6. Проверить Firebase service account и Firestore доступ.

## Проверки
GitHub Actions автоматически выполняет npm ci, npm run build и npm run lint. Результаты последних запусков следует считать окончательными только после завершения workflow. Реальный OAuth, Discord gateway и Firestore требуют интеграционного теста на развёрнутом сервисе.
