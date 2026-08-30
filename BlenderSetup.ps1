# Blender Setup Helper for Windows
# Run this script to download and install Blender, or use it to find an existing installation

param(
    [switch]$Download,
    [switch]$FindInstall,
    [switch]$Test
)

$BlenderVersion = "4.1.1"
$BlenderURL = "https://www.blender.org/download/release/Blender4.1/blender-4.1.1-windows-x64.msi/"

function Find-BlenderInstallation {
    Write-Host "Searching for Blender installation..." -ForegroundColor Cyan

    $possibleRoots = @(
        "C:\Program Files\Blender Foundation",
        "C:\Program Files (x86)\Blender Foundation",
        "$env:ProgramFiles\Blender Foundation"
    ) | Select-Object -Unique

    foreach ($root in $possibleRoots) {
        if (-not (Test-Path $root)) { continue }

        $matches = Get-ChildItem -Path $root -Directory -Filter "Blender*" -ErrorAction SilentlyContinue
        foreach ($dir in $matches) {
            $path = Join-Path $dir.FullName "blender.exe"
            if (Test-Path $path) {
                Write-Host "Found Blender at: $path" -ForegroundColor Green
                return $path
            }
        }
    }

    $possiblePaths = @(
        "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
        "C:\Program Files (x86)\Blender Foundation\Blender 4.1\blender.exe",
        "C:\Program Files (x86)\Blender Foundation\Blender 4.0\blender.exe",
        "$env:ProgramFiles\Blender Foundation\Blender 4.1\blender.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-Host "Found Blender at: $path" -ForegroundColor Green
            return $path
        }
    }

    Write-Host "Blender not found in standard locations" -ForegroundColor Red
    return $null
}

function Test-BlenderCommand {
    Write-Host "Testing Blender command..." -ForegroundColor Cyan

    try {
        $output = blender --version 2>&1
        Write-Host "Blender is available: $output" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Blender command failed" -ForegroundColor Red
        return $false
    }
}

function Show-DownloadInstructions {
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "BLENDER INSTALLATION REQUIRED" -ForegroundColor Yellow
    Write-Host "="*60 -ForegroundColor Cyan

    Write-Host @"
Blender is not installed on your system. Follow these steps:

1. Download Blender 4.1+ from:
   https://www.blender.org/download/

2. Run the installer (Windows 64-bit recommended)

3. During installation, IMPORTANT:
   Check "Add Blender to PATH"
   Install to default location (Program Files)

4. After installation, restart PowerShell and try again:
   blender --background --python batch_character_renderer.py

Or, use full path if PATH not configured:
   & 'C:\Program Files\Blender Foundation\Blender 4.1\blender.exe' --background --python batch_character_renderer.py
"@

    Write-Host "="*60 -ForegroundColor Cyan
}

function Create-RenderHelper {
    Write-Host "`nCreating render helper script..." -ForegroundColor Cyan

    $helperScript = @"
@echo off
REM Blender Render Helper - Windows batch script
REM Place this in your game folder and use: render.bat

setlocal enabledelayedexpansion

REM Try to find Blender
for /f "delims=" %%A in ('where blender 2^>nul') do set BLENDER_EXE=%%A

if not defined BLENDER_EXE (
    echo Blender not found in PATH. Trying common locations...

    for /d %%D in ("C:\Program Files\Blender Foundation\Blender*") do (
        if exist "%%D\blender.exe" set BLENDER_EXE=%%D\blender.exe
    )

    if not defined BLENDER_EXE (
        for /d %%D in ("C:\Program Files (x86)\Blender Foundation\Blender*") do (
            if exist "%%D\blender.exe" set BLENDER_EXE=%%D\blender.exe
        )
    )

    if not defined BLENDER_EXE (
        echo ERROR: Blender not found. Please install from https://www.blender.org/download/
        pause
        exit /b 1
    )
)

echo Using Blender: !BLENDER_EXE!
echo.

if "%1"=="" (
    echo Usage: render.bat ^<script.py^>
    echo Example: render.bat batch_character_renderer.py
    pause
    exit /b 1
)

echo Starting render: %1
"!BLENDER_EXE!" --background --python %1

if errorlevel 1 (
    echo ERROR: Render failed
    pause
) else (
    echo Done!
)
"@

    $helperScript | Set-Content -Path "render.bat" -Encoding ASCII
    Write-Host "Created render.bat helper" -ForegroundColor Green
}

# Main execution
if ($Test) {
    Test-BlenderCommand
    exit
}

if ($FindInstall) {
    $install = Find-BlenderInstallation
    if ($install) {
        Write-Host "`nTo use this installation, run:" -ForegroundColor Yellow
        Write-Host "'$install' --background --python batch_character_renderer.py" -ForegroundColor White
    } else {
        Show-DownloadInstructions
    }
    exit
}

# Default: search for Blender and show instructions
$install = Find-BlenderInstallation
if ($install) {
    Write-Host "`nBlender found! You can now run:" -ForegroundColor Green
    Write-Host "blender --background --python batch_character_renderer.py" -ForegroundColor White
} else {
    Show-DownloadInstructions
    Create-RenderHelper
}
