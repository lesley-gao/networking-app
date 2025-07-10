# Combined Code Coverage Script
# Generates comprehensive code coverage reports for both .NET backend and React frontend

param(
    [Parameter(Mandatory=$false)]
    [switch]$OpenReports,
    
    [Parameter(Mandatory=$false)]
    [int]$MinimumThreshold = 80,
    
    [Parameter(Mandatory=$false)]
    [switch]$CI,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackendOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$FrontendOnly
)

Write-Host "🎯 Starting Combined Code Coverage Analysis..." -ForegroundColor Magenta
Write-Host "Minimum Threshold: $MinimumThreshold%" -ForegroundColor White

$backendExitCode = 0
$frontendExitCode = 0

# Run Backend Coverage (unless FrontendOnly is specified)
if (-not $FrontendOnly) {
    Write-Host "`n" + "="*60 -ForegroundColor Blue
    Write-Host "🚀 .NET Backend Code Coverage" -ForegroundColor Blue
    Write-Host "="*60 -ForegroundColor Blue
    
    $backendParams = @{
        MinimumThreshold = $MinimumThreshold
    }
    if ($OpenReports) { $backendParams.OpenReport = $true }
    
    & "$PSScriptRoot\Generate-DotNetCodeCoverage.ps1" @backendParams
    $backendExitCode = $LASTEXITCODE
    
    if ($backendExitCode -eq 0) {
        Write-Host "✅ Backend coverage analysis completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend coverage analysis failed or thresholds not met" -ForegroundColor Red
    }
}

# Run Frontend Coverage (unless BackendOnly is specified)
if (-not $BackendOnly) {
    Write-Host "`n" + "="*60 -ForegroundColor Blue
    Write-Host "⚛️ React Frontend Code Coverage" -ForegroundColor Blue
    Write-Host "="*60 -ForegroundColor Blue
    
    $frontendParams = @{
        MinimumThreshold = $MinimumThreshold
    }
    if ($OpenReports) { $frontendParams.OpenReport = $true }
    if ($CI) { $frontendParams.CI = $true }
    
    & "$PSScriptRoot\Generate-ReactCodeCoverage.ps1" @frontendParams
    $frontendExitCode = $LASTEXITCODE
    
    if ($frontendExitCode -eq 0) {
        Write-Host "✅ Frontend coverage analysis completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend coverage analysis failed or thresholds not met" -ForegroundColor Red
    }
}

# Generate Combined Report Summary
Write-Host "`n" + "="*60 -ForegroundColor Magenta
Write-Host "📊 Combined Coverage Summary" -ForegroundColor Magenta
Write-Host "="*60 -ForegroundColor Magenta

$overallSuccess = $true

if (-not $FrontendOnly) {
    $backendStatus = if ($backendExitCode -eq 0) { "✅ PASSED" } else { "❌ FAILED" }
    $backendColor = if ($backendExitCode -eq 0) { "Green" } else { "Red" }
    Write-Host "Backend (.NET):  $backendStatus" -ForegroundColor $backendColor
    if ($backendExitCode -ne 0) { $overallSuccess = $false }
}

if (-not $BackendOnly) {
    $frontendStatus = if ($frontendExitCode -eq 0) { "✅ PASSED" } else { "❌ FAILED" }
    $frontendColor = if ($frontendExitCode -eq 0) { "Green" } else { "Red" }
    Write-Host "Frontend (React): $frontendStatus" -ForegroundColor $frontendColor
    if ($frontendExitCode -ne 0) { $overallSuccess = $false }
}

Write-Host "`nMinimum Threshold: $MinimumThreshold%" -ForegroundColor White

if ($overallSuccess) {
    Write-Host "`n🎉 Overall Result: ALL COVERAGE THRESHOLDS MET!" -ForegroundColor Green
    $finalExitCode = 0
} else {
    Write-Host "`n💥 Overall Result: SOME COVERAGE THRESHOLDS NOT MET!" -ForegroundColor Red
    $finalExitCode = 1
}

# Output coverage report locations
Write-Host "`n📁 Generated Reports:" -ForegroundColor Cyan
if (-not $FrontendOnly) {
    Write-Host "  Backend HTML:  CodeCoverage/html/index.html" -ForegroundColor White
}
if (-not $BackendOnly) {
    Write-Host "  Frontend HTML: ClientApp/coverage/lcov-report/index.html" -ForegroundColor White
}

# CI/CD Integration Notes
if ($CI) {
    Write-Host "`n🔧 CI/CD Integration Notes:" -ForegroundColor Yellow
    Write-Host "  - Coverage reports are in standard formats (LCOV, Cobertura, JSON)" -ForegroundColor Gray
    Write-Host "  - Exit code indicates overall pass/fail status" -ForegroundColor Gray
    Write-Host "  - Reports can be parsed by most CI/CD platforms" -ForegroundColor Gray
}

Write-Host "`n✨ Combined Code Coverage Analysis Complete!" -ForegroundColor Magenta
exit $finalExitCode
