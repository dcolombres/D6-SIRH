# Deploy SIRH dashboard seed into local Helical Docker repository
#
# Usage (PowerShell, from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-helical-sirh.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$src = Join-Path $repoRoot "helical\repository\SIRH"
$container = "helical-hiee-1"
$dest = "/usr/local/Helical Insight/hi/hi-repository/SIRH"

if (-not (Test-Path $src)) {
  throw "No existe la carpeta seed: $src"
}

$running = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $container }
if (-not $running) {
  throw "El contenedor $container no está en ejecución."
}

Write-Host "Creando carpeta destino en contenedor..."
docker exec $container sh -c "mkdir -p '$dest'"

Write-Host "Copiando archivos SIRH..."
docker cp (Join-Path $src "index.efwfolder") "${container}:${dest}/index.efwfolder"
docker cp (Join-Path $src "Gerencia_SIRH.efw") "${container}:${dest}/Gerencia_SIRH.efw"
docker cp (Join-Path $src "dashboard.html") "${container}:${dest}/dashboard.html"

Write-Host "Listado en contenedor:"
docker exec $container sh -c "ls -la '$dest'"

Write-Host ""
Write-Host "Listo. En Helical File Browser deberías ver carpeta SIRH / Gerencia_SIRH.efw"
Write-Host "En DDS Admin: dir=SIRH  file=Gerencia_SIRH.efw"
Write-Host "Si no aparece, refresca el File Browser o recarga Helical."
