$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

if (-not (Test-Path .\.venv\Scripts\python.exe)) {
  Write-Host "venv missing — running setup.ps1 first..."
  & "$Root\setup.ps1"
}

$env:LOCAL_HAIR_HOST = if ($env:LOCAL_HAIR_HOST) { $env:LOCAL_HAIR_HOST } else { "127.0.0.1" }
$env:LOCAL_HAIR_PORT = if ($env:LOCAL_HAIR_PORT) { $env:LOCAL_HAIR_PORT } else { "7860" }

Write-Host "Starting local hair server on http://$($env:LOCAL_HAIR_HOST):$($env:LOCAL_HAIR_PORT)"
& .\.venv\Scripts\python.exe -m uvicorn server:app --host $env:LOCAL_HAIR_HOST --port $env:LOCAL_HAIR_PORT
