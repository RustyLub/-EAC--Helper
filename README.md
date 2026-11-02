# EAC Helper — Discord Bot Moderation

EAC Helper — Discord-бот и веб-панель управления модерацией Discord-серверов.

## Запуск локально

Требуется Node.js 22 или новее.

```bash
npm ci
cp .env.example .env
# Заполни .env значениями из Discord Developer Portal и Firebase
npm run dev
```

Панель будет доступна по адресу `http://localhost:3000`.

## Развёртывание

Это **полноценное Node.js-приложение**, а не статический сайт. GitHub Pages не поддерживает Express API, Discord OAuth callback и постоянно работающего Discord-бота. Поэтому публикация только через GitHub Pages приводит к неработающей панели.

В репозитории есть `render.yaml` для Render Blueprint:
1. Открой Render и создай новый Blueprint из репозитория `RustyLub/-EAC--Helper`.
2. После создания сервиса добавь секреты окружения: `APP_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `DISCORD_TOKEN`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT`.
3. В Discord Developer Portal укажи OAuth2 Redirect URL: `https://<твой-домен-сервиса>/auth/callback`.
4. Включи нужные Gateway Intents у Discord-бота: Server Members Intent и Message Content Intent.
5. После успешного деплоя открой домен Render. Проверка сервера: `/api/health`.

Firebase service account передаётся в `FIREBASE_SERVICE_ACCOUNT` как полный JSON одной строкой. Не публикуй этот JSON в GitHub.

## Проверки

```bash
npm run build
npm run lint
```
