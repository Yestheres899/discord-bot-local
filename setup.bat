@echo off
chcp 65001 >nul
title Setup - Bot Discord com IA Local

echo.
echo ============================================
echo   Setup: Bot Discord com IA Local (Ollama)
echo ============================================
echo.

:: --- Verificar Node.js ---
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js nao encontrado. Abrindo pagina de download...
    start https://nodejs.org/en/download
    echo.
    echo Instale o Node.js LTS, reinicie este arquivo depois.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo Node.js encontrado: %%i
)

:: --- Verificar Ollama ---
echo.
echo [2/4] Verificando Ollama...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama nao encontrado. Abrindo pagina de download...
    start https://ollama.com/download
    echo.
    echo Instale o Ollama, reinicie este arquivo depois.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('ollama --version') do echo Ollama encontrado: %%i
)

:: --- Arquivo .env ---
echo.
echo [3/4] Configurando .env...
if not exist ".env" (
    copy .env.example .env >nul
    echo Arquivo .env criado a partir do exemplo.
    echo.
    echo IMPORTANTE: Abra o arquivo .env e coloque seu DISCORD_TOKEN.
    echo Encontre seu token em: https://discord.com/developers/applications
    echo.
    start notepad .env
    pause
) else (
    echo Arquivo .env ja existe.
)

:: --- Instalar dependencias ---
echo.
echo [4/4] Instalando dependencias npm...
npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Setup concluido!
echo   Execute start.bat para iniciar o bot.
echo ============================================
echo.
pause
