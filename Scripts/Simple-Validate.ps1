param([string]$Environment = 'dev')

Write-Host "Azure Monitor Alerts Configuration Validation" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

$baseDir = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"
$passed = 0
$total = 0

# Test alerts template
$total++
$alertsTemplate = "$baseDir\infra\bicep\modules\alerts.bicep"
if (Test-Path $alertsTemplate) {
    Write-Host "✓ Alerts template exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Alerts template missing" -ForegroundColor Red
}

# Test main template
$total++
$mainTemplate = "$baseDir\infra\bicep\main.bicep"
if (Test-Path $mainTemplate) {
    Write-Host "✓ Main template exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Main template missing" -ForegroundColor Red
}

# Test parameter file
$total++
$paramFile = "$baseDir\infra\bicep\parameters\main.$Environment.json"
if (Test-Path $paramFile) {
    Write-Host "✓ Parameter file exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Parameter file missing" -ForegroundColor Red
}

# Test scripts
$total++
$setupScript = "$baseDir\Scripts\Setup-AzureMonitorAlerts.ps1"
if (Test-Path $setupScript) {
    Write-Host "✓ Setup script exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Setup script missing" -ForegroundColor Red
}

# Test documentation
$total++
$docFile = "$baseDir\Docs\AzureMonitorAlertsGuide.md"
if (Test-Path $docFile) {
    Write-Host "✓ Documentation exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Documentation missing" -ForegroundColor Red
}

$score = [math]::Round(($passed / $total) * 100, 0)
Write-Host ""
Write-Host "Results: $passed/$total tests passed ($score percent)" -ForegroundColor Yellow

if ($score -eq 100) {
    Write-Host "Excellent! Configuration is complete" -ForegroundColor Green
} elseif ($score -ge 80) {
    Write-Host "Good! Minor items to complete" -ForegroundColor Yellow
} else {
    Write-Host "Needs work before deployment" -ForegroundColor Red
}
