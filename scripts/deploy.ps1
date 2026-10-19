[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$NoRestart,
    [switch]$PushPages,
    [string]$SshAlias,
    [string]$RemoteDir,
    [string]$ProductionUrl
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("ai-countdown-deploy-" + [guid]::NewGuid().ToString('N'))
$configFile = Join-Path $PSScriptRoot 'deploy.config.ps1'

if (Test-Path -LiteralPath $configFile) { . $configFile }
if (-not $SshAlias) { $SshAlias = $AiCountdownSshAlias }
if (-not $RemoteDir) { $RemoteDir = $AiCountdownRemoteDir }
if (-not $ProductionUrl) { $ProductionUrl = $AiCountdownProductionUrl }
if (-not $SshAlias -or -not $RemoteDir -or -not $ProductionUrl) {
    throw "Missing deployment configuration. Copy scripts/deploy.config.example.ps1 to scripts/deploy.config.ps1 and fill it locally. The config file is ignored by Git."
}

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { throw "Required command '$Name' was not found in PATH." }
}

try {
    Assert-Command 'robocopy'
    Assert-Command 'ssh'
    Assert-Command 'scp'
    New-Item -ItemType Directory -Path $stage -Force | Out-Null

    Write-Host "Preparing deployment snapshot (secrets and local caches excluded)..." -ForegroundColor Cyan
    & robocopy $ProjectRoot $stage /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ /NFL /NDL /NP `
        /XD '.git' '.openai' 'node_modules' 'data\repository-analysis-locks' `
        /XF '.env' 'deploy.local.md' '*.log' 'slopscore-cache.json' 'code-index-cache.json' `
            'code-index-progress.json' 'code-index-catalog.json' 'repository-analyses.json' `
            'contributor-profiles.json' 'github-contributors.json' 'github-contributors-cache.json' `
            'source-feeds-cache.json' 'metric-series.json' 'combined-snapshot.json' `
            'combined-snapshot-cache.json'
    if ($LASTEXITCODE -gt 7) { throw "robocopy failed with exit code $LASTEXITCODE" }

    $entries = @(Get-ChildItem -LiteralPath $stage -Force)
    if (-not $entries.Count) { throw 'Deployment snapshot is empty.' }
    Write-Host "Prepared $($entries.Count) top-level entries." -ForegroundColor DarkGray
    if ($DryRun) {
        Write-Host 'Dry run: no files were uploaded and production was not restarted.' -ForegroundColor Yellow
        return
    }

    & ssh $SshAlias "mkdir -p $RemoteDir"
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the production directory.' }
    foreach ($entry in $entries) {
        Write-Host "Uploading $($entry.Name)..." -ForegroundColor Cyan
        & scp -r $entry.FullName "${SshAlias}:$RemoteDir/"
        if ($LASTEXITCODE -ne 0) { throw "Upload failed for $($entry.Name)." }
    }

    if (-not $NoRestart) {
        & ssh $SshAlias 'pm2 restart ai-countdown --update-env && pm2 save'
        if ($LASTEXITCODE -ne 0) { throw 'Production PM2 restart failed.' }
    }

    $health = Invoke-WebRequest -UseBasicParsing -Uri "$ProductionUrl/api/code-index" -TimeoutSec 60
    if ($health.StatusCode -lt 200 -or $health.StatusCode -ge 400) { throw "Production health check returned HTTP $($health.StatusCode)." }
    $life = Invoke-WebRequest -UseBasicParsing -Uri "$ProductionUrl/life" -TimeoutSec 60
    if ($life.StatusCode -lt 200 -or $life.StatusCode -ge 400) { throw "Production /life check returned HTTP $($life.StatusCode)." }
    Write-Host "Production is healthy: $ProductionUrl" -ForegroundColor Green

    if ($PushPages) {
        & git push origin main
        if ($LASTEXITCODE -ne 0) { throw 'GitHub Pages push failed.' }
        Write-Host 'GitHub Pages workflow started by pushing main.' -ForegroundColor Green
    }
} finally {
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue }
}
