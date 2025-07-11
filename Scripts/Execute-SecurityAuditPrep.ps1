# ==================================================================================================
# Execute Security Audit Preparation - Quick Start Script
# ==================================================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Environment = 'test',

    [Parameter(Mandatory = $false)]
    [string]$AuditFirm = "",

    [Parameter(Mandatory = $false)]
    [switch]$FullPreparation
)

Write-Host "🛡️ Flight Companion Platform - Security Audit Preparation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Get current subscription
try {
    $currentSubscription = az account show --output json | ConvertFrom-Json
    $subscriptionId = $currentSubscription.id
    Write-Host "✓ Using subscription: $($currentSubscription.name)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Please login to Azure CLI first: az login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Subscription: $($currentSubscription.name)" -ForegroundColor Yellow
if ($AuditFirm) { Write-Host "Audit Firm: $AuditFirm" -ForegroundColor Yellow }
Write-Host ""

# Confirm execution
$confirmation = Read-Host "Proceed with security audit preparation? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Security audit preparation cancelled." -ForegroundColor Yellow
    exit 0
}

# Execute security audit preparation
try {
    $scriptPath = Join-Path $PSScriptRoot "Prepare-SecurityAudit.ps1"
    
    $params = @{
        Environment = $Environment
        SubscriptionId = $subscriptionId
        GenerateDocumentation = $true
    }
    
    if ($AuditFirm) {
        $params.AuditFirmName = $AuditFirm
    }
    
    if ($FullPreparation) {
        $params.ConfigurePenetrationTesting = $true
        $params.CreateAuditEnvironment = $true
    }
    
    Write-Host "🚀 Starting security audit preparation..." -ForegroundColor Cyan
    & $scriptPath @params
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Security audit preparation completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Review generated documentation in ./SecurityAudit/" -ForegroundColor White
        Write-Host "2. Complete the SecurityAuditChecklist.md" -ForegroundColor White
        Write-Host "3. Select security firm using SecurityFirmEvaluationGuide.md" -ForegroundColor White
        Write-Host "4. Schedule security audit with chosen firm" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host "❌ Security audit preparation encountered issues. Check logs for details." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error during security audit preparation: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🛡️ Security audit preparation script completed." -ForegroundColor Cyan
