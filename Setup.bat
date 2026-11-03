@echo off
chcp 65001 >nul
cd /d "%~dp0"
title EAC Helper - Setup
echo ========================================
echo        EAC HELPER - УСТАНОВКА
echo ========================================
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
echo.
echo Устанавливаю зависимости...
call npm install
if errorlevel 1 (
  echo Не удалось установить зависимости.
  pause
  exit /b 1
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  if errorlevel 1 (
    echo Не удалось создать .env из .env.example.
    pause
    exit /b 1
  )
  echo Создан файл .env из шаблона.
) else (
  echo Файл .env уже существует, он не изменён.
)
echo.
echo Установка завершена.
echo Сейчас откроется .env. Заполни настройки Discord OAuth и адрес приложения.
start "" notepad.exe ".env"
echo После сохранения запусти Start.bat.
pause
