# Disaster Recovery Testing Script
# This script implements comprehensive disaster recovery testing procedures

param(
    [Parameter(Mandatory=$false)]
    [string]$TestType = "DatabaseRestore", # DatabaseRestore, ApplicationFailover, FullDR, BackupValidation
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "FlightCompanion-Prod",
    
    [Parameter(Mandatory=$false)]
    [string]$TestResourceGroupName = "FlightCompanion-Test",
    
    [Parameter(Mandatory=$false)]
    [string]$DRResourceGroupName = "FlightCompanion-DR",
    
    [Parameter(Mandatory=$false)]
    [string]$NotificationWebhook = $env:DR_TEST_WEBHOOK,
    
    [Parameter(Mandatory=$false)]
    [switch]$RunValidationOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$CleanupAfterTest = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$LogLevel = "Info"
)

# Import required modules
Import-Module Az.Sql -Force
Import-Module Az.Websites -Force
Import-Module Az.Storage -Force
Import-Module Az.Resources -Force
Import-Module Az.TrafficManager -Force

# Initialize logging
$LogFile = "dr-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$TestResults = @()

function Write-LogMessage {
    param([string]$Level, [string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

function Send-TestNotification {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Details,
        [hashtable]$Metrics = @{}
    )
    
    if (-not $NotificationWebhook) {
        Write-LogMessage "Warning" "No notification webhook configured"
        return
    }
    
    try {
        $notification = @{
            text = "DR Test: $TestName - $Status"
            attachments = @(
                @{
                    color = switch ($Status) {
                        "Success" { "good" }
                        "Failed" { "danger" }
                        "Warning" { "warning" }
                        "In Progress" { "#036" }
                        default { "#gray" }
                    }
                    fields = @(
                        @{ title = "Test Type"; value = $TestName; short = $true }
                        @{ title = "Status"; value = $Status; short = $true }
                        @{ title = "Environment"; value = $env:ENVIRONMENT_NAME; short = $true }
                        @{ title = "Test Time"; value = (Get-Date -Format "yyyy-MM-dd HH:mm:ss"); short = $true }
                    )
                    if ($Metrics.Count -gt 0) {
                        $fields += @{ title = "Metrics"; value = ($Metrics | ConvertTo-Json); short = $false }
                    }
                    $fields += @{ title = "Details"; value = $Details; short = $false }
                    ts = [int][double]::Parse((Get-Date -UFormat %s))
                }
            )
        } | ConvertTo-Json -Depth 4
        
        Invoke-RestMethod -Uri $NotificationWebhook -Method Post -Body $notification -ContentType "application/json"
        Write-LogMessage "Info" "Test notification sent: $TestName - $Status"
        
    } catch {
        Write-LogMessage "Warning" "Failed to send test notification: $($_.Exception.Message)"
    }
}

function Test-DatabaseRestore {
    param(
        [string]$SourceDatabase = "FlightCompanionDB",
        [string]$TestServer = "fc-sql-test",
        [int]$RestorePointMinutesAgo = 60
    )
    
    Write-LogMessage "Info" "=== Starting Database Restore Test ==="
    $testStartTime = Get-Date
    
    try {
        # Calculate restore point
        $restorePoint = (Get-Date).AddMinutes(-$RestorePointMinutesAgo)
        $testDatabaseName = "$SourceDatabase-DrTest-$(Get-Date -Format 'yyyyMMddHHmm')"
        
        Write-LogMessage "Info" "Restore point: $($restorePoint.ToString('yyyy-MM-dd HH:mm:ss'))"
        Write-LogMessage "Info" "Test database name: $testDatabaseName"
        
        Send-TestNotification -TestName "Database Restore" -Status "In Progress" -Details "Starting point-in-time restore test"
        
        # Ensure test resource group exists
        $testRG = Get-AzResourceGroup -Name $TestResourceGroupName -ErrorAction SilentlyContinue
        if (-not $testRG) {
            New-AzResourceGroup -Name $TestResourceGroupName -Location "Australia East"
            Write-LogMessage "Info" "Created test resource group: $TestResourceGroupName"
        }
        
        # Start point-in-time restore
        Write-LogMessage "Info" "Starting point-in-time restore operation..."
        $restoreJob = Restore-AzSqlDatabase `
            -FromPointInTimeBackup `
            -PointInTime $restorePoint `
            -ResourceGroupName $TestResourceGroupName `
            -ServerName $TestServer `
            -TargetDatabaseName $testDatabaseName `
            -SourceDatabaseName $SourceDatabase `
            -SourceResourceGroupName $ResourceGroupName `
            -SourceServerName "fc-sql-australiaeast" `
            -AsJob
        
        # Monitor restore progress
        $timeout = 600 # 10 minutes timeout
        $elapsed = 0
        $checkInterval = 30
        
        do {
            Start-Sleep -Seconds $checkInterval
            $elapsed += $checkInterval
            
            $jobState = Get-Job -Id $restoreJob.Id | Select-Object -ExpandProperty State
            Write-LogMessage "Info" "Restore progress: $jobState (elapsed: ${elapsed}s)"
            
            if ($jobState -eq "Completed") {
                $restoreResult = Receive-Job -Job $restoreJob
                break
            } elseif ($jobState -eq "Failed") {
                $error = Receive-Job -Job $restoreJob
                throw "Restore job failed: $error"
            }
            
        } while ($elapsed -lt $timeout -and $jobState -eq "Running")
        
        if ($elapsed -ge $timeout) {
            throw "Restore operation timed out after $timeout seconds"
        }
        
        $restoreTime = (Get-Date) - $testStartTime
        Write-LogMessage "Info" "Database restore completed in $($restoreTime.TotalMinutes) minutes"
        
        # Verify restored database
        $restoredDatabase = Get-AzSqlDatabase -ResourceGroupName $TestResourceGroupName -ServerName $TestServer -DatabaseName $testDatabaseName
        if ($restoredDatabase.Status -ne "Online") {
            throw "Restored database is not online. Status: $($restoredDatabase.Status)"
        }
        
        Write-LogMessage "Info" "Restored database verified as online"
        
        # Run validation queries
        $validationResults = Test-DatabaseIntegrity -DatabaseName $testDatabaseName -ServerName "$TestServer.database.windows.net"
        
        # Calculate metrics
        $metrics = @{
            RestoreTimeMinutes = [math]::Round($restoreTime.TotalMinutes, 2)
            DatabaseSizeGB = [math]::Round($restoredDatabase.CurrentBackupStorageUsage / 1024, 2)
            ValidationQueriesPassed = $validationResults.PassedQueries
            ValidationQueriesFailed = $validationResults.FailedQueries
            RTOTarget = "60 minutes"
            RTOActual = "$([math]::Round($restoreTime.TotalMinutes, 2)) minutes"
            RTOMet = $restoreTime.TotalMinutes -le 60
        }
        
        # Cleanup test database if requested
        if ($CleanupAfterTest) {
            Remove-AzSqlDatabase -ResourceGroupName $TestResourceGroupName -ServerName $TestServer -DatabaseName $testDatabaseName -Force
            Write-LogMessage "Info" "Test database cleaned up"
        }
        
        # Record test results
        $testResult = @{
            TestType = "DatabaseRestore"
            Status = "Success"
            StartTime = $testStartTime
            EndTime = Get-Date
            Duration = $restoreTime
            Metrics = $metrics
            Details = "Point-in-time restore test completed successfully"
        }
        
        $global:TestResults += $testResult
        
        Send-TestNotification -TestName "Database Restore" -Status "Success" -Details "Restore completed in $($metrics.RestoreTimeMinutes) minutes" -Metrics $metrics
        Write-LogMessage "Info" "=== Database Restore Test Completed Successfully ==="
        
        return $testResult
        
    } catch {
        $errorDetails = $_.Exception.Message
        Write-LogMessage "Error" "Database restore test failed: $errorDetails"
        
        $testResult = @{
            TestType = "DatabaseRestore"
            Status = "Failed"
            StartTime = $testStartTime
            EndTime = Get-Date
            Error = $errorDetails
            Details = "Point-in-time restore test failed"
        }
        
        $global:TestResults += $testResult
        
        Send-TestNotification -TestName "Database Restore" -Status "Failed" -Details $errorDetails
        
        return $testResult
    }
}

function Test-DatabaseIntegrity {
    param(
        [string]$DatabaseName,
        [string]$ServerName
    )
    
    Write-LogMessage "Info" "Running database integrity validation"
    
    $validationQueries = @(
        @{ Name = "User Count"; Query = "SELECT COUNT(*) as Count FROM Users" },
        @{ Name = "Active Requests"; Query = "SELECT COUNT(*) as Count FROM FlightCompanionRequests WHERE Status = 'Active'" },
        @{ Name = "Completed Payments"; Query = "SELECT COUNT(*) as Count FROM Payments WHERE Status = 'Completed'" },
        @{ Name = "Recent Messages"; Query = "SELECT COUNT(*) as Count FROM Messages WHERE CreatedAt > DATEADD(day, -7, GETDATE())" },
        @{ Name = "User Verifications"; Query = "SELECT COUNT(*) as Count FROM Users WHERE IsVerified = 1" }
    )
    
    $passedQueries = 0
    $failedQueries = 0
    $results = @()
    
    foreach ($validation in $validationQueries) {
        try {
            $result = Invoke-Sqlcmd -ServerInstance $ServerName -Database $DatabaseName -Query $validation.Query -Username $env:SQL_ADMIN_LOGIN -Password $env:SQL_ADMIN_PASSWORD -QueryTimeout 30
            $count = $result.Count
            
            Write-LogMessage "Info" "Validation '$($validation.Name)': $count records"
            $results += @{ Name = $validation.Name; Count = $count; Status = "Success" }
            $passedQueries++
            
        } catch {
            Write-LogMessage "Warning" "Validation '$($validation.Name)' failed: $($_.Exception.Message)"
            $results += @{ Name = $validation.Name; Error = $_.Exception.Message; Status = "Failed" }
            $failedQueries++
        }
    }
    
    return @{
        PassedQueries = $passedQueries
        FailedQueries = $failedQueries
        Results = $results
        OverallStatus = if ($failedQueries -eq 0) { "Success" } else { "Warning" }
    }
}

function Test-ApplicationFailover {
    param(
        [string]$AppServiceName = "FlightCompanionApp",
        [string]$DRAppServiceName = "FlightCompanionApp-DR"
    )
    
    Write-LogMessage "Info" "=== Starting Application Failover Test ==="
    $testStartTime = Get-Date
    
    try {
        Send-TestNotification -TestName "Application Failover" -Status "In Progress" -Details "Testing app service failover procedures"
        
        # Check current app service status
        $primaryApp = Get-AzWebApp -ResourceGroupName $ResourceGroupName -Name $AppServiceName
        $primaryStatus = $primaryApp.State
        Write-LogMessage "Info" "Primary app service status: $primaryStatus"
        
        # Test staging slot swap (simulated failover)
        Write-LogMessage "Info" "Testing deployment slot swap as failover simulation"
        
        # Verify staging slot exists and is running
        $stagingSlot = Get-AzWebAppSlot -ResourceGroupName $ResourceGroupName -Name $AppServiceName -Slot "staging" -ErrorAction SilentlyContinue
        if (-not $stagingSlot) {
            Write-LogMessage "Warning" "Staging slot not found, creating for test"
            New-AzWebAppSlot -ResourceGroupName $ResourceGroupName -Name $AppServiceName -Slot "staging"
            Start-Sleep -Seconds 30 # Allow time for slot creation
        }
        
        # Perform health check before swap
        $preSwapHealth = Test-ApplicationHealth -AppUrl "https://$AppServiceName-staging.azurewebsites.net"
        
        if ($preSwapHealth.Status -eq "Healthy") {
            # Perform slot swap (simulated failover)
            Write-LogMessage "Info" "Performing deployment slot swap"
            $swapStartTime = Get-Date
            
            Switch-AzWebAppSlot -ResourceGroupName $ResourceGroupName -Name $AppServiceName -SourceSlotName "staging" -DestinationSlotName "production"
            
            $swapDuration = (Get-Date) - $swapStartTime
            Write-LogMessage "Info" "Slot swap completed in $($swapDuration.TotalSeconds) seconds"
            
            # Wait for swap to fully propagate
            Start-Sleep -Seconds 30
            
            # Verify application health after swap
            $postSwapHealth = Test-ApplicationHealth -AppUrl "https://$AppServiceName.azurewebsites.net"
            
            if ($postSwapHealth.Status -eq "Healthy") {
                # Swap back to original state
                Write-LogMessage "Info" "Swapping back to original state"
                Switch-AzWebAppSlot -ResourceGroupName $ResourceGroupName -Name $AppServiceName -SourceSlotName "production" -DestinationSlotName "staging"
                
                $totalDuration = (Get-Date) - $testStartTime
                
                $metrics = @{
                    SwapTimeSeconds = [math]::Round($swapDuration.TotalSeconds, 2)
                    TotalTestTimeMinutes = [math]::Round($totalDuration.TotalMinutes, 2)
                    PreSwapHealthy = $preSwapHealth.Status -eq "Healthy"
                    PostSwapHealthy = $postSwapHealth.Status -eq "Healthy"
                    RTOTarget = "5 minutes"
                    RTOActual = "$([math]::Round($swapDuration.TotalMinutes, 2)) minutes"
                    RTOMet = $swapDuration.TotalMinutes -le 5
                }
                
                $testResult = @{
                    TestType = "ApplicationFailover"
                    Status = "Success"
                    StartTime = $testStartTime
                    EndTime = Get-Date
                    Metrics = $metrics
                    Details = "Application failover test completed successfully"
                }
                
                Send-TestNotification -TestName "Application Failover" -Status "Success" -Details "Failover completed in $($metrics.SwapTimeSeconds) seconds" -Metrics $metrics
                
            } else {
                throw "Application health check failed after swap: $($postSwapHealth.Details)"
            }
            
        } else {
            throw "Staging slot health check failed: $($preSwapHealth.Details)"
        }
        
        $global:TestResults += $testResult
        Write-LogMessage "Info" "=== Application Failover Test Completed Successfully ==="
        
        return $testResult
        
    } catch {
        $errorDetails = $_.Exception.Message
        Write-LogMessage "Error" "Application failover test failed: $errorDetails"
        
        $testResult = @{
            TestType = "ApplicationFailover"
            Status = "Failed"
            StartTime = $testStartTime
            EndTime = Get-Date
            Error = $errorDetails
            Details = "Application failover test failed"
        }
        
        $global:TestResults += $testResult
        Send-TestNotification -TestName "Application Failover" -Status "Failed" -Details $errorDetails
        
        return $testResult
    }
}

function Test-ApplicationHealth {
    param(
        [string]$AppUrl,
        [int]$TimeoutSeconds = 30
    )
    
    try {
        Write-LogMessage "Info" "Testing application health at: $AppUrl"
        
        # Test health endpoint
        $healthResponse = Invoke-RestMethod -Uri "$AppUrl/health" -Method Get -TimeoutSec $TimeoutSeconds
        
        if ($healthResponse -and $healthResponse.status -eq "Healthy") {
            # Test API functionality
            $apiResponse = Invoke-RestMethod -Uri "$AppUrl/api/test" -Method Get -TimeoutSec $TimeoutSeconds
            
            return @{
                Status = "Healthy"
                ResponseTime = $healthResponse.responseTime
                ApiWorking = $apiResponse -ne $null
                Details = "Application responding normally"
            }
        } else {
            return @{
                Status = "Unhealthy"
                Details = "Health endpoint returned unhealthy status"
            }
        }
        
    } catch {
        return @{
            Status = "Unreachable"
            Details = "Application unreachable: $($_.Exception.Message)"
        }
    }
}

function Test-BackupValidation {
    param(
        [int]$SampleSize = 5
    )
    
    Write-LogMessage "Info" "=== Starting Backup Validation Test ==="
    $testStartTime = Get-Date
    
    try {
        Send-TestNotification -TestName "Backup Validation" -Status "In Progress" -Details "Validating recent backup integrity"
        
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -StorageAccountName "fcbackupstorage"
        $storageContext = $storageAccount.Context
        
        # Get recent backups from each container
        $containers = @("scheduled-backups", "manual-backups")
        $validationResults = @()
        $totalBackups = 0
        $validBackups = 0
        
        foreach ($container in $containers) {
            Write-LogMessage "Info" "Validating backups in container: $container"
            
            $recentBackups = Get-AzStorageBlob -Container $container -Context $storageContext | 
                Sort-Object LastModified -Descending | 
                Select-Object -First $SampleSize
            
            foreach ($backup in $recentBackups) {
                $totalBackups++
                Write-LogMessage "Info" "Validating backup: $($backup.Name)"
                
                try {
                    # Download backup metadata
                    $metadataBlob = Get-AzStorageBlob -Container $container -Blob ($backup.Name -replace '\.bacpac$', '-metadata.json') -Context $storageContext -ErrorAction SilentlyContinue
                    
                    # Verify backup file integrity
                    $backupProperties = Get-AzStorageBlobContent -Container $container -Blob $backup.Name -Destination "temp-validation" -Context $storageContext -Force
                    
                    if (Test-Path "temp-validation/$($backup.Name)") {
                        $fileSize = (Get-Item "temp-validation/$($backup.Name)").Length
                        
                        if ($fileSize -gt 1MB) { # Backup should be at least 1MB
                            $validBackups++
                            $validationResults += @{
                                BackupName = $backup.Name
                                Container = $container
                                Size = $fileSize
                                LastModified = $backup.LastModified
                                Status = "Valid"
                            }
                            Write-LogMessage "Info" "Backup validation passed: $($backup.Name)"
                        } else {
                            $validationResults += @{
                                BackupName = $backup.Name
                                Container = $container
                                Status = "Invalid"
                                Reason = "File size too small: $fileSize bytes"
                            }
                            Write-LogMessage "Warning" "Backup validation failed - file too small: $($backup.Name)"
                        }
                        
                        # Cleanup temp file
                        Remove-Item "temp-validation/$($backup.Name)" -Force
                    } else {
                        $validationResults += @{
                            BackupName = $backup.Name
                            Container = $container
                            Status = "Invalid"
                            Reason = "Could not download backup file"
                        }
                        Write-LogMessage "Warning" "Backup validation failed - download failed: $($backup.Name)"
                    }
                    
                } catch {
                    $validationResults += @{
                        BackupName = $backup.Name
                        Container = $container
                        Status = "Error"
                        Reason = $_.Exception.Message
                    }
                    Write-LogMessage "Error" "Backup validation error: $($backup.Name) - $($_.Exception.Message)"
                }
            }
        }
        
        $successRate = if ($totalBackups -gt 0) { ($validBackups / $totalBackups) * 100 } else { 0 }
        $testDuration = (Get-Date) - $testStartTime
        
        $metrics = @{
            TotalBackupsChecked = $totalBackups
            ValidBackups = $validBackups
            InvalidBackups = $totalBackups - $validBackups
            SuccessRate = [math]::Round($successRate, 2)
            TestDurationMinutes = [math]::Round($testDuration.TotalMinutes, 2)
            Target = "95% success rate"
            Met = $successRate -ge 95
        }
        
        $status = if ($successRate -ge 95) { "Success" } elseif ($successRate -ge 80) { "Warning" } else { "Failed" }
        
        $testResult = @{
            TestType = "BackupValidation"
            Status = $status
            StartTime = $testStartTime
            EndTime = Get-Date
            Metrics = $metrics
            ValidationResults = $validationResults
            Details = "Validated $totalBackups backups with $successRate% success rate"
        }
        
        $global:TestResults += $testResult
        
        Send-TestNotification -TestName "Backup Validation" -Status $status -Details "Validated $totalBackups backups with $successRate% success rate" -Metrics $metrics
        Write-LogMessage "Info" "=== Backup Validation Test Completed ==="
        
        return $testResult
        
    } catch {
        $errorDetails = $_.Exception.Message
        Write-LogMessage "Error" "Backup validation test failed: $errorDetails"
        
        $testResult = @{
            TestType = "BackupValidation"
            Status = "Failed"
            StartTime = $testStartTime
            EndTime = Get-Date
            Error = $errorDetails
            Details = "Backup validation test failed"
        }
        
        $global:TestResults += $testResult
        Send-TestNotification -TestName "Backup Validation" -Status "Failed" -Details $errorDetails
        
        return $testResult
    }
}

function Test-FullDisasterRecovery {
    Write-LogMessage "Info" "=== Starting Full Disaster Recovery Test ==="
    $testStartTime = Get-Date
    
    try {
        Send-TestNotification -TestName "Full DR Simulation" -Status "In Progress" -Details "Starting comprehensive disaster recovery simulation"
        
        # Phase 1: Database failover
        Write-LogMessage "Info" "Phase 1: Testing database failover"
        $dbResult = Test-DatabaseRestore -RestorePointMinutesAgo 30
        
        if ($dbResult.Status -ne "Success") {
            throw "Database restore phase failed"
        }
        
        # Phase 2: Application failover
        Write-LogMessage "Info" "Phase 2: Testing application failover"
        $appResult = Test-ApplicationFailover
        
        if ($appResult.Status -ne "Success") {
            throw "Application failover phase failed"
        }
        
        # Phase 3: Backup validation
        Write-LogMessage "Info" "Phase 3: Validating backup integrity"
        $backupResult = Test-BackupValidation -SampleSize 3
        
        # Calculate overall metrics
        $totalDuration = (Get-Date) - $testStartTime
        
        $overallStatus = if ($dbResult.Status -eq "Success" -and 
                            $appResult.Status -eq "Success" -and 
                            $backupResult.Status -in @("Success", "Warning")) { 
            "Success" 
        } else { 
            "Failed" 
        }
        
        $metrics = @{
            TotalTestTimeMinutes = [math]::Round($totalDuration.TotalMinutes, 2)
            DatabaseRestoreTime = $dbResult.Metrics.RestoreTimeMinutes
            ApplicationFailoverTime = $appResult.Metrics.SwapTimeSeconds
            BackupValidationRate = $backupResult.Metrics.SuccessRate
            RTOTarget = "120 minutes"
            RTOActual = "$([math]::Round($totalDuration.TotalMinutes, 2)) minutes"
            RTOMet = $totalDuration.TotalMinutes -le 120
            PhasesPassed = @($dbResult, $appResult, $backupResult | Where-Object {$_.Status -in @("Success", "Warning")}).Count
            TotalPhases = 3
        }
        
        $testResult = @{
            TestType = "FullDisasterRecovery"
            Status = $overallStatus
            StartTime = $testStartTime
            EndTime = Get-Date
            Metrics = $metrics
            PhaseResults = @{
                DatabaseRestore = $dbResult
                ApplicationFailover = $appResult
                BackupValidation = $backupResult
            }
            Details = "Full DR simulation completed with $($metrics.PhasesPassed)/$($metrics.TotalPhases) phases successful"
        }
        
        $global:TestResults += $testResult
        
        Send-TestNotification -TestName "Full DR Simulation" -Status $overallStatus -Details "Completed in $($metrics.TotalTestTimeMinutes) minutes with $($metrics.PhasesPassed)/$($metrics.TotalPhases) phases successful" -Metrics $metrics
        Write-LogMessage "Info" "=== Full Disaster Recovery Test Completed ==="
        
        return $testResult
        
    } catch {
        $errorDetails = $_.Exception.Message
        Write-LogMessage "Error" "Full DR test failed: $errorDetails"
        
        $testResult = @{
            TestType = "FullDisasterRecovery"
            Status = "Failed"
            StartTime = $testStartTime
            EndTime = Get-Date
            Error = $errorDetails
            Details = "Full disaster recovery test failed"
        }
        
        $global:TestResults += $testResult
        Send-TestNotification -TestName "Full DR Simulation" -Status "Failed" -Details $errorDetails
        
        return $testResult
    }
}

function Generate-TestReport {
    param([array]$Results)
    
    Write-LogMessage "Info" "Generating comprehensive test report"
    
    $report = @{
        TestSession = @{
            SessionId = [System.Guid]::NewGuid().ToString()
            StartTime = ($Results | Sort-Object StartTime | Select-Object -First 1).StartTime
            EndTime = ($Results | Sort-Object EndTime | Select-Object -Last 1).EndTime
            Environment = $env:ENVIRONMENT_NAME
            TesterInfo = @{
                User = $env:USERNAME
                Machine = $env:COMPUTERNAME
                ScriptVersion = "1.0"
            }
        }
        Summary = @{
            TotalTests = $Results.Count
            PassedTests = ($Results | Where-Object {$_.Status -eq "Success"}).Count
            FailedTests = ($Results | Where-Object {$_.Status -eq "Failed"}).Count
            WarningTests = ($Results | Where-Object {$_.Status -eq "Warning"}).Count
            OverallStatus = if (($Results | Where-Object {$_.Status -eq "Failed"}).Count -eq 0) { "Pass" } else { "Fail" }
        }
        TestResults = $Results
        Recommendations = @()
    }
    
    # Add recommendations based on results
    foreach ($result in $Results) {
        if ($result.Status -eq "Failed") {
            $report.Recommendations += "CRITICAL: Address $($result.TestType) failure - $($result.Error)"
        } elseif ($result.Status -eq "Warning") {
            $report.Recommendations += "WARNING: Review $($result.TestType) - performance or validation issues detected"
        }
        
        # Check RTO compliance
        if ($result.Metrics -and $result.Metrics.RTOMet -eq $false) {
            $report.Recommendations += "RTO TARGET MISSED: $($result.TestType) took $($result.Metrics.RTOActual) vs target $($result.Metrics.RTOTarget)"
        }
    }
    
    if ($report.Recommendations.Count -eq 0) {
        $report.Recommendations += "All tests passed successfully. DR procedures are functioning as expected."
    }
    
    # Save report
    $reportJson = $report | ConvertTo-Json -Depth 5
    $reportFile = "DR-Test-Report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $reportJson | Out-File $reportFile
    
    Write-LogMessage "Info" "Test report saved: $reportFile"
    
    # Send summary notification
    Send-TestNotification -TestName "DR Test Session Complete" -Status $report.Summary.OverallStatus -Details "Completed $($report.Summary.TotalTests) tests: $($report.Summary.PassedTests) passed, $($report.Summary.FailedTests) failed, $($report.Summary.WarningTests) warnings"
    
    return $report
}

# Main execution
Write-LogMessage "Info" "=== Disaster Recovery Testing Script Started ==="
Write-LogMessage "Info" "Test Type: $TestType"
Write-LogMessage "Info" "Environment: $env:ENVIRONMENT_NAME"

# Validate required environment variables
$requiredVars = @("AZURE_SUBSCRIPTION_ID", "SQL_ADMIN_LOGIN", "SQL_ADMIN_PASSWORD")
foreach ($var in $requiredVars) {
    if (-not (Get-Variable -Name $var -Scope Global -ErrorAction SilentlyContinue)) {
        Write-LogMessage "Error" "Required environment variable not set: $var"
        exit 1
    }
}

# Set Azure context
Set-AzContext -SubscriptionId $SubscriptionId

# Execute tests based on type
switch ($TestType.ToLower()) {
    "databaserestore" {
        $result = Test-DatabaseRestore
    }
    "applicationfailover" {
        $result = Test-ApplicationFailover
    }
    "backupvalidation" {
        $result = Test-BackupValidation
    }
    "fulldr" {
        $result = Test-FullDisasterRecovery
    }
    default {
        Write-LogMessage "Error" "Unknown test type: $TestType"
        exit 1
    }
}

# Generate comprehensive report
$report = Generate-TestReport -Results $TestResults

# Output summary
Write-LogMessage "Info" "=== Test Results Summary ==="
Write-LogMessage "Info" "Overall Status: $($report.Summary.OverallStatus)"
Write-LogMessage "Info" "Tests Passed: $($report.Summary.PassedTests)/$($report.Summary.TotalTests)"

if ($report.Summary.OverallStatus -eq "Pass") {
    Write-LogMessage "Info" "=== Disaster Recovery Testing Completed Successfully ==="
    exit 0
} else {
    Write-LogMessage "Error" "=== Disaster Recovery Testing Failed ==="
    Write-LogMessage "Error" "Recommendations:"
    foreach ($rec in $report.Recommendations) {
        Write-LogMessage "Error" "  - $rec"
    }
    exit 1
}
