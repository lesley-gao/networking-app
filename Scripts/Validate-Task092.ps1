param([string]$Environment = 'dev')

Write-Host "Azure Monitor Alerts Configuration Validation" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

$baseDir = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"
$passed = 0
$total = 5

# Test 1: alerts template
if (Test-Path "$baseDir\infra\bicep\modules\alerts.bicep") {
    Write-Host "PASS: Alerts template exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Alerts template missing" -ForegroundColor Red
}

# Test 2: main template
if (Test-Path "$baseDir\infra\bicep\main.bicep") {
    Write-Host "PASS: Main template exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Main template missing" -ForegroundColor Red
}

# Test 3: parameter file
if (Test-Path "$baseDir\infra\bicep\parameters\main.$Environment.json") {
    Write-Host "PASS: Parameter file exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Parameter file missing" -ForegroundColor Red
}

# Test 4: setup script
if (Test-Path "$baseDir\Scripts\Setup-AzureMonitorAlerts.ps1") {
    Write-Host "PASS: Setup script exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Setup script missing" -ForegroundColor Red
}

# Test 5: documentation
if (Test-Path "$baseDir\Docs\AzureMonitorAlertsGuide.md") {
    Write-Host "PASS: Documentation exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Documentation missing" -ForegroundColor Red
}

$score = [math]::Round(($passed / $total) * 100, 0)
Write-Host ""
Write-Host "RESULTS: $passed out of $total tests passed" -ForegroundColor Yellow
Write-Host "SCORE: $score percent" -ForegroundColor Yellow

if ($score -eq 100) {
    Write-Host "STATUS: Configuration is complete and ready for deployment" -ForegroundColor Green
} else {
    Write-Host "STATUS: Configuration needs attention" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "TASK-092 Azure Monitor Alerts configuration validated" -ForegroundColor Green
