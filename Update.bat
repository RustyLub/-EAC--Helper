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
echo Перед обновлением останови запущенный бот (Ctrl+C в его окне).
echo Получаю обновления...
git pull --ff-only
if errorlevel 1 (
  echo Не удалось обновить файлы. Проверь подключение и локальные изменения.
  pause
  exit /b 1
)
echo Обновляю зависимости...
call npm install
if errorlevel 1 (
  echo Ошибка установки зависимостей.
  pause
  exit /b 1
)
echo.
echo Обновление завершено. Файл .env сохранён.
echo Временные настройки и XP в памяти сбрасываются после перезапуска.
echo Теперь запусти Start.bat.
pause
