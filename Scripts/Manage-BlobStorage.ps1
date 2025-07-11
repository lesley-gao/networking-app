# Azure Blob Storage Management Script for Verification Documents
# This script provides comprehensive management capabilities for the blob storage infrastructure

param(
    [Parameter(HelpMessage="The operation to perform: deploy, test, validate, cleanup, monitor")]
    [ValidateSet("deploy", "test", "validate", "cleanup", "monitor", "backup")]
    [string]$Operation = "deploy",
    
    [Parameter(HelpMessage="The environment to target: dev, test, prod")]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(HelpMessage="The Azure resource group name")]
    [string]$ResourceGroupName,
    
    [Parameter(HelpMessage="The storage account name")]
    [string]$StorageAccountName,
    
    [Parameter(HelpMessage="Force operation without confirmation")]
    [switch]$Force
)

# Script configuration
$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

# Import required modules
Import-Module Az.Storage -Force -ErrorAction SilentlyContinue
Import-Module Az.Resources -Force -ErrorAction SilentlyContinue
Import-Module Az.KeyVault -Force -ErrorAction SilentlyContinue

# Configuration based on environment
$config = @{
    dev = @{
        containerRetentionDays = 7
        enableVersioning = $false
        enableChangeFeed = $false
        replicationSku = "Standard_LRS"
        accessTier = "Hot"
        allowedIPs = @("0.0.0.0/0")  # Allow all for development
    }
    test = @{
        containerRetentionDays = 30
        enableVersioning = $true
        enableChangeFeed = $true
        replicationSku = "Standard_ZRS"
        accessTier = "Hot"
        allowedIPs = @("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")
    }
    prod = @{
        containerRetentionDays = 90
        enableVersioning = $true
        enableChangeFeed = $true
        replicationSku = "Standard_GRS"
        accessTier = "Hot"
        allowedIPs = @()  # Restrict to specific IPs in production
    }
}

function Write-Status {
    param([string]$Message, [string]$Status = "Info")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Status) {
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
        default { "White" }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Test-AzureConnection {
    Write-Status "Testing Azure connection..."
    try {
        $context = Get-AzContext
        if (-not $context) {
            Write-Status "Not logged into Azure. Please run 'Connect-AzAccount'" -Status "Error"
            return $false
        }
        Write-Status "Connected to Azure as $($context.Account.Id) in subscription $($context.Subscription.Name)" -Status "Success"
        return $true
    }
    catch {
        Write-Status "Error checking Azure connection: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

function Deploy-BlobStorage {
    Write-Status "Deploying blob storage infrastructure for environment: $Environment"
    
    if (-not $ResourceGroupName) {
        $ResourceGroupName = "rg-networking-app-$Environment"
    }
    
    if (-not $StorageAccountName) {
        $StorageAccountName = "stnetworkingapp$Environment$(Get-Random -Maximum 9999)"
    }
    
    try {
        # Get resource group
        $resourceGroup = Get-AzResourceGroup -Name $ResourceGroupName -ErrorAction SilentlyContinue
        if (-not $resourceGroup) {
            Write-Status "Resource group $ResourceGroupName not found" -Status "Error"
            return $false
        }
        
        # Check if storage account exists
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName -ErrorAction SilentlyContinue
        
        if (-not $storageAccount) {
            Write-Status "Creating storage account: $StorageAccountName"
            $currentConfig = $config[$Environment]
            
            $storageAccount = New-AzStorageAccount `
                -ResourceGroupName $ResourceGroupName `
                -Name $StorageAccountName `
                -Location $resourceGroup.Location `
                -SkuName $currentConfig.replicationSku `
                -Kind "StorageV2" `
                -AccessTier $currentConfig.accessTier `
                -EnableHttpsTrafficOnly $true `
                -AllowBlobPublicAccess $false `
                -MinimumTlsVersion "TLS1_2" `
                -EnableVersioning:$currentConfig.enableVersioning
            
            Write-Status "Storage account created successfully" -Status "Success"
        }
        else {
            Write-Status "Storage account already exists: $StorageAccountName"
        }
        
        # Get storage context
        $ctx = $storageAccount.Context
        
        # Create containers
        $containers = @("verification-documents", "quarantine")
        foreach ($containerName in $containers) {
            $container = Get-AzStorageContainer -Name $containerName -Context $ctx -ErrorAction SilentlyContinue
            if (-not $container) {
                Write-Status "Creating container: $containerName"
                New-AzStorageContainer -Name $containerName -Context $ctx -Permission Off
                Write-Status "Container created: $containerName" -Status "Success"
            }
            else {
                Write-Status "Container already exists: $containerName"
            }
        }
        
        # Configure blob service properties
        Write-Status "Configuring blob service properties..."
        $currentConfig = $config[$Environment]
        
        # Set delete retention policy
        Set-AzStorageBlobServiceProperty `
            -Context $ctx `
            -DeleteRetentionPolicyEnabled $true `
            -DeleteRetentionPolicyDays $currentConfig.containerRetentionDays `
            -IsVersioningEnabled:$currentConfig.enableVersioning `
            -ChangeFeedEnabled:$currentConfig.enableChangeFeed
        
        Write-Status "Blob storage deployment completed successfully" -Status "Success"
        return $true
    }
    catch {
        Write-Status "Error deploying blob storage: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

function Test-BlobStorageAccess {
    Write-Status "Testing blob storage access and functionality..."
    
    try {
        # Test upload functionality
        $testFileName = "test-upload-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
        $testContent = "This is a test file uploaded at $(Get-Date)"
        $tempFile = [System.IO.Path]::GetTempFileName()
        
        Set-Content -Path $tempFile -Value $testContent
        
        # Get storage context
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName
        $ctx = $storageAccount.Context
        
        # Test upload
        Write-Status "Testing file upload..."
        $blob = Set-AzStorageBlobContent `
            -File $tempFile `
            -Container "verification-documents" `
            -Blob $testFileName `
            -Context $ctx
        
        Write-Status "Upload test successful" -Status "Success"
        
        # Test download
        Write-Status "Testing file download..."
        $downloadPath = [System.IO.Path]::GetTempFileName()
        Get-AzStorageBlobContent `
            -Container "verification-documents" `
            -Blob $testFileName `
            -Destination $downloadPath `
            -Context $ctx
        
        $downloadedContent = Get-Content -Path $downloadPath
        if ($downloadedContent -eq $testContent) {
            Write-Status "Download test successful" -Status "Success"
        }
        else {
            Write-Status "Download test failed - content mismatch" -Status "Error"
            return $false
        }
        
        # Test delete
        Write-Status "Testing file deletion..."
        Remove-AzStorageBlob `
            -Container "verification-documents" `
            -Blob $testFileName `
            -Context $ctx
        
        Write-Status "Delete test successful" -Status "Success"
        
        # Cleanup temp files
        Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $downloadPath -Force -ErrorAction SilentlyContinue
        
        Write-Status "All blob storage tests passed" -Status "Success"
        return $true
    }
    catch {
        Write-Status "Error testing blob storage: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

function Validate-BlobStorageConfiguration {
    Write-Status "Validating blob storage configuration..."
    
    try {
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName
        $issues = @()
        
        # Check security settings
        if ($storageAccount.AllowBlobPublicAccess) {
            $issues += "Public blob access is enabled (security risk)"
        }
        
        if ($storageAccount.EnableHttpsTrafficOnly -eq $false) {
            $issues += "HTTPS-only traffic is not enforced"
        }
        
        if ($storageAccount.MinimumTlsVersion -ne "TLS1_2") {
            $issues += "Minimum TLS version is not 1.2"
        }
        
        # Check containers
        $ctx = $storageAccount.Context
        $requiredContainers = @("verification-documents", "quarantine")
        
        foreach ($containerName in $requiredContainers) {
            $container = Get-AzStorageContainer -Name $containerName -Context $ctx -ErrorAction SilentlyContinue
            if (-not $container) {
                $issues += "Required container '$containerName' is missing"
            }
            elseif ($container.PublicAccess -ne "Off") {
                $issues += "Container '$containerName' has public access enabled"
            }
        }
        
        # Check blob service properties
        $blobServiceProperties = Get-AzStorageBlobServiceProperty -Context $ctx
        $currentConfig = $config[$Environment]
        
        if (-not $blobServiceProperties.DeleteRetentionPolicy.Enabled) {
            $issues += "Delete retention policy is not enabled"
        }
        
        if ($currentConfig.enableVersioning -and -not $blobServiceProperties.IsVersioningEnabled) {
            $issues += "Versioning should be enabled for $Environment environment"
        }
        
        # Report results
        if ($issues.Count -eq 0) {
            Write-Status "Blob storage configuration validation passed" -Status "Success"
            return $true
        }
        else {
            Write-Status "Blob storage configuration validation failed:" -Status "Warning"
            foreach ($issue in $issues) {
                Write-Status "  - $issue" -Status "Warning"
            }
            return $false
        }
    }
    catch {
        Write-Status "Error validating blob storage configuration: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

function Monitor-BlobStorageMetrics {
    Write-Status "Monitoring blob storage metrics..."
    
    try {
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName
        $ctx = $storageAccount.Context
        
        # Get container statistics
        $containers = Get-AzStorageContainer -Context $ctx
        foreach ($container in $containers) {
            $blobs = Get-AzStorageBlob -Container $container.Name -Context $ctx
            $totalSize = ($blobs | Measure-Object -Property Length -Sum).Sum
            $blobCount = $blobs.Count
            
            Write-Status "Container: $($container.Name)"
            Write-Status "  - Blob count: $blobCount"
            Write-Status "  - Total size: $([math]::Round($totalSize / 1MB, 2)) MB"
            Write-Status "  - Last modified: $($container.LastModified)"
        }
        
        # Check storage account metrics
        Write-Status "Storage Account Metrics:"
        Write-Status "  - Primary location: $($storageAccount.PrimaryLocation)"
        Write-Status "  - Replication: $($storageAccount.Sku.Name)"
        Write-Status "  - Access tier: $($storageAccount.AccessTier)"
        Write-Status "  - Creation time: $($storageAccount.CreationTime)"
        
        return $true
    }
    catch {
        Write-Status "Error monitoring blob storage: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

function Cleanup-BlobStorage {
    Write-Status "Cleaning up blob storage resources..."
    
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to delete the storage account '$StorageAccountName'? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Status "Cleanup cancelled by user"
            return $false
        }
    }
    
    try {
        Remove-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName -Force
        Write-Status "Storage account deleted successfully" -Status "Success"
        return $true
    }
    catch {
        Write-Status "Error cleaning up blob storage: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

function Backup-BlobStorageData {
    Write-Status "Backing up blob storage data..."
    
    try {
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName
        $ctx = $storageAccount.Context
        
        $backupFolder = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $backupFolder -Force
        
        $containers = @("verification-documents", "quarantine")
        foreach ($containerName in $containers) {
            $containerBackupPath = Join-Path $backupFolder $containerName
            New-Item -ItemType Directory -Path $containerBackupPath -Force
            
            $blobs = Get-AzStorageBlob -Container $containerName -Context $ctx
            foreach ($blob in $blobs) {
                $blobPath = Join-Path $containerBackupPath $blob.Name
                $blobDir = Split-Path $blobPath -Parent
                if (-not (Test-Path $blobDir)) {
                    New-Item -ItemType Directory -Path $blobDir -Force
                }
                
                Get-AzStorageBlobContent `
                    -Container $containerName `
                    -Blob $blob.Name `
                    -Destination $blobPath `
                    -Context $ctx
            }
            
            Write-Status "Backed up container: $containerName ($($blobs.Count) blobs)"
        }
        
        Write-Status "Backup completed successfully in folder: $backupFolder" -Status "Success"
        return $true
    }
    catch {
        Write-Status "Error backing up blob storage: $($_.Exception.Message)" -Status "Error"
        return $false
    }
}

# Main execution
function Main {
    Write-Status "Starting Azure Blob Storage Management Script"
    Write-Status "Operation: $Operation, Environment: $Environment"
    
    if (-not (Test-AzureConnection)) {
        exit 1
    }
    
    $success = switch ($Operation) {
        "deploy" { Deploy-BlobStorage }
        "test" { Test-BlobStorageAccess }
        "validate" { Validate-BlobStorageConfiguration }
        "monitor" { Monitor-BlobStorageMetrics }
        "cleanup" { Cleanup-BlobStorage }
        "backup" { Backup-BlobStorageData }
        default {
            Write-Status "Unknown operation: $Operation" -Status "Error"
            $false
        }
    }
    
    if ($success) {
        Write-Status "Operation '$Operation' completed successfully" -Status "Success"
        exit 0
    }
    else {
        Write-Status "Operation '$Operation' failed" -Status "Error"
        exit 1
    }
}

# Execute main function
Main
