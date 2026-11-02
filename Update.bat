@echo off
chcp 65001 >nul
cd /d "%~dp0"
title EAC Helper - Update
where git >nul 2>nul
if errorlevel 1 (
  echo Git не найден. Установи Git for Windows: https://git-scm.com/download/win
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установи Node.js 22 LTS или новее: https://nodejs.org/
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo Требуется Node.js 22 или новее. Обнови Node.js и повтори запуск.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm не найден. Переустанови Node.js с npm.
  pause
  exit /b 1
)
echo Получаю обновления...
git pull --ff-only
if errorlevel 1 (
  echo Не удалось обновить файлы. Проверь подключение и локальные изменения.
  pause
  exit /b 1
)
echo Обновляю зависимости...
call npm ci
if errorlevel 1 (
  echo Ошибка установки зависимостей.
  pause
  exit /b 1
)
echo.
echo Обновление завершено. Твой .env и настройки не затронуты.
pause
