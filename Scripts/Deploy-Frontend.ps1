#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Frontend Assets to Azure CDN and Storage Account
.DESCRIPTION
    This script builds the React frontend and deploys static assets to Azure Storage 
    with CDN optimization for the Flight Companion platform.
.PARAMETER Environment
    The target environment (dev, test, prod)
.PARAMETER ResourceGroupName
    The Azure resource group name
.PARAMETER StorageAccountName
    The Azure storage account name for static assets
.PARAMETER CdnProfileName
    The Azure CDN profile name
.PARAMETER CdnEndpointName
    The Azure CDN endpoint name for static assets
.EXAMPLE
    .\Deploy-Frontend.ps1 -Environment "dev" -ResourceGroupName "rg-flightcompanion-dev" -StorageAccountName "stflightcompaniondev"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$StorageAccountName,
    
    [Parameter(Mandatory = $false)]
    [string]$CdnProfileName,
    
    [Parameter(Mandatory = $false)]
    [string]$CdnEndpointName,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory = $false)]
    [switch]$PurgeCdn,
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# Set error handling
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Script configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir ".." "frontend"
$BuildDir = Join-Path $FrontendDir "build"

# Default resource names based on environment
if (-not $ResourceGroupName) {
    $ResourceGroupName = "rg-flightcompanion-$Environment"
}
if (-not $StorageAccountName) {
    $StorageAccountName = "stflightcompanion$Environment"
}
if (-not $CdnProfileName) {
    $CdnProfileName = "cdn-flightcompanion-$Environment"
}
if (-not $CdnEndpointName) {
    $CdnEndpointName = "flightcompanion-$Environment-static"
}

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "SUCCESS" { "Green" }
            default { "White" }
        }
    )
}

function Test-Prerequisites {
    Write-LogMessage "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    try {
        $azVersion = az version --output json | ConvertFrom-Json
        Write-LogMessage "Azure CLI version: $($azVersion.'azure-cli')" "SUCCESS"
    }
    catch {
        Write-LogMessage "Azure CLI is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    # Check if logged into Azure
    try {
        $account = az account show --output json | ConvertFrom-Json
        Write-LogMessage "Logged into Azure as: $($account.user.name)" "SUCCESS"
    }
    catch {
        Write-LogMessage "Not logged into Azure. Please run 'az login'" "ERROR"
        exit 1
    }
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-LogMessage "Node.js version: $nodeVersion" "SUCCESS"
    }
    catch {
        Write-LogMessage "Node.js is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    # Check if frontend directory exists
    if (-not (Test-Path $FrontendDir)) {
        Write-LogMessage "Frontend directory not found: $FrontendDir" "ERROR"
        exit 1
    }
}

function Get-CdnUrls {
    Write-LogMessage "Retrieving CDN URLs..."
    
    try {
        # Get CDN endpoints
        $cdnEndpoints = az cdn endpoint list --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        $staticEndpoint = $cdnEndpoints | Where-Object { $_.name -eq $CdnEndpointName }
        $appEndpoint = $cdnEndpoints | Where-Object { $_.name -eq "flightcompanion-$Environment-app" }
        
        if (-not $staticEndpoint) {
            Write-LogMessage "Static assets CDN endpoint not found: $CdnEndpointName" "ERROR"
            exit 1
        }
        
        if (-not $appEndpoint) {
            Write-LogMessage "App CDN endpoint not found" "ERROR"
            exit 1
        }
        
        $staticUrl = "https://$($staticEndpoint.hostName)/"
        $appUrl = "https://$($appEndpoint.hostName)/"
        
        Write-LogMessage "Static assets CDN URL: $staticUrl" "SUCCESS"
        Write-LogMessage "App CDN URL: $appUrl" "SUCCESS"
        
        return @{
            StaticUrl = $staticUrl
            AppUrl = $appUrl
        }
    }
    catch {
        Write-LogMessage "Failed to retrieve CDN URLs: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

function Build-Frontend {
    param($CdnUrls)
    
    if ($SkipBuild) {
        Write-LogMessage "Skipping frontend build as requested"
        return
    }
    
    Write-LogMessage "Building frontend for $Environment environment..."
    
    Push-Location $FrontendDir
    try {
        # Install dependencies if node_modules doesn't exist
        if (-not (Test-Path "node_modules")) {
            Write-LogMessage "Installing npm dependencies..."
            npm ci
        }
        
        # Create environment-specific .env file
        $envContent = @"
VITE_CDN_BASE_URL=$($CdnUrls.AppUrl)
VITE_CDN_STATIC_ASSETS_URL=$($CdnUrls.StaticUrl)
VITE_CDN_APP_URL=$($CdnUrls.AppUrl)
VITE_API_BASE_URL=https://flightcompanion-$Environment-app.azurewebsites.net
VITE_ENVIRONMENT=$Environment
VITE_ENABLE_ANALYTICS=$($Environment -eq 'prod')
VITE_ENABLE_DEBUG=$($Environment -ne 'prod')
VITE_ENABLE_MOCK_DATA=$($Environment -eq 'dev')
"@
        
        $envContent | Out-File ".env.local" -Encoding UTF8
        Write-LogMessage "Created .env.local with CDN configuration"
        
        # Build the application
        Write-LogMessage "Running production build..."
        $env:NODE_ENV = "production"
        npm run build
        
        if (-not (Test-Path $BuildDir)) {
            Write-LogMessage "Build directory not found after build" "ERROR"
            exit 1
        }
        
        Write-LogMessage "Frontend build completed successfully" "SUCCESS"
    }
    catch {
        Write-LogMessage "Frontend build failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Deploy-StaticAssets {
    Write-LogMessage "Deploying static assets to Azure Storage..."
    
    if ($WhatIf) {
        Write-LogMessage "What-If: Would upload files from $BuildDir to storage account $StorageAccountName" "INFO"
        return
    }
    
    try {
        # Upload all files to the static assets container
        Write-LogMessage "Uploading files to storage account..."
        az storage blob upload-batch `
            --destination '$web' `
            --source $BuildDir `
            --account-name $StorageAccountName `
            --overwrite true `
            --content-encoding gzip `
            --pattern "*.js" `
            --content-type "application/javascript"
        
        az storage blob upload-batch `
            --destination '$web' `
            --source $BuildDir `
            --account-name $StorageAccountName `
            --overwrite true `
            --content-encoding gzip `
            --pattern "*.css" `
            --content-type "text/css"
        
        az storage blob upload-batch `
            --destination '$web' `
            --source $BuildDir `
            --account-name $StorageAccountName `
            --overwrite true `
            --pattern "*.html" `
            --content-type "text/html"
        
        # Upload remaining files without compression
        az storage blob upload-batch `
            --destination '$web' `
            --source $BuildDir `
            --account-name $StorageAccountName `
            --overwrite true
        
        Write-LogMessage "Static assets uploaded successfully" "SUCCESS"
    }
    catch {
        Write-LogMessage "Failed to upload static assets: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

function Purge-CdnCache {
    if (-not $PurgeCdn) {
        Write-LogMessage "Skipping CDN cache purge"
        return
    }
    
    Write-LogMessage "Purging CDN cache..."
    
    if ($WhatIf) {
        Write-LogMessage "What-If: Would purge CDN cache for endpoints" "INFO"
        return
    }
    
    try {
        # Purge static assets endpoint
        az cdn endpoint purge `
            --resource-group $ResourceGroupName `
            --name $CdnEndpointName `
            --profile-name $CdnProfileName `
            --content-paths "/*"
        
        # Purge app endpoint
        az cdn endpoint purge `
            --resource-group $ResourceGroupName `
            --name "flightcompanion-$Environment-app" `
            --profile-name $CdnProfileName `
            --content-paths "/*"
        
        Write-LogMessage "CDN cache purged successfully" "SUCCESS"
    }
    catch {
        Write-LogMessage "Failed to purge CDN cache: $($_.Exception.Message)" "WARN"
    }
}

function Main {
    Write-LogMessage "Starting frontend deployment for $Environment environment..."
    Write-LogMessage "Target Resource Group: $ResourceGroupName"
    Write-LogMessage "Target Storage Account: $StorageAccountName"
    Write-LogMessage "Target CDN Profile: $CdnProfileName"
    
    if ($WhatIf) {
        Write-LogMessage "Running in What-If mode - no changes will be made" "WARN"
    }
    
    Test-Prerequisites
    $cdnUrls = Get-CdnUrls
    Build-Frontend -CdnUrls $cdnUrls
    Deploy-StaticAssets
    Purge-CdnCache
    
    Write-LogMessage "Frontend deployment completed successfully!" "SUCCESS"
    Write-LogMessage "Static assets available at: $($cdnUrls.StaticUrl)" "INFO"
    Write-LogMessage "Application available at: $($cdnUrls.AppUrl)" "INFO"
}

# Execute main function
Main
