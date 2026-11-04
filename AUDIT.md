# EAC Helper — технический аудит

Обновлено: 2026-11-04
Рабочая ветка: `feature/components-v2-dashboard`

## Архитектура

- React + Vite frontend.
- Express API и Discord Gateway запускаются в одном Node.js процессе.
- Discord OAuth2 используется для входа в веб-панель.
- Состояние серверов хранится в Map в оперативной памяти процесса.
- Firebase, Firestore и файловое хранилище настроек не используются.
- Перезапуск или redeploy очищает язык, automod, приветствия, пользовательские команды, XP и переключатели модулей.

## Исправленные проблемы в текущей ветке

- Production start теперь запускает `server.ts`, а не только Discord-бота.
- Production build теперь выполняет TypeScript-проверку backend и Vite build frontend в `dist/`.
- Render build больше не использует `npm ci`, так как в репозитории нет package-lock.json.
- Веб-панель и API обслуживаются с одного origin; API URL больше не зашит на старый Render hostname.
- OAuth cookie использует Secure в production и SameSite=Lax для same-origin сценария.
- Firebase variables и зависимости удалены из deployment-конфигурации, шаблона локальной настройки и package.json.
- Последнее оставшееся Firestore-хранилище предупреждений заменено ограниченным in-memory списком; добавлена команда `/warnings`.
- Переключатели веб-панели теперь меняют общую RuntimeGuild state и реально влияют на модерацию, автомодерацию, приветствия, XP, пользовательские команды и объявления.
- Нереализованные карточки action-log и tickets удалены из списка доступных модулей.
- Изменение нескольких настроек валидируется до записи, а API возвращает полный эффективный набор флагов.
- Discord Components V2 сохраняет интерактивную навигацию и обновляет исходное сообщение.

## Остаточные риски и ограничения

- Данные намеренно не переживают перезапуск. На Render free возможны остановки/перезапуски процесса, после которых настройки и XP сбрасываются.
- Для автоматического XP требуется включённый Message Content Intent в Discord Developer Portal.
- Для приветствий и сообщений об уходе требуется Server Members Intent.
- Настройки automod, уровней, приветствий/ухода, пользовательских команд и канала оповещений доступны в веб-панели; для тех же основных настроек остаются slash-команды `/automod`, `/greetings` и `/customcommand`.
- GitHub Actions проверяет TypeScript Discord-бота, Express-сервер и frontend, собирает Vite и запускает тесты runtime, валидации настроек, шаблонов и переключателей модулей на Ubuntu и Windows.
- Реальный Discord OAuth2, Discord Gateway, права бота и доступность каналов нельзя полностью проверить без секретов владельца и тестового Discord-сервера.
- Production deployment на Render требует заполнения секретов владельцем приложения и проверки callback URL.

## Обязательные настройки владельца

1. В Render задать `DISCORD_TOKEN`, `CLIENT_ID`, `CLIENT_SECRET` и `APP_URL`.
2. В Discord OAuth2 Redirects добавить `<APP_URL>/auth/callback`.
3. Включить Server Members Intent и Message Content Intent.
4. Пригласить бота с scopes `bot` и `applications.commands` и необходимыми permission flags.


## Дополнительная проверка переключателей модулей (2026-11-04)
- Slash-команды `/ban`, `/kick`, `/mute`, `/warn`, `/warnings`, `/clear` учитывают переключатель «Модерация».
- `/rank` и `/leaderboard` учитывают переключатель «Уровни»; `/news` учитывает переключатель «Оповещения».
- Необработанные Promise-ошибки не подавляются: они приводят к штатному завершению процесса, а `uncaughtExceptionMonitor` только записывает причину в лог.
- Добавлен отдельный тест поведения переключателей модулей.
