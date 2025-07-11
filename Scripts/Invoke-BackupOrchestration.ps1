# Automated Backup and Disaster Recovery Orchestration Script
# This script coordinates all backup and DR operations on a scheduled basis

param(
    [Parameter(Mandatory=$false)]
    [string]$Operation = "DailyBackup", # DailyBackup, WeeklyValidation, MonthlyTest, QuarterlySimulation
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "backup-config.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$ForceExecution,
    
    [Parameter(Mandatory=$false)]
    [string]$NotificationWebhook = $env:BACKUP_NOTIFICATION_WEBHOOK
)

# Import required modules
Import-Module Az.Accounts -Force
Import-Module Az.Profile -Force

# Initialize logging
$LogFile = "backup-orchestration-$(Get-Date -Format 'yyyyMMdd').log"
$global:OperationResults = @()

function Write-LogMessage {
    param([string]$Level, [string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

function Get-BackupConfiguration {
    param([string]$ConfigPath)
    
    if (Test-Path $ConfigPath) {
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        Write-LogMessage "Info" "Loaded configuration from: $ConfigPath"
        return $config
    } else {
        # Create default configuration
        $defaultConfig = @{
            SubscriptionId = $env:AZURE_SUBSCRIPTION_ID
            ResourceGroups = @{
                Production = "FlightCompanion-Prod"
                Test = "FlightCompanion-Test"
                DR = "FlightCompanion-DR"
            }
            Databases = @{
                Primary = @{
                    ServerName = "fc-sql-australiaeast"
                    DatabaseName = "FlightCompanionDB"
                    ResourceGroup = "FlightCompanion-Prod"
                }
                Test = @{
                    ServerName = "fc-sql-test"
                    DatabaseName = "FlightCompanionDB-Test"
                    ResourceGroup = "FlightCompanion-Test"
                }
            }
            Storage = @{
                BackupAccount = "fcbackupstorage"
                Containers = @{
                    ScheduledBackups = "scheduled-backups"
                    ManualBackups = "manual-backups"
                    EmergencyBackups = "emergency-backups"
                    ConfigurationBackups = "configuration-backups"
                }
            }
            AppServices = @{
                Primary = @{
                    Name = "FlightCompanionApp"
                    ResourceGroup = "FlightCompanion-Prod"
                }
                DR = @{
                    Name = "FlightCompanionApp-DR"
                    ResourceGroup = "FlightCompanion-DR"
                }
            }
            Schedule = @{
                DailyBackup = "02:00"
                WeeklyValidation = "Tuesday 03:00"
                MonthlyTest = "First Tuesday 04:00"
                QuarterlySimulation = "First Tuesday of Quarter 05:00"
            }
            Retention = @{
                DatabaseBackups = 35
                AppServiceBackups = 30
                ConfigurationBackups = 90
                TestResults = 365
            }
            Notifications = @{
                Webhook = $env:BACKUP_NOTIFICATION_WEBHOOK
                EmailEnabled = $true
                SlackEnabled = $true
            }
            Thresholds = @{
                MaxBackupTime = 60  # minutes
                MinSuccessRate = 95  # percentage
                MaxFailureCount = 3  # consecutive failures
            }
        } | ConvertTo-Json -Depth 5
        
        $defaultConfig | Out-File $ConfigPath
        Write-LogMessage "Info" "Created default configuration: $ConfigPath"
        
        return $defaultConfig | ConvertFrom-Json
    }
}

function Send-OperationNotification {
    param(
        [string]$Operation,
        [string]$Status,
        [string]$Summary,
        [array]$Details = @(),
        [hashtable]$Metrics = @{}
    )
    
    if (-not $NotificationWebhook) {
        Write-LogMessage "Warning" "No notification webhook configured"
        return
    }
    
    try {
        $color = switch ($Status) {
            "Success" { "good" }
            "Warning" { "warning" }
            "Failed" { "danger" }
            "In Progress" { "#036" }
            default { "#gray" }
        }
        
        $fields = @(
            @{ title = "Operation"; value = $Operation; short = $true }
            @{ title = "Status"; value = $Status; short = $true }
            @{ title = "Environment"; value = $env:ENVIRONMENT_NAME; short = $true }
            @{ title = "Timestamp"; value = (Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"); short = $true }
            @{ title = "Summary"; value = $Summary; short = $false }
        )
        
        if ($Metrics.Count -gt 0) {
            $metricsText = ($Metrics.GetEnumerator() | ForEach-Object { "$($_.Key): $($_.Value)" }) -join "`n"
            $fields += @{ title = "Metrics"; value = $metricsText; short = $false }
        }
        
        if ($Details.Count -gt 0) {
            $detailsText = ($Details | ForEach-Object { "• $_" }) -join "`n"
            $fields += @{ title = "Details"; value = $detailsText; short = $false }
        }
        
        $payload = @{
            text = "Backup & DR Operation: $Operation"
            attachments = @(
                @{
                    color = $color
                    fields = $fields
                    ts = [int][double]::Parse((Get-Date -UFormat %s))
                }
            )
        } | ConvertTo-Json -Depth 4
        
        Invoke-RestMethod -Uri $NotificationWebhook -Method Post -Body $payload -ContentType "application/json"
        Write-LogMessage "Info" "Notification sent: $Operation - $Status"
        
    } catch {
        Write-LogMessage "Warning" "Failed to send notification: $($_.Exception.Message)"
    }
}

function Invoke-DailyBackup {
    param([object]$Config)
    
    Write-LogMessage "Info" "=== Starting Daily Backup Operation ==="
    $operationStart = Get-Date
    
    try {
        Send-OperationNotification -Operation "Daily Backup" -Status "In Progress" -Summary "Starting automated daily backup procedures"
        
        $results = @()
        
        # 1. Database Backup
        Write-LogMessage "Info" "Executing database backup"
        $dbBackupResult = & ".\Backup-Database.ps1" -BackupType "Scheduled" -SubscriptionId $Config.SubscriptionId
        
        if ($LASTEXITCODE -eq 0) {
            $results += "✅ Database backup completed successfully"
            Write-LogMessage "Info" "Database backup successful"
        } else {
            $results += "❌ Database backup failed"
            Write-LogMessage "Error" "Database backup failed with exit code: $LASTEXITCODE"
        }
        
        # 2. Configuration Backup
        Write-LogMessage "Info" "Backing up configuration files"
        $configBackupResult = Backup-ConfigurationFiles -Config $Config
        
        if ($configBackupResult.Success) {
            $results += "✅ Configuration backup completed ($($configBackupResult.FilesBackedUp) files)"
            Write-LogMessage "Info" "Configuration backup successful"
        } else {
            $results += "❌ Configuration backup failed"
            Write-LogMessage "Error" "Configuration backup failed: $($configBackupResult.Error)"
        }
        
        # 3. App Service Backup
        Write-LogMessage "Info" "Triggering app service backup"
        $appBackupResult = Start-AppServiceBackup -Config $Config
        
        if ($appBackupResult.Success) {
            $results += "✅ App service backup initiated successfully"
            Write-LogMessage "Info" "App service backup successful"
        } else {
            $results += "❌ App service backup failed"
            Write-LogMessage "Error" "App service backup failed: $($appBackupResult.Error)"
        }
        
        # 4. Cleanup Old Backups
        Write-LogMessage "Info" "Cleaning up old backups"
        $cleanupResult = Remove-ExpiredBackups -Config $Config
        
        if ($cleanupResult.Success) {
            $results += "✅ Cleanup completed ($($cleanupResult.FilesRemoved) files removed)"
            Write-LogMessage "Info" "Cleanup successful"
        } else {
            $results += "⚠️ Cleanup completed with warnings"
            Write-LogMessage "Warning" "Cleanup warnings: $($cleanupResult.Warnings)"
        }
        
        $operationDuration = (Get-Date) - $operationStart
        $successCount = ($results | Where-Object { $_ -like "*✅*" }).Count
        $failureCount = ($results | Where-Object { $_ -like "*❌*" }).Count
        
        $status = if ($failureCount -eq 0) { "Success" } elseif ($successCount -gt $failureCount) { "Warning" } else { "Failed" }
        
        $metrics = @{
            Duration = "$([math]::Round($operationDuration.TotalMinutes, 2)) minutes"
            SuccessfulOperations = $successCount
            FailedOperations = $failureCount
            TotalOperations = $results.Count
        }
        
        Send-OperationNotification -Operation "Daily Backup" -Status $status -Summary "Daily backup completed with $successCount/$($results.Count) operations successful" -Details $results -Metrics $metrics
        
        $global:OperationResults += @{
            Operation = "DailyBackup"
            Status = $status
            StartTime = $operationStart
            EndTime = Get-Date
            Results = $results
            Metrics = $metrics
        }
        
        Write-LogMessage "Info" "=== Daily Backup Operation Completed: $status ==="
        return $status -eq "Success"
        
    } catch {
        $errorMessage = $_.Exception.Message
        Write-LogMessage "Error" "Daily backup operation failed: $errorMessage"
        
        Send-OperationNotification -Operation "Daily Backup" -Status "Failed" -Summary "Daily backup operation failed with error" -Details @($errorMessage)
        
        return $false
    }
}

function Invoke-WeeklyValidation {
    param([object]$Config)
    
    Write-LogMessage "Info" "=== Starting Weekly Backup Validation ==="
    $operationStart = Get-Date
    
    try {
        Send-OperationNotification -Operation "Weekly Validation" -Status "In Progress" -Summary "Starting weekly backup integrity validation"
        
        # Run backup validation test
        $validationResult = & ".\Test-DisasterRecovery.ps1" -TestType "BackupValidation" -SubscriptionId $Config.SubscriptionId
        
        $status = if ($LASTEXITCODE -eq 0) { "Success" } else { "Failed" }
        $operationDuration = (Get-Date) - $operationStart
        
        $summary = if ($status -eq "Success") {
            "Weekly backup validation completed successfully"
        } else {
            "Weekly backup validation detected issues requiring attention"
        }
        
        $metrics = @{
            Duration = "$([math]::Round($operationDuration.TotalMinutes, 2)) minutes"
            TestResult = $status
        }
        
        Send-OperationNotification -Operation "Weekly Validation" -Status $status -Summary $summary -Metrics $metrics
        
        $global:OperationResults += @{
            Operation = "WeeklyValidation"
            Status = $status
            StartTime = $operationStart
            EndTime = Get-Date
            Metrics = $metrics
        }
        
        Write-LogMessage "Info" "=== Weekly Validation Completed: $status ==="
        return $status -eq "Success"
        
    } catch {
        $errorMessage = $_.Exception.Message
        Write-LogMessage "Error" "Weekly validation failed: $errorMessage"
        
        Send-OperationNotification -Operation "Weekly Validation" -Status "Failed" -Summary "Weekly validation failed with error" -Details @($errorMessage)
        
        return $false
    }
}

function Invoke-MonthlyTest {
    param([object]$Config)
    
    Write-LogMessage "Info" "=== Starting Monthly DR Test ==="
    $operationStart = Get-Date
    
    try {
        Send-OperationNotification -Operation "Monthly DR Test" -Status "In Progress" -Summary "Starting monthly disaster recovery testing"
        
        # Run database restore test
        $testResult = & ".\Test-DisasterRecovery.ps1" -TestType "DatabaseRestore" -SubscriptionId $Config.SubscriptionId
        
        $status = if ($LASTEXITCODE -eq 0) { "Success" } else { "Failed" }
        $operationDuration = (Get-Date) - $operationStart
        
        $summary = if ($status -eq "Success") {
            "Monthly DR test completed successfully - RTO/RPO targets met"
        } else {
            "Monthly DR test failed - immediate attention required"
        }
        
        $metrics = @{
            Duration = "$([math]::Round($operationDuration.TotalMinutes, 2)) minutes"
            TestResult = $status
            TestType = "Database Restore"
        }
        
        Send-OperationNotification -Operation "Monthly DR Test" -Status $status -Summary $summary -Metrics $metrics
        
        $global:OperationResults += @{
            Operation = "MonthlyTest"
            Status = $status
            StartTime = $operationStart
            EndTime = Get-Date
            Metrics = $metrics
        }
        
        Write-LogMessage "Info" "=== Monthly DR Test Completed: $status ==="
        return $status -eq "Success"
        
    } catch {
        $errorMessage = $_.Exception.Message
        Write-LogMessage "Error" "Monthly DR test failed: $errorMessage"
        
        Send-OperationNotification -Operation "Monthly DR Test" -Status "Failed" -Summary "Monthly DR test failed with error" -Details @($errorMessage)
        
        return $false
    }
}

function Invoke-QuarterlySimulation {
    param([object]$Config)
    
    Write-LogMessage "Info" "=== Starting Quarterly Full DR Simulation ==="
    $operationStart = Get-Date
    
    try {
        Send-OperationNotification -Operation "Quarterly DR Simulation" -Status "In Progress" -Summary "Starting comprehensive quarterly disaster recovery simulation"
        
        # Run full DR simulation
        $simulationResult = & ".\Test-DisasterRecovery.ps1" -TestType "FullDR" -SubscriptionId $Config.SubscriptionId
        
        $status = if ($LASTEXITCODE -eq 0) { "Success" } else { "Failed" }
        $operationDuration = (Get-Date) - $operationStart
        
        $summary = if ($status -eq "Success") {
            "Quarterly DR simulation completed successfully - all systems validated"
        } else {
            "Quarterly DR simulation revealed critical issues - emergency review required"
        }
        
        $metrics = @{
            Duration = "$([math]::Round($operationDuration.TotalMinutes, 2)) minutes"
            TestResult = $status
            TestType = "Full DR Simulation"
            Scope = "Complete Platform"
        }
        
        Send-OperationNotification -Operation "Quarterly DR Simulation" -Status $status -Summary $summary -Metrics $metrics
        
        $global:OperationResults += @{
            Operation = "QuarterlySimulation"
            Status = $status
            StartTime = $operationStart
            EndTime = Get-Date
            Metrics = $metrics
        }
        
        Write-LogMessage "Info" "=== Quarterly DR Simulation Completed: $status ==="
        return $status -eq "Success"
        
    } catch {
        $errorMessage = $_.Exception.Message
        Write-LogMessage "Error" "Quarterly DR simulation failed: $errorMessage"
        
        Send-OperationNotification -Operation "Quarterly DR Simulation" -Status "Failed" -Summary "Quarterly DR simulation failed with error" -Details @($errorMessage)
        
        return $false
    }
}

function Backup-ConfigurationFiles {
    param([object]$Config)
    
    try {
        Write-LogMessage "Info" "Starting configuration files backup"
        
        # Set Azure context
        Set-AzContext -SubscriptionId $Config.SubscriptionId
        
        # Get storage context
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $Config.ResourceGroups.Production -StorageAccountName $Config.Storage.BackupAccount
        $storageContext = $storageAccount.Context
        
        # Ensure configuration backup container exists
        $containerName = $Config.Storage.Containers.ConfigurationBackups
        $container = Get-AzStorageContainer -Name $containerName -Context $storageContext -ErrorAction SilentlyContinue
        if (-not $container) {
            New-AzStorageContainer -Name $containerName -Context $storageContext -Permission Off
        }
        
        # Backup configuration files
        $configFiles = @(
            ".\appsettings.json",
            ".\appsettings.Production.json",
            ".\appsettings.Development.json",
            "..\infra\azure.yaml",
            "..\infra\bicepconfig.json",
            ".\backup-config.json"
        )
        
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupFolder = "config-backup-$timestamp"
        $filesBackedUp = 0
        
        foreach ($file in $configFiles) {
            if (Test-Path $file) {
                $fileName = Split-Path $file -Leaf
                $blobName = "$backupFolder/$fileName"
                
                Set-AzStorageBlobContent -File $file -Container $containerName -Blob $blobName -Context $storageContext -Force
                $filesBackedUp++
                Write-LogMessage "Info" "Backed up configuration file: $fileName"
            } else {
                Write-LogMessage "Warning" "Configuration file not found: $file"
            }
        }
        
        Write-LogMessage "Info" "Configuration backup completed: $filesBackedUp files"
        
        return @{
            Success = $true
            FilesBackedUp = $filesBackedUp
            BackupLocation = $backupFolder
        }
        
    } catch {
        Write-LogMessage "Error" "Configuration backup failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Start-AppServiceBackup {
    param([object]$Config)
    
    try {
        Write-LogMessage "Info" "Starting App Service backup"
        
        # Set Azure context
        Set-AzContext -SubscriptionId $Config.SubscriptionId
        
        $appServiceName = $Config.AppServices.Primary.Name
        $resourceGroupName = $Config.AppServices.Primary.ResourceGroup
        
        # Get storage account key for backup
        $storageKey = (Get-AzStorageAccountKey -ResourceGroupName $Config.ResourceGroups.Production -StorageAccountName $Config.Storage.BackupAccount)[0].Value
        $backupName = "app-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        $storageAccountUrl = "https://$($Config.Storage.BackupAccount).blob.core.windows.net/app-service-backups/$backupName.zip"
        
        # Create backup
        $backup = New-AzWebAppBackup -ResourceGroupName $resourceGroupName -Name $appServiceName -StorageAccountUrl $storageAccountUrl -BackupName $backupName
        
        if ($backup) {
            Write-LogMessage "Info" "App Service backup initiated successfully: $backupName"
            return @{
                Success = $true
                BackupName = $backupName
                BackupId = $backup.BackupId
            }
        } else {
            throw "Failed to initiate App Service backup"
        }
        
    } catch {
        Write-LogMessage "Error" "App Service backup failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Remove-ExpiredBackups {
    param([object]$Config)
    
    try {
        Write-LogMessage "Info" "Starting cleanup of expired backups"
        
        # Set Azure context
        Set-AzContext -SubscriptionId $Config.SubscriptionId
        
        # Get storage context
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $Config.ResourceGroups.Production -StorageAccountName $Config.Storage.BackupAccount
        $storageContext = $storageAccount.Context
        
        $totalFilesRemoved = 0
        $warnings = @()
        
        # Cleanup each container based on retention policy
        $retentionPolicies = @{
            $Config.Storage.Containers.ScheduledBackups = $Config.Retention.DatabaseBackups
            $Config.Storage.Containers.ManualBackups = $Config.Retention.DatabaseBackups
            $Config.Storage.Containers.ConfigurationBackups = $Config.Retention.ConfigurationBackups
            "app-service-backups" = $Config.Retention.AppServiceBackups
        }
        
        foreach ($container in $retentionPolicies.GetEnumerator()) {
            $containerName = $container.Key
            $retentionDays = $container.Value
            $cutoffDate = (Get-Date).AddDays(-$retentionDays)
            
            Write-LogMessage "Info" "Cleaning container '$containerName' (retention: $retentionDays days)"
            
            try {
                $expiredBlobs = Get-AzStorageBlob -Container $containerName -Context $storageContext | 
                    Where-Object { $_.LastModified -lt $cutoffDate }
                
                foreach ($blob in $expiredBlobs) {
                    Remove-AzStorageBlob -Container $containerName -Blob $blob.Name -Context $storageContext -Force
                    $totalFilesRemoved++
                    Write-LogMessage "Info" "Removed expired backup: $($blob.Name)"
                }
                
            } catch {
                $warnings += "Failed to cleanup container '$containerName': $($_.Exception.Message)"
                Write-LogMessage "Warning" "Cleanup warning for container '$containerName': $($_.Exception.Message)"
            }
        }
        
        Write-LogMessage "Info" "Cleanup completed: $totalFilesRemoved files removed"
        
        return @{
            Success = $true
            FilesRemoved = $totalFilesRemoved
            Warnings = $warnings
        }
        
    } catch {
        Write-LogMessage "Error" "Cleanup operation failed: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
            FilesRemoved = $totalFilesRemoved
        }
    }
}

function Test-ScheduledExecution {
    param([object]$Config, [string]$Operation)
    
    # Check if execution is scheduled for current time
    $currentTime = Get-Date
    $currentDay = $currentTime.DayOfWeek
    
    switch ($Operation) {
        "DailyBackup" {
            $scheduledTime = [datetime]::ParseExact($Config.Schedule.DailyBackup, "HH:mm", $null)
            $scheduledDateTime = Get-Date -Hour $scheduledTime.Hour -Minute $scheduledTime.Minute
            $timeDiff = [math]::Abs(($currentTime - $scheduledDateTime).TotalMinutes)
            return $timeDiff -le 30  # Within 30 minutes of scheduled time
        }
        "WeeklyValidation" {
            return $currentDay -eq "Tuesday" -and $currentTime.Hour -eq 3
        }
        "MonthlyTest" {
            # First Tuesday of the month at 4 AM
            $firstTuesday = 1..7 | ForEach-Object { Get-Date -Day $_ } | Where-Object { $_.DayOfWeek -eq "Tuesday" } | Select-Object -First 1
            return $currentTime.Date -eq $firstTuesday.Date -and $currentTime.Hour -eq 4
        }
        "QuarterlySimulation" {
            # First Tuesday of quarter at 5 AM
            $quarterMonths = @(1, 4, 7, 10)
            $isQuarterMonth = $quarterMonths -contains $currentTime.Month
            if ($isQuarterMonth) {
                $firstTuesday = 1..7 | ForEach-Object { Get-Date -Day $_ } | Where-Object { $_.DayOfWeek -eq "Tuesday" } | Select-Object -First 1
                return $currentTime.Date -eq $firstTuesday.Date -and $currentTime.Hour -eq 5
            }
            return $false
        }
    }
    
    return $false
}

# Main execution
Write-LogMessage "Info" "=== Backup and DR Orchestration Script Started ==="
Write-LogMessage "Info" "Operation: $Operation"
Write-LogMessage "Info" "Subscription: $SubscriptionId"

try {
    # Load configuration
    $config = Get-BackupConfiguration -ConfigPath $ConfigFile
    
    # Check if operation should run (unless forced)
    if (-not $ForceExecution) {
        $shouldRun = Test-ScheduledExecution -Config $config -Operation $Operation
        if (-not $shouldRun) {
            Write-LogMessage "Info" "Operation '$Operation' not scheduled for current time. Use -ForceExecution to override."
            exit 0
        }
    }
    
    Write-LogMessage "Info" "Executing operation: $Operation"
    
    # Set Azure context
    Set-AzContext -SubscriptionId $SubscriptionId
    
    # Execute requested operation
    $success = switch ($Operation) {
        "DailyBackup" { Invoke-DailyBackup -Config $config }
        "WeeklyValidation" { Invoke-WeeklyValidation -Config $config }
        "MonthlyTest" { Invoke-MonthlyTest -Config $config }
        "QuarterlySimulation" { Invoke-QuarterlySimulation -Config $config }
        default {
            Write-LogMessage "Error" "Unknown operation: $Operation"
            $false
        }
    }
    
    # Generate operation summary
    $sessionSummary = @{
        SessionId = [System.Guid]::NewGuid().ToString()
        Operation = $Operation
        StartTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        Results = $global:OperationResults
        OverallSuccess = $success
        Environment = $env:ENVIRONMENT_NAME
    }
    
    $summaryJson = $sessionSummary | ConvertTo-Json -Depth 5
    $summaryFile = "operation-summary-$Operation-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $summaryJson | Out-File $summaryFile
    
    Write-LogMessage "Info" "Operation summary saved: $summaryFile"
    
    if ($success) {
        Write-LogMessage "Info" "=== Backup and DR Orchestration Completed Successfully ==="
        exit 0
    } else {
        Write-LogMessage "Error" "=== Backup and DR Orchestration Failed ==="
        exit 1
    }
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-LogMessage "Error" "Orchestration script failed: $errorMessage"
    
    Send-OperationNotification -Operation $Operation -Status "Failed" -Summary "Orchestration script failed with error" -Details @($errorMessage)
    
    exit 1
}
