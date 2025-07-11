# Simple validation script for Azure Monitor Alerts configuration
param(
    [string]$Environment = 'dev'
)

Write-Host "=== Azure Monitor Alerts Configuration Validation ===" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

$baseDir = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"
$passed = 0
$total = 0

# Test 1: Check alerts.bicep template
$total++
$alertsTemplate = Join-Path $baseDir "infra\bicep\modules\alerts.bicep"
if (Test-Path $alertsTemplate) {
    $content = Get-Content $alertsTemplate -Raw
    if ($content -match "Microsoft\.Insights/metricAlerts" -and $content -match "Microsoft\.Insights/scheduledQueryRules") {
        Write-Host "✓ Alerts Bicep template exists and contains alert resources" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ Alerts Bicep template missing alert resources" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Alerts Bicep template not found" -ForegroundColor Red
}

# Test 2: Check main.bicep integration
$total++
$mainTemplate = Join-Path $baseDir "infra\bicep\main.bicep"
if (Test-Path $mainTemplate) {
    $content = Get-Content $mainTemplate -Raw
    if ($content -match "module alerts") {
        Write-Host "✓ Main template integrates alerts module" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ Main template missing alerts module integration" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Main Bicep template not found" -ForegroundColor Red
}

# Test 3: Check parameter file
$total++
$paramFile = Join-Path $baseDir "infra\bicep\parameters\main.$Environment.json"
if (Test-Path $paramFile) {
    try {
        $params = Get-Content $paramFile -Raw | ConvertFrom-Json
        if ($params.parameters.enableAlerts -and $params.parameters.alertEmailAddress) {
            Write-Host "✓ Parameter file contains alert configuration" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "✗ Parameter file missing alert parameters" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Parameter file has invalid JSON" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Parameter file not found for environment: $Environment" -ForegroundColor Red
}

# Test 4: Check PowerShell scripts
$total++
$setupScript = Join-Path $baseDir "Scripts\Setup-AzureMonitorAlerts.ps1"
$testScript = Join-Path $baseDir "Scripts\Test-AzureMonitorAlerts.ps1"
if ((Test-Path $setupScript) -and (Test-Path $testScript)) {
    Write-Host "✓ PowerShell automation scripts exist" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ PowerShell automation scripts missing" -ForegroundColor Red
}

# Test 5: Check documentation
$total++
$docFile = Join-Path $baseDir "Docs\AzureMonitorAlertsGuide.md"
if (Test-Path $docFile) {
    Write-Host "✓ Documentation exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Documentation missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Validation Results ===" -ForegroundColor Green
Write-Host "Passed: $passed/$total tests" -ForegroundColor Yellow

$score = [math]::Round(($passed / $total) * 100, 0)
if ($score -ge 90) {
    Write-Host "Score: $score% - Excellent! Ready for deployment ✅" -ForegroundColor Green
} elseif ($score -ge 70) {
    Write-Host "Score: $score% - Good, minor issues to address ⚠️" -ForegroundColor Yellow
} else {
    Write-Host "Score: $score% - Needs attention before deployment ❌" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuration files validated for TASK-092 Azure Monitor Alerts setup" -ForegroundColor Green
