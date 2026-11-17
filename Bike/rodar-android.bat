@echo off
setlocal
set SDK=%LOCALAPPDATA%\Android\Sdk
set ADB=%SDK%\platform-tools\adb.exe
set EMU=%SDK%\emulator\emulator.exe

echo === Limpando caches com o caminho antigo do projeto ===
cd /d C:\hackaton\Bike\android
call gradlew.bat --stop
cd /d C:\hackaton\Bike
for %%D in (android\.gradle android\build android\app\build android\app\.cxx android\.kotlin node_modules\.cache) do (
  if exist "%%D" (
    echo Apagando %%D
    rmdir /s /q "%%D"
  )
)
echo.

echo === Verificando aceleracao de hardware ===
"%EMU%" -accel-check
echo.

echo === Verificando se ja existe um emulador rodando ===
"%ADB%" devices | findstr /R "emulator-[0-9]*.*device$" >nul
if %errorlevel%==0 (
  echo Emulador ja esta rodando.
  goto build
)

echo === Iniciando o emulador Medium_Phone (cold boot) ===
start "Emulador Medium_Phone" "%EMU%" -avd Medium_Phone -no-snapshot-load

echo Aguardando o emulador aparecer no adb...
"%ADB%" wait-for-device

echo Aguardando o Android terminar de inicializar (pode levar alguns minutos)...
:waitboot
for /f "delims=" %%i in ('"%ADB%" shell getprop sys.boot_completed 2^>nul') do set BOOT=%%i
if "%BOOT%"=="1" goto booted
timeout /t 5 /nobreak >nul
goto waitboot

:booted
echo Emulador pronto!

:build
echo.
echo === Rodando npx expo run:android ===
cd /d C:\hackaton\Bike
call npx expo run:android

echo.
pause
