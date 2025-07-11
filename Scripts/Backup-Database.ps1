# Automated Database Backup Script
# This script implements automated database backup procedures for the Flight Companion platform

param(
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "FlightCompanion-Prod",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerName = "fc-sql-australiaeast",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "FlightCompanionDB",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupStorageAccount = "fcbackupstorage",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupType = "Scheduled", # Scheduled, Manual, Emergency
    
    [Parameter(Mandatory=$false)]
    [string]$LogLevel = "Info" # Debug, Info, Warning, Error
)

# Import required modules
Import-Module Az.Sql -Force
Import-Module Az.Storage -Force
Import-Module Az.Accounts -Force

# Initialize logging
$LogFile = "backup-log-$(Get-Date -Format 'yyyyMMdd').log"
function Write-LogMessage {
    param([string]$Level, [string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

function Start-DatabaseBackup {
    param(
        [string]$BackupType,
        [string]$Reason = ""
    )
    
    try {
        Write-LogMessage "Info" "Starting $BackupType database backup for $DatabaseName"
        
        # Set Azure context
        Set-AzContext -SubscriptionId $SubscriptionId
        Write-LogMessage "Info" "Azure context set to subscription: $SubscriptionId"
        
        # Generate backup name with timestamp
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupName = "$DatabaseName-$BackupType-$timestamp"
        
        # Determine backup container based on type
        $containerName = switch ($BackupType.ToLower()) {
            "scheduled" { "scheduled-backups" }
            "manual" { "manual-backups" }
            "emergency" { "emergency-backups" }
            default { "misc-backups" }
        }
        
        Write-LogMessage "Info" "Backup will be stored in container: $containerName"
        
        # Check database status before backup
        $database = Get-AzSqlDatabase -ResourceGroupName $ResourceGroupName -ServerName $ServerName -DatabaseName $DatabaseName
        if ($database.Status -ne "Online") {
            Write-LogMessage "Error" "Database is not online. Current status: $($database.Status)"
            return $false
        }
        
        Write-LogMessage "Info" "Database status verified: Online"
        
        # Get storage account context
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -StorageAccountName $BackupStorageAccount
        $storageContext = $storageAccount.Context
        
        # Ensure backup container exists
        $container = Get-AzStorageContainer -Name $containerName -Context $storageContext -ErrorAction SilentlyContinue
        if (-not $container) {
            New-AzStorageContainer -Name $containerName -Context $storageContext -Permission Off
            Write-LogMessage "Info" "Created backup container: $containerName"
        }
        
        # Create backup URL
        $backupUrl = "https://$BackupStorageAccount.blob.core.windows.net/$containerName/$backupName.bak"
        Write-LogMessage "Info" "Backup URL: $backupUrl"
        
        # Execute backup using Export-AzSqlDatabase (creates .bacpac file)
        Write-LogMessage "Info" "Starting database export operation..."
        $exportRequest = New-AzSqlDatabaseExport -ResourceGroupName $ResourceGroupName `
            -ServerName $ServerName `
            -DatabaseName $DatabaseName `
            -StorageKeyType "StorageAccessKey" `
            -StorageKey (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -StorageAccountName $BackupStorageAccount)[0].Value `
            -StorageUri "https://$BackupStorageAccount.blob.core.windows.net/$containerName/$backupName.bacpac" `
            -AdministratorLogin $env:SQL_ADMIN_LOGIN `
            -AdministratorLoginPassword (ConvertTo-SecureString $env:SQL_ADMIN_PASSWORD -AsPlainText -Force)
        
        Write-LogMessage "Info" "Export request submitted. Request ID: $($exportRequest.OperationStatusLink)"
        
        # Monitor backup progress
        $timeout = 300 # 5 minutes timeout
        $elapsed = 0
        $checkInterval = 30 # Check every 30 seconds
        
        do {
            Start-Sleep -Seconds $checkInterval
            $elapsed += $checkInterval
            
            $status = Get-AzSqlDatabaseImportExportStatus -OperationStatusLink $exportRequest.OperationStatusLink
            Write-LogMessage "Info" "Backup progress: $($status.Status) - $($status.StatusMessage)"
            
            if ($status.Status -eq "Succeeded") {
                Write-LogMessage "Info" "Database backup completed successfully"
                break
            } elseif ($status.Status -eq "Failed") {
                Write-LogMessage "Error" "Database backup failed: $($status.ErrorMessage)"
                return $false
            }
            
        } while ($elapsed -lt $timeout -and $status.Status -eq "InProgress")
        
        if ($elapsed -ge $timeout) {
            Write-LogMessage "Warning" "Backup operation timed out after $timeout seconds"
            return $false
        }
        
        # Verify backup file was created
        $backupBlob = Get-AzStorageBlob -Container $containerName -Blob "$backupName.bacpac" -Context $storageContext -ErrorAction SilentlyContinue
        if ($backupBlob) {
            $backupSizeMB = [math]::Round($backupBlob.Length / 1MB, 2)
            Write-LogMessage "Info" "Backup verified. File size: $backupSizeMB MB"
            
            # Add metadata to backup blob
            $metadata = @{
                "BackupType" = $BackupType
                "DatabaseName" = $DatabaseName
                "BackupDate" = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
                "DatabaseSize" = $database.CurrentServiceObjectiveName
                "Reason" = $Reason
            }
            
            Set-AzStorageBlobContent -File "temp-metadata.json" -Container $containerName -Blob "$backupName-metadata.json" -Context $storageContext -Metadata $metadata -Force
            
            # Log backup success
            $backupResult = @{
                BackupName = $backupName
                BackupType = $BackupType
                DatabaseName = $DatabaseName
                BackupSize = $backupSizeMB
                BackupUrl = $backupUrl
                Status = "Success"
                Timestamp = Get-Date
                Duration = "$elapsed seconds"
            } | ConvertTo-Json
            
            Write-LogMessage "Info" "Backup completed successfully: $backupResult"
            
            # Send success notification
            Send-BackupNotification -Type "Success" -Details $backupResult
            
            return $true
            
        } else {
            Write-LogMessage "Error" "Backup file verification failed - blob not found"
            return $false
        }
        
    } catch {
        Write-LogMessage "Error" "Backup operation failed: $($_.Exception.Message)"
        Write-LogMessage "Error" "Stack trace: $($_.ScriptStackTrace)"
        
        # Send failure notification
        Send-BackupNotification -Type "Failure" -Details $_.Exception.Message
        
        return $false
    }
}

function Send-BackupNotification {
    param(
        [string]$Type, # Success, Failure, Warning
        [string]$Details
    )
    
    try {
        $webhookUrl = $env:BACKUP_NOTIFICATION_WEBHOOK
        if (-not $webhookUrl) {
            Write-LogMessage "Warning" "No notification webhook configured"
            return
        }
        
        $notification = @{
            timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
            service = "Database Backup"
            type = $Type
            database = $DatabaseName
            backupType = $BackupType
            details = $Details
            environment = $env:ENVIRONMENT_NAME
        }
        
        $payload = @{
            text = "Database Backup $Type"
            attachments = @(
                @{
                    color = switch ($Type) {
                        "Success" { "good" }
                        "Failure" { "danger" }
                        "Warning" { "warning" }
                        default { "#gray" }
                    }
                    fields = @(
                        @{ title = "Database"; value = $DatabaseName; short = $true }
                        @{ title = "Backup Type"; value = $BackupType; short = $true }
                        @{ title = "Status"; value = $Type; short = $true }
                        @{ title = "Environment"; value = $env:ENVIRONMENT_NAME; short = $true }
                        @{ title = "Details"; value = $Details; short = $false }
                    )
                    ts = [int][double]::Parse((Get-Date -UFormat %s))
                }
            )
        } | ConvertTo-Json -Depth 4
        
        Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json"
        Write-LogMessage "Info" "Notification sent successfully"
        
    } catch {
        Write-LogMessage "Warning" "Failed to send notification: $($_.Exception.Message)"
    }
}

function Test-BackupIntegrity {
    param([string]$BackupName)
    
    try {
        Write-LogMessage "Info" "Starting backup integrity test for: $BackupName"
        
        # Create test database name
        $testDatabaseName = "$DatabaseName-IntegrityTest-$(Get-Date -Format 'HHmmss')"
        
        # Import backup to test database
        $importRequest = New-AzSqlDatabaseImport -ResourceGroupName $ResourceGroupName `
            -ServerName $ServerName `
            -DatabaseName $testDatabaseName `
            -StorageKeyType "StorageAccessKey" `
            -StorageKey (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -StorageAccountName $BackupStorageAccount)[0].Value `
            -StorageUri "https://$BackupStorageAccount.blob.core.windows.net/scheduled-backups/$BackupName.bacpac" `
            -AdministratorLogin $env:SQL_ADMIN_LOGIN `
            -AdministratorLoginPassword (ConvertTo-SecureString $env:SQL_ADMIN_PASSWORD -AsPlainText -Force) `
            -Edition "Basic"
        
        Write-LogMessage "Info" "Import request submitted for integrity test"
        
        # Wait for import to complete (shorter timeout for test)
        $timeout = 180 # 3 minutes
        $elapsed = 0
        $checkInterval = 15
        
        do {
            Start-Sleep -Seconds $checkInterval
            $elapsed += $checkInterval
            
            $status = Get-AzSqlDatabaseImportExportStatus -OperationStatusLink $importRequest.OperationStatusLink
            Write-LogMessage "Info" "Import progress: $($status.Status)"
            
        } while ($elapsed -lt $timeout -and $status.Status -eq "InProgress")
        
        if ($status.Status -eq "Succeeded") {
            Write-LogMessage "Info" "Backup integrity test passed - import successful"
            
            # Run basic validation queries
            $validationQueries = @(
                "SELECT COUNT(*) as UserCount FROM Users",
                "SELECT COUNT(*) as RequestCount FROM FlightCompanionRequests",
                "SELECT COUNT(*) as PaymentCount FROM Payments"
            )
            
            foreach ($query in $validationQueries) {
                try {
                    $result = Invoke-Sqlcmd -ServerInstance "$ServerName.database.windows.net" -Database $testDatabaseName -Query $query -Username $env:SQL_ADMIN_LOGIN -Password $env:SQL_ADMIN_PASSWORD
                    Write-LogMessage "Info" "Validation query result: $query = $($result[0])"
                } catch {
                    Write-LogMessage "Warning" "Validation query failed: $query - $($_.Exception.Message)"
                }
            }
            
            # Cleanup test database
            Remove-AzSqlDatabase -ResourceGroupName $ResourceGroupName -ServerName $ServerName -DatabaseName $testDatabaseName -Force
            Write-LogMessage "Info" "Test database cleaned up"
            
            return $true
            
        } else {
            Write-LogMessage "Error" "Backup integrity test failed - import failed: $($status.ErrorMessage)"
            return $false
        }
        
    } catch {
        Write-LogMessage "Error" "Backup integrity test error: $($_.Exception.Message)"
        return $false
    }
}

function Remove-OldBackups {
    param([int]$RetentionDays = 30)
    
    try {
        Write-LogMessage "Info" "Starting cleanup of backups older than $RetentionDays days"
        
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -StorageAccountName $BackupStorageAccount
        $storageContext = $storageAccount.Context
        
        $containers = @("scheduled-backups", "manual-backups", "emergency-backups")
        $totalDeleted = 0
        
        foreach ($containerName in $containers) {
            $blobs = Get-AzStorageBlob -Container $containerName -Context $storageContext | Where-Object { $_.LastModified -lt $cutoffDate }
            
            foreach ($blob in $blobs) {
                Remove-AzStorageBlob -Container $containerName -Blob $blob.Name -Context $storageContext -Force
                $totalDeleted++
                Write-LogMessage "Info" "Deleted old backup: $($blob.Name)"
            }
        }
        
        Write-LogMessage "Info" "Cleanup completed. Deleted $totalDeleted old backup files"
        
    } catch {
        Write-LogMessage "Error" "Backup cleanup failed: $($_.Exception.Message)"
    }
}

# Main execution
Write-LogMessage "Info" "=== Database Backup Script Started ==="
Write-LogMessage "Info" "Backup Type: $BackupType"
Write-LogMessage "Info" "Database: $DatabaseName"
Write-LogMessage "Info" "Server: $ServerName"

# Validate required environment variables
$requiredVars = @("AZURE_SUBSCRIPTION_ID", "SQL_ADMIN_LOGIN", "SQL_ADMIN_PASSWORD")
foreach ($var in $requiredVars) {
    if (-not (Get-Variable -Name $var -Scope Global -ErrorAction SilentlyContinue)) {
        Write-LogMessage "Error" "Required environment variable not set: $var"
        exit 1
    }
}

# Execute backup
$backupSuccess = Start-DatabaseBackup -BackupType $BackupType

if ($backupSuccess) {
    Write-LogMessage "Info" "Backup operation completed successfully"
    
    # Run integrity test for scheduled backups
    if ($BackupType -eq "Scheduled") {
        $testResult = Test-BackupIntegrity -BackupName "$DatabaseName-$BackupType-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        if (-not $testResult) {
            Write-LogMessage "Warning" "Backup integrity test failed"
        }
    }
    
    # Cleanup old backups
    Remove-OldBackups -RetentionDays 30
    
    Write-LogMessage "Info" "=== Database Backup Script Completed Successfully ==="
    exit 0
} else {
    Write-LogMessage "Error" "Backup operation failed"
    Write-LogMessage "Error" "=== Database Backup Script Failed ==="
    exit 1
}
