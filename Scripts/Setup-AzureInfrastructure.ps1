# ----------------------------------------------------------------------------------------------------
# Setup-AzureInfrastructure.ps1
# Script to create Azure Resource Group and configure service principal for GitHub Actions deployment
# Part of TASK-083: Create Azure Resource Group and configure service principal for GitHub Actions deployment
# ----------------------------------------------------------------------------------------------------

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$Location = "australiaeast",
    
    [Parameter(Mandatory = $true)]
    [string]$ServicePrincipalName,
    
    [Parameter(Mandatory = $false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# ----------------------------------------------------------------------------------------------------
# Configuration and Validation
# ----------------------------------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

# Validate Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
}
catch {
    Write-Error "❌ Azure CLI is not installed or not accessible. Please install Azure CLI first."
    exit 1
}

# Set the subscription context
Write-Host "🔧 Setting Azure subscription context..." -ForegroundColor Yellow
try {
    az account set --subscription $SubscriptionId
    $currentSub = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Using subscription: $($currentSub.name) ($($currentSub.id))" -ForegroundColor Green
}
catch {
    Write-Error "❌ Failed to set subscription context. Please check your subscription ID and permissions."
    exit 1
}

# ----------------------------------------------------------------------------------------------------
# Create Resource Group
# ----------------------------------------------------------------------------------------------------

Write-Host "🏗️ Creating Azure Resource Group..." -ForegroundColor Yellow

$resourceGroupExists = az group exists --name $ResourceGroupName --output tsv
if ($resourceGroupExists -eq "true") {
    Write-Host "✅ Resource Group '$ResourceGroupName' already exists" -ForegroundColor Green
} else {
    if ($WhatIf) {
        Write-Host "🔍 [WHAT-IF] Would create Resource Group: $ResourceGroupName in $Location" -ForegroundColor Cyan
    } else {
        try {
            az group create --name $ResourceGroupName --location $Location --tags Environment=$Environment Project="NetworkingApp"
            Write-Host "✅ Resource Group '$ResourceGroupName' created successfully" -ForegroundColor Green
        }
        catch {
            Write-Error "❌ Failed to create Resource Group: $_"
            exit 1
        }
    }
}

# ----------------------------------------------------------------------------------------------------
# Create Service Principal for GitHub Actions
# ----------------------------------------------------------------------------------------------------

Write-Host "🔐 Creating Service Principal for GitHub Actions..." -ForegroundColor Yellow

# Check if service principal already exists
$existingSp = az ad sp list --display-name $ServicePrincipalName --query "[].{appId:appId,displayName:displayName}" --output json | ConvertFrom-Json

if ($existingSp -and $existingSp.Count -gt 0) {
    Write-Host "✅ Service Principal '$ServicePrincipalName' already exists with App ID: $($existingSp[0].appId)" -ForegroundColor Green
    $appId = $existingSp[0].appId
} else {
    if ($WhatIf) {
        Write-Host "🔍 [WHAT-IF] Would create Service Principal: $ServicePrincipalName" -ForegroundColor Cyan
        $appId = "mock-app-id-for-whatif"
    } else {
        try {
            # Create service principal with Contributor role scoped to the resource group
            $spCreation = az ad sp create-for-rbac --name $ServicePrincipalName --role Contributor --scopes "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName" --output json | ConvertFrom-Json
            
            $appId = $spCreation.appId
            $password = $spCreation.password
            $tenant = $spCreation.tenant
            
            Write-Host "✅ Service Principal created successfully!" -ForegroundColor Green
            Write-Host "📋 App ID: $appId" -ForegroundColor White
            Write-Host "🔑 Tenant ID: $tenant" -ForegroundColor White
            Write-Host "⚠️  Client Secret: [HIDDEN - Copy from output below]" -ForegroundColor Yellow
        }
        catch {
            Write-Error "❌ Failed to create Service Principal: $_"
            exit 1
        }
    }
}

# ----------------------------------------------------------------------------------------------------
# Additional Azure Permissions Setup
# ----------------------------------------------------------------------------------------------------

Write-Host "🔧 Configuring additional permissions..." -ForegroundColor Yellow

if (-not $WhatIf) {
    try {
        # Grant additional permissions needed for Azure App Service and Key Vault operations
        az role assignment create --assignee $appId --role "Key Vault Contributor" --scope "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName" --output none
        az role assignment create --assignee $appId --role "Web Plan Contributor" --scope "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName" --output none
        az role assignment create --assignee $appId --role "Website Contributor" --scope "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName" --output none
        
        Write-Host "✅ Additional permissions configured" -ForegroundColor Green
    }
    catch {
        Write-Warning "⚠️  Some additional permissions may not have been set. This might be OK depending on your subscription permissions."
    }
}

# ----------------------------------------------------------------------------------------------------
# Generate GitHub Secrets Configuration
# ----------------------------------------------------------------------------------------------------

Write-Host "📝 Generating GitHub Secrets configuration..." -ForegroundColor Yellow

$githubSecretsTemplate = @"
# ----------------------------------------------------------------------------------------------------
# GitHub Repository Secrets Configuration
# Add these secrets to your GitHub repository: Settings -> Secrets and variables -> Actions
# ----------------------------------------------------------------------------------------------------

AZURE_CLIENT_ID: $appId
AZURE_TENANT_ID: $tenant
AZURE_SUBSCRIPTION_ID: $SubscriptionId
AZURE_RESOURCE_GROUP: $ResourceGroupName

# Important: The AZURE_CLIENT_SECRET should be copied from the service principal creation output above
# AZURE_CLIENT_SECRET: [COPY FROM SERVICE PRINCIPAL CREATION OUTPUT]

# ----------------------------------------------------------------------------------------------------
# Azure Developer CLI Environment Variables (for azd)
# ----------------------------------------------------------------------------------------------------

AZURE_ENV_NAME: $Environment
AZURE_LOCATION: $Location
AZURE_SUBSCRIPTION_ID: $SubscriptionId

"@

$outputPath = ".\GitHub-Secrets-Configuration.txt"
$githubSecretsTemplate | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "✅ GitHub Secrets configuration saved to: $outputPath" -ForegroundColor Green

# ----------------------------------------------------------------------------------------------------
# Summary and Next Steps
# ----------------------------------------------------------------------------------------------------

Write-Host ""
Write-Host "🎉 TASK-083 Setup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "✅ Service Principal: $ServicePrincipalName" -ForegroundColor White
Write-Host "✅ Location: $Location" -ForegroundColor White
Write-Host "✅ Environment: $Environment" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy the service principal credentials from the output above" -ForegroundColor White
Write-Host "2. Add the GitHub Secrets listed in $outputPath to your repository" -ForegroundColor White
Write-Host "3. Run the GitHub Actions workflow to deploy to Azure" -ForegroundColor White
Write-Host "4. Use 'azd provision' for infrastructure deployment" -ForegroundColor White
Write-Host ""

if (-not $WhatIf -and $existingSp.Count -eq 0) {
    Write-Host "🔑 Service Principal Credentials (COPY THESE NOW):" -ForegroundColor Red
    Write-Host "=================================================" -ForegroundColor Red
    Write-Host "AZURE_CLIENT_ID: $appId" -ForegroundColor White
    Write-Host "AZURE_TENANT_ID: $tenant" -ForegroundColor White
    Write-Host "AZURE_CLIENT_SECRET: $password" -ForegroundColor White
    Write-Host "=================================================" -ForegroundColor Red
    Write-Host ""
}

Write-Host "🔗 Documentation: https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/" -ForegroundColor Cyan
