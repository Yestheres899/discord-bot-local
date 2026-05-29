@echo off
chcp 65001 >nul
title Bot Discord - IA Local

echo.
echo ============================================
echo   Iniciando Bot Discord com IA Local
echo ============================================
echo.

:: Verificar .env
if not exist ".env" (
    echo Arquivo .env nao encontrado.
    echo Execute setup.bat primeiro.
    pause
    exit /b 1
)

:: Carregar variaveis do .env
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" if not "%%A:~0,1%"=="#" (
        set "%%A=%%B"
    )
)

:: Verificar token
if "%DISCORD_TOKEN%"=="" (
    echo DISCORD_TOKEN nao definido no .env
    echo Abra o arquivo .env e cole seu token do Discord.
    pause
    exit /b 1
)
if "%DISCORD_TOKEN%"=="SEU_TOKEN_AQUI" (
    echo Voce precisa colocar seu token real no arquivo .env
    echo Abra .env e substitua SEU_TOKEN_AQUI pelo token do seu bot.
    pause
    exit /b 1
)

:: Iniciar Ollama em segundo plano
echo Iniciando Ollama em segundo plano...
start /min "Ollama" cmd /c "ollama serve"
timeout /t 3 /nobreak >nul

:: Verificar modelo
set MODEL=llama3.2
if not "%OLLAMA_MODEL%"=="" set MODEL=%OLLAMA_MODEL%

echo Verificando modelo %MODEL%...
ollama list | findstr /i "%MODEL%" >nul 2>&1
if %errorlevel% neq 0 (
    echo Baixando modelo %MODEL%... (pode demorar na primeira vez)
    ollama pull %MODEL%
)

echo.
echo Ollama rodando com modelo: %MODEL%
echo.

:: Iniciar bot
echo Iniciando bot Discord...
echo Para parar, feche esta janela ou pressione Ctrl+C
echo.
node bot.js

if %errorlevel% neq 0 (
    echo.
    echo Bot encerrado com erro.
    pause
)
