@echo off
REM Blender Character Renderer - Windows Helper

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Blender Character Renderer
echo ========================================
echo.

REM Check common installation paths
set BLENDER_EXE=
if exist "C:\Program Files\Blender Foundation" (
    for /d %%D in ("C:\Program Files\Blender Foundation\Blender*") do (
        if exist "%%D\blender.exe" (
            set "BLENDER_EXE=%%D\blender.exe"
        )
    )
)

if exist "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe" (
    set "BLENDER_EXE=C:\Program Files\Blender Foundation\Blender 4.1\blender.exe"
) else if exist "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe" (
    set "BLENDER_EXE=C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"
) else if exist "C:\Program Files (x86)\Blender Foundation\Blender 4.1\blender.exe" (
    set "BLENDER_EXE=C:\Program Files (x86)\Blender Foundation\Blender 4.1\blender.exe"
)

if not defined BLENDER_EXE (
    echo [ERROR] Blender is not installed!
    echo.
    echo Please download and install Blender 4.0+ from:
    echo   https://www.blender.org/download/
    echo.
    echo After installation, restart command prompt and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Found Blender:
echo   !BLENDER_EXE!
echo.

if "%1"=="" (
    echo Usage: render.bat [script.py]
    echo Example: render.bat batch_character_renderer.py
    echo.
    pause
    exit /b 1
)

echo Starting render: %1
"!BLENDER_EXE!" --background --python "%1"

if errorlevel 1 (
    echo ERROR: Render failed
) else (
    echo Done!
)
pause

