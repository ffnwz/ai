[CmdletBinding()]
param(
    [switch]$SkipApi,
    [switch]$SkipGitHub,
    [string]$BaseUrl = 'http://127.0.0.1:8765',
    [string]$Repository = 'ffnwz/ai'
)

$ErrorActionPreference = 'Continue'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
$failures = 0

function Invoke-CheckStep {
    param([string]$Label, [string]$Command, [string[]]$Arguments = @())
    Write-Host "`n> $Label" -ForegroundColor Cyan
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        $script:failures++
        Write-Host "FAIL: $Label" -ForegroundColor Red
    } else {
        Write-Host "OK: $Label" -ForegroundColor Green
    }
}

Write-Host 'AI Countdown local checks' -ForegroundColor White
Invoke-CheckStep 'server.js syntax' 'node' @('--check', 'server.js')
Invoke-CheckStep 'app.js syntax' 'node' @('--check', 'app.js')
Invoke-CheckStep 'life.js syntax' 'node' @('--check', 'life.js')
Invoke-CheckStep 'occupations.js syntax' 'node' @('--check', 'occupations.js')
Invoke-CheckStep 'Work rating files' 'npm' @('run', 'work:verify')
Invoke-CheckStep 'Life rating files' 'npm' @('run', 'life:verify')

Write-Host "`n> JSON files" -ForegroundColor Cyan
Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'data') -Filter '*.json' -Recurse -File | ForEach-Object {
    $file = $_
    try {
        $parseOutput = & node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'))" -- $file.FullName 2>&1
        if ($LASTEXITCODE -ne 0) { throw ($parseOutput -join ' ') }
        Write-Host "  OK $($file.FullName.Substring($ProjectRoot.Length + 1))" -ForegroundColor DarkGreen
    } catch {
        $failures++
        Write-Host "  FAIL $($file.FullName.Substring($ProjectRoot.Length + 1)): $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $SkipApi) {
    foreach ($path in @('/', '/ru', '/code', '/work', '/life', '/methodology', '/robots.txt', '/sitemap.xml', '/og-en.png', '/og-ru.png', '/last.json', '/api/code-index-progress', '/api/life-tasks', '/api/self-building', '/api/metric-series', '/api/combined-snapshot')) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl$path" -TimeoutSec 30
            if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { throw "HTTP $($response.StatusCode)" }
            Write-Host "  OK $path ($($response.StatusCode))" -ForegroundColor DarkGreen
        } catch {
            $failures++
            Write-Host "  FAIL ${path}: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if (-not $SkipGitHub) {
    Invoke-CheckStep 'GitHub Issues and PR review' 'node' @('scripts/github-review.js', '--repo', $Repository)
}

if ($failures) {
    Write-Host "`nChecks failed: $failures" -ForegroundColor Red
    exit 1
}
Write-Host "`nAll checks passed." -ForegroundColor Green
