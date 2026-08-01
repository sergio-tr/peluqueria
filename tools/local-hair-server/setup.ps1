# Setup local GPU hair try-on sidecar (Windows / RTX)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$py = $null
foreach ($candidate in @("py -3.10", "py -3.11", "py -3.12")) {
  try {
    $ver = Invoke-Expression "$candidate -c `"import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')`""
    if ($LASTEXITCODE -eq 0 -and $ver) {
      $py = $candidate
      Write-Host "Using $candidate ($ver)"
      break
    }
  } catch {}
}
if (-not $py) {
  throw "Python 3.10+ not found. Install with: winget install Python.Python.3.10"
}

if (-not (Test-Path .\.venv)) {
  Invoke-Expression "$py -m venv .venv"
}

$pip = ".\.venv\Scripts\python.exe -m pip"
Invoke-Expression "$pip install --upgrade pip"
# CUDA 12.4 wheels work with modern NVIDIA drivers (incl. 3060)
Invoke-Expression "$pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124"
Invoke-Expression "$pip install -r requirements.txt"

Write-Host ""
Write-Host "Setup done. Start with:"
Write-Host "  .\start.ps1"
Write-Host "First run downloads the inpaint model (~5GB) from Hugging Face."
