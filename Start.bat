@echo off
chcp 65001 >nul
cd /d "%~dp0"
title EAC Helper - Web Panel and Discord Bot
where node >nul 2>nul
if errorlevel 1 (
  echo [ОШИБКА] Node.js не найден. Установи Node.js 22 LTS или новее.
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo [ОШИБКА] Требуется Node.js 22 или новее.
  pause
  exit /b 1
)
if not exist ".env" (
  echo [ОШИБКА] Не найден файл .env
  echo Сначала запусти Setup.bat и заполни настройки.
  pause
  exit /b 1
)
if not exist "node_modules\tsx\dist\cli.mjs" (
  echo [ОШИБКА] Зависимости не установлены или повреждены.
  echo Запусти Setup.bat.
  pause
  exit /b 1
)
echo Проверяю TypeScript перед запуском...
call npm run build
if errorlevel 1 (
  echo.
  echo [ОШИБКА] Проверка проекта не пройдена. Исправь ошибки выше.
  pause
  exit /b 1
)
echo.
echo Запускаю веб-панель, API и Discord-бота...
call npm start
if errorlevel 1 (
  echo.
  echo Бот завершил работу с ошибкой. Проверь сообщения выше.
  pause
  exit /b 1
)
echo.
echo Процесс бота завершён.
pause
