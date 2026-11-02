@echo off
chcp 65001 >nul
cd /d "%~dp0"
title EAC Helper - Discord Bot
if not exist ".env" (
  echo [ОШИБКА] Не найден файл .env
  echo Сначала запусти Setup.bat и заполни настройки.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Зависимости не установлены. Запусти Setup.bat.
  pause
  exit /b 1
)
echo Запускаю EAC Helper...
call npm run bot
if errorlevel 1 (
  echo.
  echo Бот завершил работу с ошибкой. Проверь сообщения выше.
  pause
)
