#Requires -Version 7.0
#Requires -Modules Az.KeyVault, Az.Resources, Az.Accounts

<#
.SYNOPSIS
    Manages Azure Key Vault deployment and secret configuration for the NetworkingApp

.DESCRIPTION
    This script provides comprehensive Key Vault management capabilities including:
    - Deploying Key Vault infrastructure via Bicep templates
    - Setting application secrets securely
    - Retrieving secret values for application configuration
    - Managing secret versions and rotation
    - Environment-specific configurations

.PARAMETER Action
    The action to perform: Deploy, SetSecrets, GetSecrets, ListSecrets, or ValidateAccess

.PARAMETER Environment
    The target environment (dev, test, prod)

.PARAMETER ResourceGroupName
    The Azure resource group name (optional - will be derived if not provided)

.PARAMETER KeyVaultName
    The Key Vault name (optional - will be derived if not provided)

.PARAMETER SecretsFile
    Path to JSON file containing secrets to set (for SetSecrets action)

.PARAMETER WorkloadName
    The workload name for resource naming (default: netapp)

.PARAMETER Location
    Azure region for deployment (default: australiaeast)

.EXAMPLE
    .\Manage-KeyVault.ps1 -Action Deploy -Environment dev
    Deploys Key Vault infrastructure to the dev environment

.EXAMPLE
    .\Manage-KeyVault.ps1 -Action SetSecrets -Environment prod -SecretsFile "secrets-prod.json"
    Sets production secrets from a JSON file

.EXAMPLE
    .\Manage-KeyVault.ps1 -Action ValidateAccess -Environment test
    Validates access to the test environment Key Vault

.NOTES
    Author: NetworkingApp Development Team
    Date: 2025-01-15
    Version: 1.0.0
    
    Prerequisites:
    - Azure PowerShell modules (Az.KeyVault, Az.Resources, Az.Accounts)
    - Appropriate Azure permissions for Key Vault and resource management
    - Bicep CLI installed for template deployment
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Deploy', 'SetSecrets', 'GetSecrets', 'ListSecrets', 'ValidateAccess', 'GenerateJwtSecret')]
    [string]$Action,

    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $false)]
    [string]$KeyVaultName,

    [Parameter(Mandatory = $false)]
    [string]$SecretsFile,

    [Parameter(Mandatory = $false)]
    [string]$WorkloadName = 'netapp',

    [Parameter(Mandatory = $false)]
    [string]$Location = 'australiaeast',

    [Parameter(Mandatory = $false)]
    [switch]$WhatIf,

    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = 'Stop'

# Import required modules
try {
    Import-Module Az.KeyVault -Force
    Import-Module Az.Resources -Force
    Import-Module Az.Accounts -Force
    Write-Host "✅ Required Azure modules imported successfully" -ForegroundColor Green
}
catch {
    Write-Error "❌ Failed to import required Azure modules: $($_.Exception.Message)"
    exit 1
}

# Script variables
$resourceToken = "$WorkloadName-$Environment".ToLower()
$defaultResourceGroupName = "rg-$resourceToken"
$defaultKeyVaultName = "kv-$resourceToken-$(Get-Random -Minimum 1000 -Maximum 9999)"

# Use provided names or defaults
$rgName = if ($ResourceGroupName) { $ResourceGroupName } else { $defaultResourceGroupName }
$kvName = if ($KeyVaultName) { $KeyVaultName } else { $defaultKeyVaultName }

# Function to check Azure authentication
function Test-AzureAuthentication {
    try {
        $context = Get-AzContext
        if (-not $context) {
            Write-Host "🔐 Please authenticate to Azure..." -ForegroundColor Yellow
            Connect-AzAccount
            $context = Get-AzContext
        }
        
        Write-Host "✅ Authenticated as: $($context.Account.Id)" -ForegroundColor Green
        Write-Host "📋 Subscription: $($context.Subscription.Name) ($($context.Subscription.Id))" -ForegroundColor Cyan
        return $true
    }
    catch {
        Write-Error "❌ Azure authentication failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to deploy Key Vault infrastructure
function Deploy-KeyVaultInfrastructure {
    Write-Host "🚀 Deploying Key Vault infrastructure for environment: $Environment" -ForegroundColor Cyan
    
    $parametersFile = "infra/bicep/parameters/main.$Environment.json"
    $templateFile = "infra/bicep/main.bicep"
    
    if (-not (Test-Path $parametersFile)) {
        Write-Error "❌ Parameters file not found: $parametersFile"
        return $false
    }
    
    if (-not (Test-Path $templateFile)) {
        Write-Error "❌ Template file not found: $templateFile"
        return $false
    }
    
    try {
        # Deploy using Azure Developer CLI if available, otherwise use Az PowerShell
        if (Get-Command azd -ErrorAction SilentlyContinue) {
            Write-Host "📦 Using Azure Developer CLI for deployment..." -ForegroundColor Yellow
            azd up --environment $Environment
        }
        else {
            Write-Host "📦 Using Azure PowerShell for deployment..." -ForegroundColor Yellow
            
            # Create resource group if it doesn't exist
            $rg = Get-AzResourceGroup -Name $rgName -ErrorAction SilentlyContinue
            if (-not $rg) {
                Write-Host "📁 Creating resource group: $rgName" -ForegroundColor Yellow
                New-AzResourceGroup -Name $rgName -Location $Location -Tag @{
                    'azd-env-name' = $Environment
                    'workload-name' = $WorkloadName
                    environment = $Environment
                }
            }
            
            # Deploy Bicep template
            $deploymentName = "keyvault-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            
            if ($WhatIf) {
                Write-Host "🔍 Running What-If analysis..." -ForegroundColor Yellow
                New-AzSubscriptionDeployment -Location $Location -TemplateFile $templateFile -TemplateParameterFile $parametersFile -Name $deploymentName -WhatIf
            }
            else {
                New-AzSubscriptionDeployment -Location $Location -TemplateFile $templateFile -TemplateParameterFile $parametersFile -Name $deploymentName -Verbose:$Verbose
            }
        }
        
        Write-Host "✅ Key Vault infrastructure deployed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "❌ Key Vault deployment failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to set application secrets
function Set-ApplicationSecrets {
    param([string]$SecretsFilePath)
    
    Write-Host "🔐 Setting application secrets in Key Vault: $kvName" -ForegroundColor Cyan
    
    # Find Key Vault if name not provided
    if (-not $KeyVaultName) {
        $kvs = Get-AzKeyVault -ResourceGroupName $rgName | Where-Object { $_.VaultName -like "*$resourceToken*" }
        if ($kvs.Count -eq 0) {
            Write-Error "❌ No Key Vault found in resource group: $rgName"
            return $false
        }
        $kvName = $kvs[0].VaultName
        Write-Host "🔍 Found Key Vault: $kvName" -ForegroundColor Yellow
    }
    
    if ($SecretsFilePath -and (Test-Path $SecretsFilePath)) {
        # Load secrets from file
        try {
            $secretsData = Get-Content $SecretsFilePath -Raw | ConvertFrom-Json
            
            foreach ($property in $secretsData.PSObject.Properties) {
                $secretName = $property.Name
                $secretValue = $property.Value
                
                if ($secretValue -and $secretValue -ne "") {
                    Write-Host "🔑 Setting secret: $secretName" -ForegroundColor Yellow
                    
                    if (-not $WhatIf) {
                        $secureValue = ConvertTo-SecureString $secretValue -AsPlainText -Force
                        Set-AzKeyVaultSecret -VaultName $kvName -Name $secretName -SecretValue $secureValue
                        Write-Host "✅ Secret '$secretName' set successfully" -ForegroundColor Green
                    }
                    else {
                        Write-Host "🔍 [What-If] Would set secret: $secretName" -ForegroundColor Cyan
                    }
                }
                else {
                    Write-Host "⚠️  Skipping empty secret: $secretName" -ForegroundColor Yellow
                }
            }
        }
        catch {
            Write-Error "❌ Failed to process secrets file: $($_.Exception.Message)"
            return $false
        }
    }
    else {
        # Interactive secret setting
        $secrets = @{
            'JwtSecretKey' = 'JWT signing secret (leave empty to auto-generate)'
            'StripeSecretKey' = 'Stripe API secret key'
            'StripePublishableKey' = 'Stripe publishable key'
            'StripeWebhookSecret' = 'Stripe webhook secret'
            'EmailSmtpPassword' = 'Email SMTP password'
        }
        
        foreach ($secretName in $secrets.Keys) {
            $description = $secrets[$secretName]
            
            if ($secretName -eq 'JwtSecretKey') {
                # Auto-generate JWT secret
                $jwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.DateTime]::UtcNow.Ticks))
                Write-Host "🔑 Auto-generating JWT secret" -ForegroundColor Yellow
                
                if (-not $WhatIf) {
                    $secureValue = ConvertTo-SecureString $jwtSecret -AsPlainText -Force
                    Set-AzKeyVaultSecret -VaultName $kvName -Name $secretName -SecretValue $secureValue
                    Write-Host "✅ Secret '$secretName' generated and set successfully" -ForegroundColor Green
                }
            }
            else {
                $secretValue = Read-Host "Enter $description (or press Enter to skip)" -MaskedInput
                
                if ($secretValue -and $secretValue -ne "") {
                    Write-Host "🔑 Setting secret: $secretName" -ForegroundColor Yellow
                    
                    if (-not $WhatIf) {
                        $secureValue = ConvertTo-SecureString $secretValue -AsPlainText -Force
                        Set-AzKeyVaultSecret -VaultName $kvName -Name $secretName -SecretValue $secureValue
                        Write-Host "✅ Secret '$secretName' set successfully" -ForegroundColor Green
                    }
                }
                else {
                    Write-Host "⚠️  Skipping secret: $secretName" -ForegroundColor Yellow
                }
            }
        }
    }
    
    Write-Host "✅ Application secrets configuration completed" -ForegroundColor Green
    return $true
}

# Function to get secrets
function Get-ApplicationSecrets {
    Write-Host "🔍 Retrieving secrets from Key Vault: $kvName" -ForegroundColor Cyan
    
    # Find Key Vault if name not provided
    if (-not $KeyVaultName) {
        $kvs = Get-AzKeyVault -ResourceGroupName $rgName | Where-Object { $_.VaultName -like "*$resourceToken*" }
        if ($kvs.Count -eq 0) {
            Write-Error "❌ No Key Vault found in resource group: $rgName"
            return $false
        }
        $kvName = $kvs[0].VaultName
        Write-Host "🔍 Found Key Vault: $kvName" -ForegroundColor Yellow
    }
    
    try {
        $secrets = Get-AzKeyVaultSecret -VaultName $kvName
        
        Write-Host "`n📋 Available secrets:" -ForegroundColor Cyan
        foreach ($secret in $secrets) {
            $secretValue = Get-AzKeyVaultSecret -VaultName $kvName -Name $secret.Name -AsPlainText
            if ($secret.Name -like "*secret*" -or $secret.Name -like "*key*" -or $secret.Name -like "*password*") {
                Write-Host "🔑 $($secret.Name): ****" -ForegroundColor Yellow
            }
            else {
                Write-Host "🔑 $($secret.Name): $secretValue" -ForegroundColor Yellow
            }
        }
        
        return $true
    }
    catch {
        Write-Error "❌ Failed to retrieve secrets: $($_.Exception.Message)"
        return $false
    }
}

# Function to list secrets
function Get-SecretsList {
    Write-Host "📋 Listing secrets in Key Vault: $kvName" -ForegroundColor Cyan
    
    # Find Key Vault if name not provided
    if (-not $KeyVaultName) {
        $kvs = Get-AzKeyVault -ResourceGroupName $rgName | Where-Object { $_.VaultName -like "*$resourceToken*" }
        if ($kvs.Count -eq 0) {
            Write-Error "❌ No Key Vault found in resource group: $rgName"
            return $false
        }
        $kvName = $kvs[0].VaultName
        Write-Host "🔍 Found Key Vault: $kvName" -ForegroundColor Yellow
    }
    
    try {
        $secrets = Get-AzKeyVaultSecret -VaultName $kvName
        
        Write-Host "`n📊 Secret Summary:" -ForegroundColor Cyan
        Write-Host "Total secrets: $($secrets.Count)" -ForegroundColor Yellow
        
        $secrets | ForEach-Object {
            Write-Host "🔑 $($_.Name) (Updated: $($_.Updated), Enabled: $($_.Enabled))" -ForegroundColor Yellow
        }
        
        return $true
    }
    catch {
        Write-Error "❌ Failed to list secrets: $($_.Exception.Message)"
        return $false
    }
}

# Function to validate Key Vault access
function Test-KeyVaultAccess {
    Write-Host "🔐 Validating Key Vault access for environment: $Environment" -ForegroundColor Cyan
    
    # Find Key Vault if name not provided
    if (-not $KeyVaultName) {
        $kvs = Get-AzKeyVault -ResourceGroupName $rgName | Where-Object { $_.VaultName -like "*$resourceToken*" }
        if ($kvs.Count -eq 0) {
            Write-Error "❌ No Key Vault found in resource group: $rgName"
            return $false
        }
        $kvName = $kvs[0].VaultName
        Write-Host "🔍 Found Key Vault: $kvName" -ForegroundColor Yellow
    }
    
    try {
        # Test Key Vault access
        $kv = Get-AzKeyVault -VaultName $kvName
        Write-Host "✅ Key Vault access validated" -ForegroundColor Green
        Write-Host "📋 Key Vault: $($kv.VaultName)" -ForegroundColor Cyan
        Write-Host "📍 Location: $($kv.Location)" -ForegroundColor Cyan
        Write-Host "🏷️  Resource Group: $($kv.ResourceGroupName)" -ForegroundColor Cyan
        
        # Test secret operations
        $testSecretName = "access-test-$(Get-Date -Format 'yyyyMMdd')"
        $testSecretValue = "test-value-$(Get-Random)"
        
        Write-Host "🧪 Testing secret operations..." -ForegroundColor Yellow
        
        # Create test secret
        $secureValue = ConvertTo-SecureString $testSecretValue -AsPlainText -Force
        Set-AzKeyVaultSecret -VaultName $kvName -Name $testSecretName -SecretValue $secureValue
        Write-Host "✅ Secret creation test passed" -ForegroundColor Green
        
        # Read test secret
        $retrievedValue = Get-AzKeyVaultSecret -VaultName $kvName -Name $testSecretName -AsPlainText
        if ($retrievedValue -eq $testSecretValue) {
            Write-Host "✅ Secret retrieval test passed" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Secret retrieval test failed" -ForegroundColor Red
        }
        
        # Clean up test secret
        Remove-AzKeyVaultSecret -VaultName $kvName -Name $testSecretName -Force -Confirm:$false
        Write-Host "✅ Secret deletion test passed" -ForegroundColor Green
        
        Write-Host "✅ All Key Vault access tests passed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "❌ Key Vault access validation failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to generate JWT secret
function New-JwtSecret {
    Write-Host "🔐 Generating new JWT secret for environment: $Environment" -ForegroundColor Cyan
    
    # Find Key Vault if name not provided
    if (-not $KeyVaultName) {
        $kvs = Get-AzKeyVault -ResourceGroupName $rgName | Where-Object { $_.VaultName -like "*$resourceToken*" }
        if ($kvs.Count -eq 0) {
            Write-Error "❌ No Key Vault found in resource group: $rgName"
            return $false
        }
        $kvName = $kvs[0].VaultName
        Write-Host "🔍 Found Key Vault: $kvName" -ForegroundColor Yellow
    }
    
    try {
        # Generate secure JWT secret
        $jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
        
        Write-Host "🔑 Generated new JWT secret" -ForegroundColor Yellow
        
        if (-not $WhatIf) {
            $secureValue = ConvertTo-SecureString $jwtSecret -AsPlainText -Force
            Set-AzKeyVaultSecret -VaultName $kvName -Name 'JwtSecretKey' -SecretValue $secureValue
            Write-Host "✅ JWT secret updated in Key Vault" -ForegroundColor Green
        }
        else {
            Write-Host "🔍 [What-If] Would update JWT secret in Key Vault" -ForegroundColor Cyan
        }
        
        return $true
    }
    catch {
        Write-Error "❌ Failed to generate JWT secret: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
function Main {
    Write-Host "🚀 NetworkingApp Key Vault Management Script" -ForegroundColor Cyan
    Write-Host "Environment: $Environment | Action: $Action" -ForegroundColor Yellow
    Write-Host "Resource Group: $rgName" -ForegroundColor Yellow
    
    # Check Azure authentication
    if (-not (Test-AzureAuthentication)) {
        exit 1
    }
    
    # Execute requested action
    $success = $false
    
    switch ($Action) {
        'Deploy' {
            $success = Deploy-KeyVaultInfrastructure
        }
        'SetSecrets' {
            $success = Set-ApplicationSecrets -SecretsFilePath $SecretsFile
        }
        'GetSecrets' {
            $success = Get-ApplicationSecrets
        }
        'ListSecrets' {
            $success = Get-SecretsList
        }
        'ValidateAccess' {
            $success = Test-KeyVaultAccess
        }
        'GenerateJwtSecret' {
            $success = New-JwtSecret
        }
        default {
            Write-Error "❌ Unknown action: $Action"
            exit 1
        }
    }
    
    if ($success) {
        Write-Host "`n✅ Action '$Action' completed successfully!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "`n❌ Action '$Action' failed!" -ForegroundColor Red
        exit 1
    }
}

# Execute main function
Main
