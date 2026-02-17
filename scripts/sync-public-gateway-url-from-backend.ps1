$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendRepo = Join-Path (Split-Path $repoRoot -Parent) "Phoenix-Agentic-Engine-Backend"
$backendEnv = Join-Path $backendRepo ".env.local"

if (-not (Test-Path $backendEnv)) {
    throw "Backend .env.local not found at $backendEnv"
}

$url = ""
foreach ($line in Get-Content -Path $backendEnv) {
    if ($line -match '^\s*PHOENIX_PUBLIC_GATEWAY_URL=(.*)$') {
        $url = $matches[1].Trim()
        break
    }
}

if ([string]::IsNullOrWhiteSpace($url)) {
    throw "PHOENIX_PUBLIC_GATEWAY_URL is not set in backend .env.local"
}

& (Join-Path $repoRoot "scripts\set-public-gateway-url.ps1") -Url $url
Write-Host "Synced interface PHOENIX_PUBLIC_GATEWAY_URL from backend .env.local" -ForegroundColor Green
