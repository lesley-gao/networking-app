# Automated Backup and Disaster Recovery Plan

## Overview

This document outlines the comprehensive backup and disaster recovery (DR) strategy for the Flight Companion & Airport Pickup Platform. The plan ensures data protection, business continuity, and rapid recovery from various failure scenarios.

## Table of Contents

1. [Backup Strategy Overview](#backup-strategy-overview)
2. [Azure Backup Configuration](#azure-backup-configuration)
3. [Database Backup Procedures](#database-backup-procedures)
4. [Application Data Backup](#application-data-backup)
5. [Disaster Recovery Scenarios](#disaster-recovery-scenarios)
6. [Recovery Time and Point Objectives](#recovery-time-and-point-objectives)
7. [Testing Protocols](#testing-protocols)
8. [Monitoring and Alerting](#monitoring-and-alerting)
9. [Documentation and Runbooks](#documentation-and-runbooks)
10. [Compliance and Audit](#compliance-and-audit)

## Backup Strategy Overview

### Backup Types

| Backup Type | Frequency | Retention | Purpose |
|-------------|-----------|-----------|---------|
| **Full Database Backup** | Daily | 30 days | Complete database restoration |
| **Incremental Database Backup** | Every 15 minutes | 7 days | Point-in-time recovery |
| **Application Files Backup** | Daily | 14 days | Application code and configuration |
| **User Documents Backup** | Real-time | 90 days | Verification documents and uploads |
| **Configuration Backup** | On change | 30 days | Infrastructure and app settings |
| **System State Backup** | Daily | 7 days | OS and system configuration |

### Backup Locations

#### Primary Backups
- **Azure SQL Database**: Automated backups with geo-redundancy
- **Azure Blob Storage**: Cross-region replication
- **Azure App Service**: Configuration and deployment slots

#### Secondary Backups (Disaster Recovery)
- **Secondary Azure Region**: Australia Southeast (Sydney)
- **Local Development Backup**: Weekly offline backups
- **Third-party Backup Service**: Veeam Cloud Connect

### Recovery Tiers

| Tier | RTO | RPO | Use Case |
|------|-----|-----|----------|
| **Tier 1 - Critical** | 1 hour | 15 minutes | User data, payments, active bookings |
| **Tier 2 - Important** | 4 hours | 1 hour | User profiles, messaging, ratings |
| **Tier 3 - Standard** | 24 hours | 4 hours | Historical data, analytics, logs |

## Azure Backup Configuration

### Azure SQL Database Backup

#### Automated Backup Settings
```json
{
  "databaseBackupPolicy": {
    "retentionPolicy": {
      "shortTermRetention": {
        "retentionDays": 35,
        "diffBackupIntervalInHours": 12
      },
      "longTermRetention": {
        "weeklyRetention": "P4W",
        "monthlyRetention": "P12M",
        "yearlyRetention": "P7Y",
        "weekOfYear": 1
      }
    },
    "geoRedundantBackup": true,
    "geoRedundantBackupRegion": "australiasoutheast"
  }
}
```

#### Point-in-Time Restore Configuration
- **Retention Period**: 35 days
- **Granularity**: Every 5-10 minutes
- **Geographic Restore**: Available in secondary region
- **Zone Redundant Storage**: Enabled for production

### Azure Blob Storage Backup

#### Cross-Region Replication
```json
{
  "storageAccount": {
    "replication": {
      "primary": "australiaeast",
      "secondary": "australiasoutheast",
      "replicationType": "RA-GRS",
      "accessTier": "Hot"
    },
    "versioning": {
      "enabled": true,
      "retentionDays": 90
    },
    "softDelete": {
      "enabled": true,
      "retentionDays": 30
    }
  }
}
```

#### Container Backup Policies
- **Verification Documents**: 90-day retention, geo-redundant
- **Profile Images**: 30-day retention, locally redundant
- **Application Logs**: 60-day retention, zone redundant
- **System Backups**: 14-day retention, geo-redundant

### Azure App Service Backup

#### Automated Backup Configuration
```json
{
  "appServiceBackup": {
    "frequency": "Daily",
    "retentionPeriodInDays": 30,
    "startTime": "02:00",
    "timeZone": "New Zealand Standard Time",
    "includeFiles": true,
    "includeDatabases": false,
    "storageAccountUrl": "https://fcbackups.blob.core.windows.net/appservice-backups"
  }
}
```

## Database Backup Procedures

### Automated Database Backups

#### Full Backup Process
1. **Scheduled Full Backups**: Daily at 2:00 AM NZST
2. **Verification**: Automated backup integrity check
3. **Compression**: Enable backup compression for storage efficiency
4. **Encryption**: Transparent Data Encryption (TDE) enabled
5. **Geo-Replication**: Immediate replication to secondary region

#### Transaction Log Backups
1. **Frequency**: Every 15 minutes
2. **Retention**: 7 days for point-in-time recovery
3. **Monitoring**: Automated alerts for backup failures
4. **Validation**: Regular restore testing

### Manual Backup Procedures

#### Pre-Deployment Backup
```sql
-- Create manual backup before major deployments
BACKUP DATABASE [FlightCompanionDB] 
TO URL = 'https://fcbackups.blob.core.windows.net/manual-backups/pre-deployment-{timestamp}.bak'
WITH COMPRESSION, ENCRYPTION (
    ALGORITHM = AES_256,
    SERVER CERTIFICATE = FlightCompanionDBCert
);
```

#### Emergency Backup Script
```powershell
# Emergency manual backup script
param(
    [string]$DatabaseName = "FlightCompanionDB",
    [string]$BackupLocation = "manual-emergency",
    [string]$Reason = "Emergency"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "$DatabaseName-emergency-$timestamp.bak"

# Execute backup
$query = @"
BACKUP DATABASE [$DatabaseName] 
TO URL = 'https://fcbackups.blob.core.windows.net/$BackupLocation/$backupName'
WITH COMPRESSION, ENCRYPTION (
    ALGORITHM = AES_256,
    SERVER CERTIFICATE = FlightCompanionDBCert
),
DESCRIPTION = 'Emergency backup - $Reason';
"@

Invoke-SqlCmd -Query $query -ServerInstance $env:SQL_SERVER_NAME
Write-Host "Emergency backup completed: $backupName"
```

## Application Data Backup

### Source Code and Configuration

#### Git Repository Backup
- **Primary Repository**: GitHub (lesley-gao/networking-app)
- **Mirror Repository**: Azure DevOps (automated sync)
- **Local Backup**: Weekly full clone to secure storage
- **Branch Protection**: All critical branches protected

#### Configuration Management
```yaml
# Azure DevOps Pipeline for configuration backup
trigger:
  branches:
    include:
    - main
    - staging
  paths:
    include:
    - infra/*
    - backend/appsettings*.json
    - Scripts/*

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: AzureCLI@2
  displayName: 'Backup Configuration Files'
  inputs:
    azureSubscription: 'Azure-Backup-Service-Connection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      # Backup infrastructure templates
      az storage blob upload-batch \
        --destination "configuration-backups/$(Build.BuildNumber)" \
        --source "infra/" \
        --account-name "fcbackupstorage" \
        --pattern "*.bicep,*.json"
      
      # Backup application settings
      az storage blob upload-batch \
        --destination "app-settings-backups/$(Build.BuildNumber)" \
        --source "backend/" \
        --account-name "fcbackupstorage" \
        --pattern "appsettings*.json"
```

### Key Vault and Secrets Backup

#### Automated Secret Backup
```powershell
# Daily secret backup script
$vaultName = "FlightCompanionKeyVault"
$backupContainer = "secret-backups"
$timestamp = Get-Date -Format "yyyyMMdd"

# Get all secrets
$secrets = Get-AzKeyVaultSecret -VaultName $vaultName

foreach ($secret in $secrets) {
    $secretValue = Get-AzKeyVaultSecret -VaultName $vaultName -Name $secret.Name -AsPlainText
    $backupData = @{
        Name = $secret.Name
        Value = $secretValue
        ContentType = $secret.ContentType
        Tags = $secret.Tags
        Created = $secret.Created
        Updated = $secret.Updated
    } | ConvertTo-Json
    
    # Store encrypted backup
    $encryptedData = $backupData | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString
    Set-Content -Path "temp-$($secret.Name).json" -Value $encryptedData
    
    # Upload to secure storage
    az storage blob upload \
        --file "temp-$($secret.Name).json" \
        --name "$timestamp/$($secret.Name).json" \
        --container-name $backupContainer \
        --account-name "fcbackupstorage"
    
    Remove-Item "temp-$($secret.Name).json"
}
```

## Disaster Recovery Scenarios

### Scenario 1: Complete Region Failure

#### Impact Assessment
- **Primary Region**: Australia East (Sydney) unavailable
- **Affected Services**: All application services, database, storage
- **Estimated Duration**: 4-24 hours region-wide outage

#### Recovery Procedure
1. **Immediate Actions (0-15 minutes)**
   - Activate incident response team
   - Assess scope of outage
   - Communicate with stakeholders
   - Initiate failover procedures

2. **Database Failover (15-30 minutes)**
   ```powershell
   # Initiate geo-restore to secondary region
   $newDatabase = Restore-AzSqlDatabase `
     -FromGeoBackup `
     -ResourceGroupName "FlightCompanion-DR" `
     -ServerName "fc-sql-australiasoutheast" `
     -TargetDatabaseName "FlightCompanionDB" `
     -ResourceId "/subscriptions/.../backups/FlightCompanionDB"
   ```

3. **Application Service Recovery (30-60 minutes)**
   - Deploy application to secondary region
   - Update DNS records to point to DR site
   - Verify all services are operational
   - Update configuration for new region

4. **Data Validation (60-90 minutes)**
   - Verify database integrity
   - Check application functionality
   - Validate user authentication
   - Test critical user journeys

### Scenario 2: Database Corruption

#### Impact Assessment
- **Affected Component**: Primary database
- **User Impact**: Complete service unavailability
- **Recovery Time**: 2-4 hours

#### Recovery Procedure
1. **Immediate Assessment**
   ```sql
   -- Check database corruption
   DBCC CHECKDB('FlightCompanionDB') WITH NO_INFOMSGS;
   ```

2. **Point-in-Time Restore**
   ```powershell
   # Restore to point before corruption
   $restorePoint = (Get-Date).AddHours(-1)
   Restore-AzSqlDatabase `
     -FromPointInTimeBackup `
     -PointInTime $restorePoint `
     -ResourceGroupName "FlightCompanion-Prod" `
     -ServerName "fc-sql-australiaeast" `
     -TargetDatabaseName "FlightCompanionDB-Restored"
   ```

3. **Data Validation and Cutover**
   - Validate restored database
   - Update connection strings
   - Test application functionality
   - Switch traffic to restored database

### Scenario 3: Application Service Failure

#### Impact Assessment
- **Affected Component**: Azure App Service
- **User Impact**: Website and API unavailability
- **Recovery Time**: 30 minutes - 2 hours

#### Recovery Procedure
1. **Deployment Slot Swap**
   ```powershell
   # Quick recovery using deployment slots
   Switch-AzWebAppSlot `
     -ResourceGroupName "FlightCompanion-Prod" `
     -Name "FlightCompanionApp" `
     -SourceSlotName "staging" `
     -DestinationSlotName "production"
   ```

2. **Alternative: Redeploy from Backup**
   ```yaml
   # Emergency redeployment pipeline
   steps:
   - task: DownloadBuildArtifacts@0
     inputs:
       artifactName: 'latest-known-good'
   
   - task: AzureWebApp@1
     inputs:
       azureSubscription: 'Production'
       appName: 'FlightCompanionApp'
       package: '$(System.ArtifactsDirectory)/latest-known-good'
   ```

## Recovery Time and Point Objectives

### Service Level Targets

| Service Component | RTO Target | RPO Target | Availability Target |
|-------------------|------------|------------|-------------------|
| **User Authentication** | 15 minutes | 5 minutes | 99.9% |
| **Flight Companion Matching** | 30 minutes | 15 minutes | 99.5% |
| **Payment Processing** | 10 minutes | 1 minute | 99.95% |
| **Messaging System** | 45 minutes | 30 minutes | 99.0% |
| **User Verification** | 2 hours | 1 hour | 99.0% |
| **Admin Dashboard** | 4 hours | 4 hours | 95.0% |

### Business Impact Analysis

#### Critical Services (Tier 1)
- **User Authentication**: Required for all platform access
- **Payment Processing**: Financial transactions and escrow
- **Active Bookings**: In-progress service requests
- **Emergency Contacts**: Safety-critical functionality

#### Important Services (Tier 2)
- **New Bookings**: Service request creation
- **Messaging**: User communication
- **Notifications**: Real-time updates
- **Rating System**: Post-service feedback

#### Standard Services (Tier 3)
- **User Profiles**: Profile management
- **Search History**: Previous searches
- **Analytics Dashboard**: Business intelligence
- **Admin Functions**: Platform management

## Testing Protocols

### Monthly DR Tests

#### Test Schedule
- **First Tuesday of Every Month**: Database restore test
- **Second Tuesday of Every Month**: Application failover test
- **Third Tuesday of Every Month**: Full region failover simulation
- **Fourth Tuesday of Every Month**: Backup integrity verification

#### Database Restore Test Procedure
```powershell
# Monthly database restore test
param(
    [string]$TestDate = (Get-Date -Format "yyyyMMdd"),
    [string]$SourceDatabase = "FlightCompanionDB",
    [string]$TestDatabase = "FlightCompanionDB-DrTest-$TestDate"
)

# 1. Create point-in-time restore
$restorePoint = (Get-Date).AddDays(-1)
Write-Host "Starting restore test for $TestDate"

$restoreJob = Restore-AzSqlDatabase `
    -FromPointInTimeBackup `
    -PointInTime $restorePoint `
    -ResourceGroupName "FlightCompanion-Test" `
    -ServerName "fc-sql-test" `
    -TargetDatabaseName $TestDatabase `
    -AsJob

# 2. Wait for restore completion
$restoreJob | Wait-Job
$restoreResult = $restoreJob | Receive-Job

if ($restoreResult.State -eq "Online") {
    Write-Host "✅ Database restore successful"
    
    # 3. Run validation queries
    $validationQueries = @(
        "SELECT COUNT(*) FROM Users",
        "SELECT COUNT(*) FROM FlightCompanionRequests", 
        "SELECT COUNT(*) FROM Payments WHERE Status = 'Completed'",
        "SELECT TOP 1 * FROM AuditLog ORDER BY Timestamp DESC"
    )
    
    foreach ($query in $validationQueries) {
        $result = Invoke-SqlCmd -Query $query -Database $TestDatabase -ServerInstance "fc-sql-test.database.windows.net"
        Write-Host "Query result: $query = $($result[0])"
    }
    
    # 4. Cleanup test database
    Remove-AzSqlDatabase -ResourceGroupName "FlightCompanion-Test" -ServerName "fc-sql-test" -DatabaseName $TestDatabase -Force
    Write-Host "✅ Test database cleaned up"
    
    # 5. Log test results
    $testResult = @{
        TestDate = $TestDate
        TestType = "DatabaseRestore"
        Status = "Success"
        Duration = $restoreJob.PSEndTime - $restoreJob.PSBeginTime
        ValidationResults = $validationQueries.Count
    } | ConvertTo-Json
    
    # Store test results
    $testResult | Out-File "DrTestResults-$TestDate.json"
    
} else {
    Write-Error "❌ Database restore failed: $($restoreResult.State)"
    # Send alert to operations team
}
```

### Quarterly Full DR Simulation

#### Simulation Scope
- Complete primary region failure
- Full application stack recovery
- User acceptance testing
- Performance validation
- Communication procedures

#### Simulation Checklist
```markdown
# Quarterly DR Simulation Checklist

## Pre-Simulation (T-1 Week)
- [ ] Schedule simulation window (off-peak hours)
- [ ] Notify all stakeholders
- [ ] Prepare test scenarios and validation scripts
- [ ] Verify backup integrity
- [ ] Update emergency contact lists

## Simulation Execution (T-0)
- [ ] **T+0**: Declare simulated disaster
- [ ] **T+5**: Activate incident response team
- [ ] **T+10**: Begin database failover procedures
- [ ] **T+30**: Start application service recovery
- [ ] **T+60**: Initiate DNS failover
- [ ] **T+90**: Begin user acceptance testing
- [ ] **T+120**: Validate all critical functions

## Post-Simulation (T+1 Day)
- [ ] Document lessons learned
- [ ] Update DR procedures based on findings
- [ ] Schedule remediation actions
- [ ] Update RTO/RPO targets if needed
- [ ] Distribute simulation report to stakeholders

## Success Criteria
- [ ] Database restored within RTO target (1 hour)
- [ ] Application services operational within RTO target (2 hours)
- [ ] All critical user journeys functional
- [ ] Payment processing system operational
- [ ] User authentication working correctly
- [ ] Data integrity verified (no data loss)
```

### Backup Validation Tests

#### Weekly Backup Integrity Test
```powershell
# Weekly backup validation script
$backupTests = @()

# Test database backups
$latestBackup = Get-AzSqlDatabaseGeoBackup -ResourceGroupName "FlightCompanion-Prod" -ServerName "fc-sql-australiaeast" | Sort-Object BackupTime -Descending | Select-Object -First 1

if ($latestBackup) {
    $testRestore = Restore-AzSqlDatabase -FromGeoBackup -ResourceId $latestBackup.ResourceId -ResourceGroupName "FlightCompanion-Test" -ServerName "fc-sql-test" -TargetDatabaseName "ValidationTest-$(Get-Date -Format 'yyyyMMddHHmm')"
    
    if ($testRestore.Status -eq "Online") {
        $backupTests += @{
            Type = "DatabaseBackup"
            Status = "Success" 
            BackupDate = $latestBackup.BackupTime
            ValidationDate = Get-Date
        }
    }
}

# Test blob storage backups
$storageTests = @()
$testContainers = @("verification-documents", "user-profiles", "application-logs")

foreach ($container in $testContainers) {
    $latestBlobs = Get-AzStorageBlob -Container $container -Context $storageContext | Sort-Object LastModified -Descending | Select-Object -First 5
    
    foreach ($blob in $latestBlobs) {
        $downloadTest = Get-AzStorageBlobContent -Blob $blob.Name -Container $container -Destination "temp-validation" -Context $storageContext
        if (Test-Path "temp-validation/$($blob.Name)") {
            $storageTests += @{
                Container = $container
                Blob = $blob.Name
                Status = "Success"
                Size = $blob.Length
            }
            Remove-Item "temp-validation/$($blob.Name)" -Force
        }
    }
}

# Generate validation report
$validationReport = @{
    TestDate = Get-Date
    DatabaseBackups = $backupTests
    StorageBackups = $storageTests
    Summary = @{
        TotalTests = $backupTests.Count + $storageTests.Count
        SuccessfulTests = ($backupTests + $storageTests | Where-Object {$_.Status -eq "Success"}).Count
        FailedTests = ($backupTests + $storageTests | Where-Object {$_.Status -ne "Success"}).Count
    }
} | ConvertTo-Json -Depth 3

$validationReport | Out-File "BackupValidation-$(Get-Date -Format 'yyyyMMdd').json"

# Send results to monitoring system
if ($validationReport.Summary.FailedTests -gt 0) {
    # Send alert for failed backup validations
    Send-AlertNotification -Subject "Backup Validation Failures Detected" -Body $validationReport
}
```

## Monitoring and Alerting

### Azure Monitor Alerts

#### Database Backup Alerts
```json
{
  "alertRules": [
    {
      "name": "Database Backup Failure",
      "description": "Alert when database backup fails",
      "severity": 1,
      "condition": {
        "allOf": [
          {
            "field": "category",
            "equals": "SQLSecurityAuditEvents"
          },
          {
            "field": "operationName",
            "equals": "Database Backup Failed"
          }
        ]
      },
      "actions": [
        {
          "actionGroupId": "/subscriptions/.../actionGroups/DatabaseAlertsGroup",
          "emailSubject": "CRITICAL: Database Backup Failure"
        }
      ]
    },
    {
      "name": "Backup Storage Usage High",
      "description": "Alert when backup storage usage exceeds 80%",
      "severity": 2,
      "condition": {
        "metricName": "storage_percent",
        "threshold": 80,
        "operator": "GreaterThan",
        "timeAggregation": "Average",
        "windowSize": "PT5M"
      }
    }
  ]
}
```

#### Application Service Alerts
```json
{
  "alertRules": [
    {
      "name": "App Service Unavailable",
      "description": "Alert when app service is not responding",
      "severity": 1,
      "condition": {
        "webTestId": "/subscriptions/.../webTests/FlightCompanionHealthCheck",
        "failureThreshold": 2,
        "timeWindow": "PT5M"
      },
      "actions": [
        {
          "actionGroupId": "/subscriptions/.../actionGroups/IncidentResponseTeam",
          "webhookUrl": "https://hooks.slack.com/services/.../operations-alerts"
        }
      ]
    }
  ]
}
```

### Custom Monitoring Scripts

#### Health Check Dashboard
```powershell
# Daily health check and backup status script
param(
    [string]$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID,
    [string]$ResourceGroup = "FlightCompanion-Prod"
)

# Set context
Set-AzContext -SubscriptionId $SubscriptionId

# Check database backup status
$dbBackupStatus = Get-AzSqlDatabaseBackupShortTermRetentionPolicy -ResourceGroupName $ResourceGroup -ServerName "fc-sql-australiaeast" -DatabaseName "FlightCompanionDB"

# Check storage replication status
$storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroup -Name "fcprodstorage"
$replicationStatus = $storageAccount.StatusOfPrimary

# Check App Service backup status
$appServiceBackup = Get-AzWebAppBackupList -ResourceGroupName $ResourceGroup -Name "FlightCompanionApp" | Sort-Object Created -Descending | Select-Object -First 1

# Generate health report
$healthReport = @{
    Timestamp = Get-Date
    DatabaseBackup = @{
        Status = if ($dbBackupStatus.RetentionDays -ge 7) { "Healthy" } else { "Warning" }
        RetentionDays = $dbBackupStatus.RetentionDays
        LastBackup = $dbBackupStatus.EarliestRestoreDate
    }
    StorageReplication = @{
        Status = $replicationStatus
        AccountName = $storageAccount.StorageAccountName
        ReplicationType = $storageAccount.Sku.Name
    }
    ApplicationBackup = @{
        Status = if ($appServiceBackup -and $appServiceBackup.BackupStatus -eq "Succeeded") { "Healthy" } else { "Failed" }
        LastBackup = $appServiceBackup.Created
        BackupSize = $appServiceBackup.BackupSizeInBytes
    }
    OverallHealth = "Calculating..."
}

# Calculate overall health
$healthScores = @()
$healthScores += if ($healthReport.DatabaseBackup.Status -eq "Healthy") { 1 } else { 0 }
$healthScores += if ($healthReport.StorageReplication.Status -eq "Available") { 1 } else { 0 }
$healthScores += if ($healthReport.ApplicationBackup.Status -eq "Healthy") { 1 } else { 0 }

$overallScore = ($healthScores | Measure-Object -Sum).Sum / $healthScores.Count * 100
$healthReport.OverallHealth = if ($overallScore -ge 90) { "Excellent" } elseif ($overallScore -ge 70) { "Good" } elseif ($overallScore -ge 50) { "Warning" } else { "Critical" }

# Output report
$healthReport | ConvertTo-Json -Depth 2 | Out-File "HealthReport-$(Get-Date -Format 'yyyyMMdd').json"

# Send to monitoring dashboard
if ($healthReport.OverallHealth -in @("Warning", "Critical")) {
    # Send alert to operations team
    $alertPayload = @{
        AlertType = "BackupHealthCheck"
        Severity = if ($healthReport.OverallHealth -eq "Critical") { "High" } else { "Medium" }
        Message = "Backup health check shows $($healthReport.OverallHealth) status"
        Details = $healthReport
    } | ConvertTo-Json -Depth 3
    
    # Post to monitoring webhook
    Invoke-RestMethod -Uri $env:MONITORING_WEBHOOK_URL -Method Post -Body $alertPayload -ContentType "application/json"
}

Write-Host "Health check completed. Overall status: $($healthReport.OverallHealth)"
```

## Documentation and Runbooks

### Emergency Response Runbooks

#### Database Emergency Recovery Runbook
```markdown
# Database Emergency Recovery Runbook

## Purpose
This runbook provides step-by-step instructions for recovering from database failures.

## Trigger Conditions
- Database connectivity errors lasting > 5 minutes
- Database corruption detected
- Performance degradation > 50% for > 15 minutes
- Primary region failure affecting database

## Prerequisites
- Azure CLI access with appropriate permissions
- SQL Server Management Studio or Azure Data Studio
- Access to backup storage accounts
- Emergency contact information

## Recovery Steps

### Step 1: Assess the Situation (0-5 minutes)
1. **Check Azure Service Health**
   - Navigate to https://status.azure.com/
   - Check Australia East region status
   - Look for database service issues

2. **Verify Database Connectivity**
   ```powershell
   # Test database connection
   $connectionString = "Server=fc-sql-australiaeast.database.windows.net;Database=FlightCompanionDB;Integrated Security=true;"
   try {
       $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
       $connection.Open()
       Write-Host "✅ Database connection successful"
       $connection.Close()
   } catch {
       Write-Host "❌ Database connection failed: $($_.Exception.Message)"
   }
   ```

3. **Check Application Health**
   - Test API endpoints: /health, /api/users/me
   - Monitor Application Insights for errors
   - Check user reports and support tickets

### Step 2: Determine Recovery Strategy (5-10 minutes)
1. **Minor Issues** (Response time slow, intermittent errors)
   - Scale up database tier temporarily
   - Review recent deployments
   - Check for blocking queries

2. **Major Issues** (Complete failure, corruption)
   - Proceed to point-in-time restore
   - Consider geo-restore if region issue
   - Activate incident response team

### Step 3: Execute Recovery (10-60 minutes)
1. **Point-in-Time Restore**
   ```powershell
   # Restore database to 15 minutes ago
   $restorePoint = (Get-Date).AddMinutes(-15)
   $newDatabase = Restore-AzSqlDatabase `
     -FromPointInTimeBackup `
     -PointInTime $restorePoint `
     -ResourceGroupName "FlightCompanion-Prod" `
     -ServerName "fc-sql-australiaeast" `
     -TargetDatabaseName "FlightCompanionDB-Recovered"
   ```

2. **Geo-Restore (Region Failure)**
   ```powershell
   # Restore to secondary region
   $geoBackup = Get-AzSqlDatabaseGeoBackup -ResourceGroupName "FlightCompanion-Prod" -ServerName "fc-sql-australiaeast" -DatabaseName "FlightCompanionDB"
   $recoveredDatabase = Restore-AzSqlDatabase `
     -FromGeoBackup `
     -ResourceId $geoBackup.ResourceId `
     -ResourceGroupName "FlightCompanion-DR" `
     -ServerName "fc-sql-australiasoutheast" `
     -TargetDatabaseName "FlightCompanionDB"
   ```

### Step 4: Validation and Cutover (60-90 minutes)
1. **Validate Restored Database**
   ```sql
   -- Check data integrity
   DBCC CHECKDB('FlightCompanionDB-Recovered') WITH NO_INFOMSGS;
   
   -- Verify critical data
   SELECT COUNT(*) as UserCount FROM Users;
   SELECT COUNT(*) as ActiveBookings FROM FlightCompanionRequests WHERE Status = 'Active';
   SELECT COUNT(*) as PendingPayments FROM Payments WHERE Status = 'Pending';
   ```

2. **Update Application Configuration**
   - Update connection strings in Key Vault
   - Restart App Service to pick up new connection
   - Test critical application functions

3. **Monitor and Verify**
   - Check application logs for errors
   - Test user authentication and core features
   - Monitor performance metrics

### Step 5: Post-Recovery Actions (90+ minutes)
1. **Communication**
   - Notify stakeholders of recovery completion
   - Update status page if public incident
   - Document incident for post-mortem

2. **Cleanup**
   - Remove failed database after 24 hours
   - Update monitoring alerts if needed
   - Schedule incident review meeting

## Escalation Contacts
- **Primary DBA**: [Contact Information]
- **Azure Support**: Case portal or phone
- **Development Team Lead**: [Contact Information]
- **Operations Manager**: [Contact Information]
```

#### Application Service Recovery Runbook
```markdown
# Application Service Recovery Runbook

## Purpose
Recovery procedures for Azure App Service failures affecting the Flight Companion platform.

## Trigger Conditions
- App Service returning 5xx errors for > 2 minutes
- Complete service unavailability
- Deployment failures requiring rollback
- Performance degradation > 75%

## Recovery Steps

### Step 1: Quick Assessment (0-2 minutes)
1. **Check App Service Status**
   ```powershell
   # Check app service status
   Get-AzWebApp -ResourceGroupName "FlightCompanion-Prod" -Name "FlightCompanionApp" | Select-Object State, HostNames, LastModifiedTimeUtc
   ```

2. **Review Recent Deployments**
   - Check GitHub Actions for recent deployments
   - Review Application Insights for new exceptions
   - Check Azure Activity Log for configuration changes

### Step 2: Immediate Recovery Actions (2-15 minutes)
1. **Deployment Slot Swap (Fastest Recovery)**
   ```powershell
   # Swap to staging slot (known good version)
   Switch-AzWebAppSlot `
     -ResourceGroupName "FlightCompanion-Prod" `
     -Name "FlightCompanionApp" `
     -SourceSlotName "staging" `
     -DestinationSlotName "production"
   ```

2. **Scale Up Temporarily**
   ```powershell
   # Scale up to higher tier for immediate relief
   Set-AzAppServicePlan `
     -ResourceGroupName "FlightCompanion-Prod" `
     -Name "FlightCompanionPlan" `
     -Tier "Standard" `
     -NumberofWorkers 3 `
     -WorkerSize "Medium"
   ```

3. **Restart App Service**
   ```powershell
   # Restart if simple restart might resolve issues
   Restart-AzWebApp -ResourceGroupName "FlightCompanion-Prod" -Name "FlightCompanionApp"
   ```

### Step 3: Advanced Recovery (15-60 minutes)
1. **Redeploy from Known Good Build**
   - Trigger GitHub Actions deployment from last known good commit
   - Monitor deployment progress in Azure portal
   - Validate application startup

2. **Cross-Region Failover**
   ```powershell
   # Deploy to secondary region if primary region issues
   # Update Traffic Manager to route to secondary region
   Set-AzTrafficManagerProfile -TrafficManagerProfile $profile
   ```

### Step 4: Validation and Monitoring (60+ minutes)
1. **Functional Testing**
   - Test user authentication
   - Verify API endpoints
   - Check database connectivity
   - Test critical user journeys

2. **Performance Monitoring**
   - Monitor response times
   - Check error rates
   - Monitor resource utilization
   - Verify external integrations (Stripe, email)
```

## Compliance and Audit

### Compliance Requirements

#### Data Protection Compliance
- **GDPR Article 32**: Technical and organizational measures for data security
- **New Zealand Privacy Act 2020**: Data breach notification requirements
- **PCI DSS Requirements**: Payment data protection and backup procedures

#### Audit Requirements
- **Backup Testing**: Monthly documented testing of restore procedures
- **Incident Documentation**: Complete records of all DR activations
- **Recovery Time Tracking**: Measurement against SLA commitments
- **Data Integrity Verification**: Regular validation of backup data

### Audit Trail and Documentation

#### Backup Activity Logging
```powershell
# Audit log entry for backup activities
function Write-BackupAuditLog {
    param(
        [string]$ActivityType,
        [string]$Status,
        [string]$Details,
        [string]$ExecutedBy
    )
    
    $auditEntry = @{
        Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        ActivityType = $ActivityType
        Status = $Status
        Details = $Details
        ExecutedBy = $ExecutedBy
        Environment = $env:ENVIRONMENT_NAME
        CorrelationId = [System.Guid]::NewGuid().ToString()
    }
    
    # Write to audit log storage
    $auditJson = $auditEntry | ConvertTo-Json
    Add-Content -Path "audit-logs/backup-audit-$(Get-Date -Format 'yyyyMM').log" -Value $auditJson
    
    # Send to central logging
    Invoke-RestMethod -Uri $env:AUDIT_LOG_ENDPOINT -Method Post -Body $auditJson -ContentType "application/json"
}

# Example usage
Write-BackupAuditLog -ActivityType "DatabaseBackup" -Status "Success" -Details "Automated daily backup completed" -ExecutedBy "System"
Write-BackupAuditLog -ActivityType "DrTest" -Status "Success" -Details "Monthly DR test completed successfully" -ExecutedBy "Operations Team"
```

#### Compliance Reporting
```powershell
# Monthly compliance report generation
function Generate-ComplianceReport {
    param(
        [datetime]$StartDate = (Get-Date).AddDays(-30),
        [datetime]$EndDate = Get-Date
    )
    
    # Collect backup statistics
    $backupActivities = Get-Content "audit-logs/backup-audit-*.log" | ConvertFrom-Json | Where-Object { 
        [datetime]$_.Timestamp -ge $StartDate -and [datetime]$_.Timestamp -le $EndDate 
    }
    
    # Generate compliance metrics
    $complianceReport = @{
        ReportPeriod = @{
            StartDate = $StartDate.ToString("yyyy-MM-dd")
            EndDate = $EndDate.ToString("yyyy-MM-dd")
        }
        BackupCompliance = @{
            TotalBackups = ($backupActivities | Where-Object {$_.ActivityType -eq "DatabaseBackup"}).Count
            SuccessfulBackups = ($backupActivities | Where-Object {$_.ActivityType -eq "DatabaseBackup" -and $_.Status -eq "Success"}).Count
            FailedBackups = ($backupActivities | Where-Object {$_.ActivityType -eq "DatabaseBackup" -and $_.Status -eq "Failed"}).Count
            CompliancePercentage = 0
        }
        DrTesting = @{
            TestsCompleted = ($backupActivities | Where-Object {$_.ActivityType -eq "DrTest"}).Count
            TestsSuccessful = ($backupActivities | Where-Object {$_.ActivityType -eq "DrTest" -and $_.Status -eq "Success"}).Count
            RequiredTests = 3  # Monthly requirement
        }
        DataRetention = @{
            DatabaseBackupRetention = "35 days"
            FileBackupRetention = "30 days"
            AuditLogRetention = "7 years"
            ComplianceStatus = "Compliant"
        }
    }
    
    # Calculate compliance percentage
    if ($complianceReport.BackupCompliance.TotalBackups -gt 0) {
        $complianceReport.BackupCompliance.CompliancePercentage = 
            ($complianceReport.BackupCompliance.SuccessfulBackups / $complianceReport.BackupCompliance.TotalBackups) * 100
    }
    
    # Output report
    $reportJson = $complianceReport | ConvertTo-Json -Depth 3
    $reportFile = "compliance-reports/backup-compliance-$(Get-Date -Format 'yyyyMM').json"
    $reportJson | Out-File $reportFile
    
    Write-Host "Compliance report generated: $reportFile"
    return $complianceReport
}
```

## Summary

This comprehensive backup and disaster recovery plan provides:

### ✅ Automated Backup Procedures
- **Database**: Automated daily backups with 35-day retention and geo-redundancy
- **Application**: Daily app service backups with configuration preservation
- **Storage**: Cross-region replication with versioning and soft delete
- **Secrets**: Encrypted Key Vault backup procedures

### ✅ Disaster Recovery Protocols
- **Multiple Scenarios**: Region failure, database corruption, service outages
- **Clear Procedures**: Step-by-step recovery instructions
- **Time Objectives**: Defined RTO/RPO targets for each service tier
- **Escalation Paths**: Clear communication and responsibility chains

### ✅ Testing and Validation
- **Monthly Testing**: Regular restore testing and validation
- **Quarterly Simulations**: Full disaster recovery exercises
- **Automated Validation**: Weekly backup integrity checks
- **Documentation**: Complete test procedures and checklists

### ✅ Monitoring and Alerting
- **Proactive Monitoring**: Azure Monitor alerts for backup failures
- **Health Dashboards**: Real-time backup status monitoring
- **Automated Reporting**: Daily health checks and status reports
- **Incident Response**: Automated alert routing and escalation

### ✅ Compliance and Audit
- **Regulatory Compliance**: GDPR, Privacy Act, PCI DSS alignment
- **Audit Trails**: Complete logging of all backup activities
- **Regular Reporting**: Monthly compliance reports and metrics
- **Documentation**: Comprehensive runbooks and procedures

This backup and disaster recovery strategy ensures the Flight Companion platform can recover quickly from any failure scenario while maintaining data integrity and meeting all compliance requirements! 🛡️
