[CmdletBinding()]
param(
    [switch]$All,
    [switch]$Code,
    [switch]$WorkInputs,
    [switch]$WorkRating,
    [switch]$LifeRating,
    [switch]$SourceFeeds,
    [switch]$Snapshot,
    [switch]$Force,
    [switch]$StartServer,
    [int]$Limit = 0,
    [string]$Model,
    [string]$BaseUrl = 'http://127.0.0.1:8765'
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if (-not ($All -or $Code -or $WorkInputs -or $WorkRating -or $LifeRating -or $SourceFeeds -or $Snapshot)) {
    $Code = $true
    $SourceFeeds = $true
    $Snapshot = $true
}
if ($All) {
    $Code = $true
    $WorkInputs = $true
    $WorkRating = $true
    $LifeRating = $true
    $SourceFeeds = $true
    $Snapshot = $true
}

function Invoke-NodeStep {
    param([string]$Script, [string[]]$Arguments = @())
    Write-Host "`n> node $Script $($Arguments -join ' ')" -ForegroundColor Cyan
    & node $Script @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Node step failed: $Script ($LASTEXITCODE)" }
}

$startedProcess = $null
function Ensure-LocalServer {
    if (-not ($SourceFeeds -or $Snapshot)) { return }
    try {
        Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/code-index-progress" -TimeoutSec 5 | Out-Null
        return
    } catch {
        if (-not $StartServer) {
            throw "Local API is not available at $BaseUrl. Start it with 'npm start' or rerun with -StartServer."
        }
    }

    $stdout = Join-Path $env:TEMP 'ai-countdown-local-server.out.log'
    $stderr = Join-Path $env:TEMP 'ai-countdown-local-server.err.log'
    $startedProcess = Start-Process -FilePath 'node' -ArgumentList @('server.js') -WorkingDirectory $ProjectRoot -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/code-index-progress" -TimeoutSec 2 | Out-Null
            return
        } catch {
            if ($startedProcess.HasExited) { throw "Local server exited while starting. See $stderr" }
        }
    }
    throw "Local server did not become ready at $BaseUrl. See $stderr"
}

function Invoke-ApiStep {
    param([string]$Path)
    $uri = "$BaseUrl$Path"
    Write-Host "`n> GET $uri" -ForegroundColor Cyan
    $payload = Invoke-RestMethod -Method Get -Uri $uri -TimeoutSec 300
    $status = if ($payload.status) { $payload.status } else { 'ok' }
    Write-Host "  status: $status" -ForegroundColor Green
    return $payload
}

try {
    if ($Code) {
        $codeArgs = @()
        if ($Force) { $codeArgs += '--force' }
        Invoke-NodeStep -Script 'refresh-code-index.js' -Arguments $codeArgs
    }
    if ($WorkInputs) { Invoke-NodeStep -Script 'refresh-work-occupations.js' -Arguments @('inputs') }
    if ($WorkRating) {
        $args = @('rate')
        if ($Model) { $args += @('--model', $Model) }
        if ($Limit -gt 0) { $args += @('--limit', "$Limit") }
        Invoke-NodeStep -Script 'refresh-work-occupations.js' -Arguments $args
    }
    if ($LifeRating) {
        $args = @('rate')
        if ($Model) { $args += @('--model', $Model) }
        if ($Limit -gt 0) { $args += @('--limit', "$Limit") }
        Invoke-NodeStep -Script 'refresh-life-tasks.js' -Arguments $args
    }
    if ($SourceFeeds -or $Snapshot) { Ensure-LocalServer }
    if ($SourceFeeds) { Invoke-ApiStep -Path '/api/source-feeds?refresh=1' | Out-Null }
    if ($Snapshot) { Invoke-ApiStep -Path '/api/combined-snapshot' | Out-Null }
    Write-Host "`nRecalculation finished." -ForegroundColor Green
} finally {
    if ($startedProcess -and -not $startedProcess.HasExited) {
        Stop-Process -Id $startedProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped temporary local server (PID $($startedProcess.Id))." -ForegroundColor DarkGray
    }
}
