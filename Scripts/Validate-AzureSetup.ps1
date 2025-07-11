# ----------------------------------------------------------------------------------------------------
# Validate-AzureSetup.ps1
# Validation script to verify Azure infrastructure setup for GitHub Actions deployment
# Part of TASK-083: Validation and health checks
# ----------------------------------------------------------------------------------------------------

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$ServicePrincipalName
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Validating Azure Infrastructure Setup..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

$validationResults = @()

# ----------------------------------------------------------------------------------------------------
# Validation Functions
# ----------------------------------------------------------------------------------------------------

function Add-ValidationResult {
    param(
        [string]$Component,
        [bool]$IsValid,
        [string]$Message,
        [string]$Details = ""
    )
    
    $result = [PSCustomObject]@{
        Component = $Component
        IsValid = $IsValid
        Message = $Message
        Details = $Details
    }
    
    $script:validationResults += $result
    
    if ($IsValid) {
        Write-Host "✅ $Component`: $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Component`: $Message" -ForegroundColor Red
    }
    
    if ($Details) {
        Write-Host "   Details: $Details" -ForegroundColor Gray
    }
}

# ----------------------------------------------------------------------------------------------------
# Azure CLI Validation
# ----------------------------------------------------------------------------------------------------

try {
    $azVersion = az version --output json | ConvertFrom-Json
    Add-ValidationResult -Component "Azure CLI" -IsValid $true -Message "Installed and accessible" -Details "Version: $($azVersion.'azure-cli')"
} catch {
    Add-ValidationResult -Component "Azure CLI" -IsValid $false -Message "Not installed or not accessible" -Details $_.Exception.Message
    exit 1
}

# ----------------------------------------------------------------------------------------------------
# Subscription Validation
# ----------------------------------------------------------------------------------------------------

try {
    az account set --subscription $SubscriptionId | Out-Null
    $currentSub = az account show --output json | ConvertFrom-Json
    Add-ValidationResult -Component "Subscription" -IsValid $true -Message "Accessible" -Details "Name: $($currentSub.name)"
} catch {
    Add-ValidationResult -Component "Subscription" -IsValid $false -Message "Cannot access subscription" -Details $_.Exception.Message
}

# ----------------------------------------------------------------------------------------------------
# Resource Group Validation
# ----------------------------------------------------------------------------------------------------

try {
    $resourceGroupExists = az group exists --name $ResourceGroupName --output tsv
    if ($resourceGroupExists -eq "true") {
        $rgDetails = az group show --name $ResourceGroupName --output json | ConvertFrom-Json
        Add-ValidationResult -Component "Resource Group" -IsValid $true -Message "Exists and accessible" -Details "Location: $($rgDetails.location), State: $($rgDetails.properties.provisioningState)"
    } else {
        Add-ValidationResult -Component "Resource Group" -IsValid $false -Message "Does not exist"
    }
} catch {
    Add-ValidationResult -Component "Resource Group" -IsValid $false -Message "Error checking resource group" -Details $_.Exception.Message
}

# ----------------------------------------------------------------------------------------------------
# Service Principal Validation
# ----------------------------------------------------------------------------------------------------

try {
    $servicePrincipal = az ad sp list --display-name $ServicePrincipalName --query "[].{appId:appId,displayName:displayName}" --output json | ConvertFrom-Json
    
    if ($servicePrincipal -and $servicePrincipal.Count -gt 0) {
        Add-ValidationResult -Component "Service Principal" -IsValid $true -Message "Exists" -Details "App ID: $($servicePrincipal[0].appId)"
        
        # Check role assignments
        try {
            $roleAssignments = az role assignment list --assignee $servicePrincipal[0].appId --resource-group $ResourceGroupName --output json | ConvertFrom-Json
            
            $contributorRole = $roleAssignments | Where-Object { $_.roleDefinitionName -eq "Contributor" }
            if ($contributorRole) {
                Add-ValidationResult -Component "SP Permissions" -IsValid $true -Message "Contributor role assigned"
            } else {
                Add-ValidationResult -Component "SP Permissions" -IsValid $false -Message "Contributor role not found"
            }
        } catch {
            Add-ValidationResult -Component "SP Permissions" -IsValid $false -Message "Cannot check role assignments" -Details $_.Exception.Message
        }
    } else {
        Add-ValidationResult -Component "Service Principal" -IsValid $false -Message "Does not exist"
    }
} catch {
    Add-ValidationResult -Component "Service Principal" -IsValid $false -Message "Error checking service principal" -Details $_.Exception.Message
}

# ----------------------------------------------------------------------------------------------------
# Azure Developer CLI Validation
# ----------------------------------------------------------------------------------------------------

try {
    $azdVersion = azd version
    if ($azdVersion) {
        Add-ValidationResult -Component "Azure Developer CLI" -IsValid $true -Message "Installed and accessible" -Details "Version: $azdVersion"
    } else {
        Add-ValidationResult -Component "Azure Developer CLI" -IsValid $false -Message "Not installed or not accessible"
    }
} catch {
    Add-ValidationResult -Component "Azure Developer CLI" -IsValid $false -Message "Not installed or not accessible" -Details $_.Exception.Message
}

# ----------------------------------------------------------------------------------------------------
# Bicep Template Validation
# ----------------------------------------------------------------------------------------------------

$bicepMainPath = "..\infra\bicep\main.bicep"
if (Test-Path $bicepMainPath) {
    try {
        # Validate Bicep template syntax
        az bicep build --file $bicepMainPath --outfile temp-main.json | Out-Null
        Remove-Item "temp-main.json" -ErrorAction SilentlyContinue
        Add-ValidationResult -Component "Bicep Template" -IsValid $true -Message "Syntax is valid"
    } catch {
        Add-ValidationResult -Component "Bicep Template" -IsValid $false -Message "Syntax validation failed" -Details $_.Exception.Message
    }
} else {
    Add-ValidationResult -Component "Bicep Template" -IsValid $false -Message "main.bicep file not found" -Details "Expected path: $bicepMainPath"
}

# ----------------------------------------------------------------------------------------------------
# GitHub Actions Workflow Validation
# ----------------------------------------------------------------------------------------------------

$workflowPath = "..\.github\workflows\deploy.yml"
if (Test-Path $workflowPath) {
    Add-ValidationResult -Component "GitHub Workflow" -IsValid $true -Message "Deploy workflow file exists"
} else {
    Add-ValidationResult -Component "GitHub Workflow" -IsValid $false -Message "Deploy workflow file not found" -Details "Expected path: $workflowPath"
}

# ----------------------------------------------------------------------------------------------------
# Summary Report
# ----------------------------------------------------------------------------------------------------

Write-Host ""
Write-Host "📊 Validation Summary" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow

$totalChecks = $validationResults.Count
$passedChecks = ($validationResults | Where-Object { $_.IsValid }).Count
$failedChecks = $totalChecks - $passedChecks

Write-Host ""
Write-Host "Total Checks: $totalChecks" -ForegroundColor White
Write-Host "Passed: $passedChecks" -ForegroundColor Green
Write-Host "Failed: $failedChecks" -ForegroundColor Red
Write-Host ""

if ($failedChecks -eq 0) {
    Write-Host "🎉 All validations passed! Azure infrastructure is ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Configure GitHub repository secrets" -ForegroundColor White
    Write-Host "2. Run GitHub Actions workflow for deployment" -ForegroundColor White
    Write-Host "3. Use 'azd provision' for infrastructure deployment" -ForegroundColor White
} else {
    Write-Host "⚠️  Some validations failed. Please address the issues above before proceeding." -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed Components:" -ForegroundColor Yellow
    $validationResults | Where-Object { -not $_.IsValid } | ForEach-Object {
        Write-Host "- $($_.Component): $($_.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Return exit code based on validation results
if ($failedChecks -gt 0) {
    exit 1
} else {
    exit 0
}
