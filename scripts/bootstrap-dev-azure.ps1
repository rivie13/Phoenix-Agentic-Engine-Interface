param(
    [switch]$SkipConnectivityCheck
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$workspaceRoot = Split-Path $repoRoot -Parent
$backendRepo = Join-Path $workspaceRoot "Phoenix-Agentic-Engine-Backend"
$engineRepo = Join-Path $workspaceRoot "Phoenix-Agentic-Engine"

$backendEnv = Join-Path $backendRepo ".env.local"
if (-not (Test-Path $backendEnv)) {
    throw "Backend .env.local not found at $backendEnv"
}

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Key
    )

    $escapedKey = [Regex]::Escape($Key)
    foreach ($line in Get-Content -Path $Path) {
        if ($null -eq $line) {
            continue
        }

        $match = [Regex]::Match([string]$line, "^\s*$escapedKey=(.*)$")
        if ($match.Success) {
            return $match.Groups[1].Value.Trim()
        }
    }

    return ""
}

$baseUrl = Get-EnvValue -Path $backendEnv -Key "PHOENIX_PUBLIC_GATEWAY_URL"
$apiToken = Get-EnvValue -Path $backendEnv -Key "PHOENIX_API_TOKEN"
$authMode = Get-EnvValue -Path $backendEnv -Key "PHOENIX_AUTH_MODE"
$azureEnvironment = Get-EnvValue -Path $backendEnv -Key "PHOENIX_AZURE_ENVIRONMENT"

if ([string]::IsNullOrWhiteSpace($azureEnvironment)) {
    $azureEnvironment = "dev"
}

if (-not [string]::Equals($azureEnvironment, "dev", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "bootstrap-dev-azure.ps1 is dev-only. PHOENIX_AZURE_ENVIRONMENT='$azureEnvironment'."
}

if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    throw "PHOENIX_PUBLIC_GATEWAY_URL is missing in backend .env.local. Run backend provision/sync first."
}

if (-not ($baseUrl -match '^https?://')) {
    throw "Invalid PHOENIX_PUBLIC_GATEWAY_URL '$baseUrl'."
}

if ([string]::IsNullOrWhiteSpace($authMode)) {
    $authMode = "managed"
}

if ([string]::IsNullOrWhiteSpace($apiToken)) {
    throw "PHOENIX_API_TOKEN is missing in backend .env.local. Import dev token from Key Vault via backend provisioning flow."
}

if ($apiToken.StartsWith("phx_", [System.StringComparison]::OrdinalIgnoreCase) -and
    -not [string]::Equals($azureEnvironment, "dev", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to sync static phx_ token outside dev environment."
}

$configSource = "backend:.env.local"

$interfaceSetScript = Join-Path $repoRoot "scripts\set-public-gateway-url.ps1"
& $interfaceSetScript -Url $baseUrl -ApiToken $apiToken -AuthMode $authMode -ConfigSource $configSource

$backendSetScript = Join-Path $backendRepo "scripts\set-public-gateway-url.ps1"
if (Test-Path $backendSetScript) {
    & $backendSetScript -Url $baseUrl -ApiToken $apiToken -AuthMode $authMode -ConfigSource $configSource -AlsoSetWorkerBaseUrl
}

$engineSetScript = Join-Path $engineRepo "scripts\set-public-gateway-url.ps1"
if (Test-Path $engineSetScript) {
    & $engineSetScript -Url $baseUrl -ApiToken $apiToken -AuthMode $authMode -ConfigSource $configSource
}

Write-Host "\nDev bootstrap complete." -ForegroundColor Green
Write-Host "Resolved base URL : $baseUrl" -ForegroundColor Yellow
Write-Host "Resolved auth mode: $authMode" -ForegroundColor Yellow
Write-Host "Resolved source   : $configSource" -ForegroundColor Yellow

if (-not $SkipConnectivityCheck.IsPresent) {
    Write-Host "\nRunning connectivity check..." -ForegroundColor Cyan
    & (Join-Path $repoRoot "scripts\check-dev-connectivity.ps1")
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
