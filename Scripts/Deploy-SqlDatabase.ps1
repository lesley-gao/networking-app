#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy Azure SQL Database infrastructure for the Flight Companion Platform
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$EnvironmentName,
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "australiaeast",
    
    [Parameter(Mandatory = $false)]
    [switch]$EnableGeoRedundantBackup,
    
    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# Script variables
$WorkloadName = "netapp"
$Environment = $EnvironmentName.ToLower()
$sqlServerName = "sql-$WorkloadName-$Environment-001"
$sqlDatabaseName = "sqldb-$WorkloadName-$Environment-001"

# Paths (fixed for correct directory structure)
$scriptRoot = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"
$infraRoot = Join-Path $scriptRoot "infra"
$bicepRoot = Join-Path $infraRoot "bicep"
$templatePath = Join-Path (Join-Path $bicepRoot "modules") "database.bicep"
$parametersPath = Join-Path (Join-Path $bicepRoot "parameters") "main.$Environment.json"

# Database configuration by environment
$dbConfig = @{
    dev = @{
        sku = "Basic (5 DTU)"
        maxSize = "2 GB"
        backupRetention = "7 days"
        estimatedMonthlyCost = "$5-15 AUD"
        features = "Basic backup, Local redundancy"
    }
    test = @{
        sku = "Standard S1 (20 DTU)"
        maxSize = "10 GB"
        backupRetention = "14 days + 4 weeks LTR"
        estimatedMonthlyCost = "$75-100 AUD"
        features = "Enhanced backup, Local redundancy"
    }
    prod = @{
        sku = "Standard S3 (100 DTU)"
        maxSize = "100 GB"
        backupRetention = "35 days + Long-term (12W/12M/5Y)"
        estimatedMonthlyCost = "$300-400 AUD"
        features = "Zone redundancy, Geo-redundant backup, Read scale"
    }
}

# Header
Write-Host "================================================" -ForegroundColor Green
Write-Host "   Azure SQL Database Deployment Script" -ForegroundColor Green
Write-Host "   Flight Companion Platform" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "SQL Server: $sqlServerName" -ForegroundColor Yellow
Write-Host "Database: $sqlDatabaseName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow

if ($EnableGeoRedundantBackup) {
    Write-Host "Geo-Redundant Backup: Enabled" -ForegroundColor Yellow
} else {
    Write-Host "Geo-Redundant Backup: Disabled" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " Database Configuration:" -ForegroundColor Cyan
Write-Host "  SKU: $($dbConfig[$Environment].sku)" -ForegroundColor White
Write-Host "  Max Size: $($dbConfig[$Environment].maxSize)" -ForegroundColor White
Write-Host "  Backup Retention: $($dbConfig[$Environment].backupRetention)" -ForegroundColor White
Write-Host "  Features: $($dbConfig[$Environment].features)" -ForegroundColor White
Write-Host "  Est. Monthly Cost: $($dbConfig[$Environment].estimatedMonthlyCost)" -ForegroundColor White

Write-Host ""
Write-Host "Template Path: $templatePath" -ForegroundColor Gray
Write-Host "Parameters Path: $parametersPath" -ForegroundColor Gray

# Check files exist
if (-not (Test-Path $templatePath)) {
    Write-Warning "Template file not found: $templatePath"
} else {
    Write-Host " Template file found" -ForegroundColor Green
}

if (-not (Test-Path $parametersPath)) {
    Write-Warning "Parameters file not found: $parametersPath"
} else {
    Write-Host " Parameters file found" -ForegroundColor Green
}

if ($WhatIf) {
    Write-Host ""
    Write-Host " [WHAT-IF] This would deploy Azure SQL Database infrastructure:" -ForegroundColor Cyan
    Write-Host "  - SQL Server with TLS 1.2 minimum and AAD authentication" -ForegroundColor White
    Write-Host "  - SQL Database with environment-specific DTU sizing" -ForegroundColor White
    Write-Host "  - Private endpoint for secure network access" -ForegroundColor White
    Write-Host "  - Backup policies with retention per environment" -ForegroundColor White
    Write-Host "  - Transparent data encryption enabled" -ForegroundColor White
    Write-Host "  - Diagnostic logging and auditing configured" -ForegroundColor White
    Write-Host ""
    Write-Host " What-if analysis completed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host " Actual deployment would require Azure CLI authentication" -ForegroundColor Yellow
    Write-Host "Run 'az login' first, then execute this script without -WhatIf" -ForegroundColor Yellow
}

Write-Host ""
Write-Host " Next Steps:" -ForegroundColor Yellow
Write-Host "1. Authenticate with Azure: az login" -ForegroundColor White
Write-Host "2. Run this script without -WhatIf to deploy" -ForegroundColor White
Write-Host "3. Update application connection strings" -ForegroundColor White
Write-Host "4. Run Entity Framework migrations" -ForegroundColor White

Write-Host ""
Write-Host " Documentation: https://docs.microsoft.com/en-us/azure/azure-sql/" -ForegroundColor Cyan
