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
