$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Import-EnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    foreach ($line in Get-Content -Path $Path) {
        $trimmed = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
            continue
        }

        $separator = $trimmed.IndexOf("=")
        if ($separator -lt 1) {
            continue
        }

        $key = $trimmed.Substring(0, $separator).Trim()
        $value = $trimmed.Substring($separator + 1)

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

Import-EnvFile -Path ".env.local"
$env:PHOENIX_RUN_SMOKE = "1"

if ([string]::IsNullOrWhiteSpace($env:PHOENIX_PUBLIC_GATEWAY_URL)) {
    throw "PHOENIX_PUBLIC_GATEWAY_URL is required. Run scripts/sync-public-gateway-url-from-backend.ps1 or scripts/set-public-gateway-url.ps1 first."
}

$env:PHOENIX_TEST_BASE_URL = $env:PHOENIX_PUBLIC_GATEWAY_URL

if ([string]::IsNullOrWhiteSpace($env:PHOENIX_TEST_TOKEN) -and -not [string]::IsNullOrWhiteSpace($env:PHOENIX_API_TOKEN)) {
    $env:PHOENIX_TEST_TOKEN = $env:PHOENIX_API_TOKEN
}

if ([string]::IsNullOrWhiteSpace($env:PHOENIX_TEST_TOKEN)) {
    throw "PHOENIX_TEST_TOKEN is required. Set PHOENIX_API_TOKEN or PHOENIX_TEST_TOKEN in .env.local."
}

& ".\scripts\check-dev-connectivity.ps1" -EnvFile ".env.local"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

npm run test:smoke
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
