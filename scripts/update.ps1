[CmdletBinding()]
param(
    [switch]$All,
    [switch]$Force,
    [switch]$StartServer,
    [switch]$Deploy,
    [int]$Limit = 0,
    [string]$Model,
    [string]$BaseUrl = 'http://127.0.0.1:8765'
)

$ErrorActionPreference = 'Stop'

$recalculateArgs = @('-SourceFeeds', '-Snapshot')
if ($All) { $recalculateArgs = @('-All') }
if ($Force) { $recalculateArgs += '-Force' }
if ($StartServer) { $recalculateArgs += '-StartServer' }
if ($Limit -gt 0) { $recalculateArgs += @('-Limit', "$Limit") }
if ($Model) { $recalculateArgs += @('-Model', $Model) }
$recalculateArgs += @('-BaseUrl', $BaseUrl)

Write-Host 'Updating AI Countdown data and derived metrics...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'recalculate.ps1') @recalculateArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($Deploy) {
    Write-Host "`nDeploying the updated project..." -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'deploy.ps1')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host 'Update finished.' -ForegroundColor Green
