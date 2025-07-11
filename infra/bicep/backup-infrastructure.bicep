// Backup and Disaster Recovery Infrastructure Template
// This Bicep template provisions the complete backup and DR infrastructure

@description('Primary location for backup resources')
param primaryLocation string = 'australiaeast'

@description('Secondary location for disaster recovery')
param secondaryLocation string = 'australiasoutheast'

@description('Environment prefix for resource naming')
param environmentPrefix string = 'fc'

@description('Resource name suffix')
param resourceSuffix string = uniqueString(resourceGroup().id)

@description('SQL Server administrator login')
@secure()
param sqlAdminLogin string

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('Key Vault resource ID for storing secrets')
param keyVaultId string

@description('Tags to apply to all resources')
param tags object = {
  Environment: 'Production'
  Project: 'FlightCompanion'
  Component: 'Backup-DR'
  ManagedBy: 'Bicep'
}

var namingConvention = {
  storageAccount: '${environmentPrefix}backup${resourceSuffix}'
  drStorageAccount: '${environmentPrefix}drbackup${resourceSuffix}'
  sqlServer: '${environmentPrefix}-sql-backup-${primaryLocation}'
  drSqlServer: '${environmentPrefix}-sql-dr-${secondaryLocation}'
  recoveryVault: '${environmentPrefix}-recovery-vault'
  automationAccount: '${environmentPrefix}-automation'
  logAnalytics: '${environmentPrefix}-logs-backup'
  actionGroup: '${environmentPrefix}-backup-alerts'
}

// Primary backup storage account
resource backupStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: namingConvention.storageAccount
  location: primaryLocation
  tags: tags
  sku: {
    name: 'Standard_GRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Secondary DR storage account
resource drStorageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: namingConvention.drStorageAccount
  location: secondaryLocation
  tags: tags
  sku: {
    name: 'Standard_GRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Backup storage containers
resource backupContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for containerName in [
  'scheduled-backups'
  'manual-backups'
  'emergency-backups'
  'configuration-backups'
  'app-service-backups'
  'test-results'
  'audit-logs'
]: {
  name: '${backupStorageAccount.name}/default/${containerName}'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'backup-storage'
      retention: containerName == 'scheduled-backups' ? '35-days' : '30-days'
    }
  }
}]

// DR storage containers
resource drContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for containerName in [
  'dr-backups'
  'configuration-dr'
  'app-service-dr'
]: {
  name: '${drStorageAccount.name}/default/${containerName}'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'disaster-recovery'
      region: secondaryLocation
    }
  }
}]

// Recovery Services Vault for backup orchestration
resource recoveryVault 'Microsoft.RecoveryServices/vaults@2023-04-01' = {
  name: namingConvention.recoveryVault
  location: primaryLocation
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    restoreSettings: {
      crossSubscriptionRestoreSettings: {
        crossSubscriptionRestoreState: 'Enabled'
      }
    }
  }
}

// Configure backup policy for the Recovery Vault
resource backupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2023-04-01' = {
  parent: recoveryVault
  name: 'FlightCompanionBackupPolicy'
  properties: {
    backupManagementType: 'AzureWorkload'
    workLoadType: 'SQLDataBase'
    settings: {
      timeZone: 'New Zealand Standard Time'
      issqlcompression: true
      isCompression: true
    }
    subProtectionPolicy: [
      {
        policyType: 'Full'
        schedulePolicy: {
          schedulePolicyType: 'SimpleSchedulePolicy'
          scheduleRunFrequency: 'Daily'
          scheduleRunTimes: [
            '2024-01-01T02:00:00Z'
          ]
          scheduleWeeklyFrequency: 0
        }
        retentionPolicy: {
          retentionPolicyType: 'LongTermRetentionPolicy'
          dailySchedule: {
            retentionTimes: [
              '2024-01-01T02:00:00Z'
            ]
            retentionDuration: {
              count: 35
              durationType: 'Days'
            }
          }
          weeklySchedule: {
            daysOfTheWeek: [
              'Sunday'
            ]
            retentionTimes: [
              '2024-01-01T02:00:00Z'
            ]
            retentionDuration: {
              count: 12
              durationType: 'Weeks'
            }
          }
          monthlySchedule: {
            retentionScheduleFormatType: 'Weekly'
            retentionScheduleWeekly: {
              daysOfTheWeek: [
                'Sunday'
              ]
              weeksOfTheMonth: [
                'First'
              ]
            }
            retentionTimes: [
              '2024-01-01T02:00:00Z'
            ]
            retentionDuration: {
              count: 12
              durationType: 'Months'
            }
          }
        }
      }
      {
        policyType: 'Log'
        schedulePolicy: {
          schedulePolicyType: 'LogSchedulePolicy'
          scheduleFrequencyInMins: 15
        }
        retentionPolicy: {
          retentionPolicyType: 'SimpleRetentionPolicy'
          retentionDuration: {
            count: 7
            durationType: 'Days'
          }
        }
      }
    ]
  }
}

// Log Analytics workspace for backup monitoring
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: namingConvention.logAnalytics
  location: primaryLocation
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
    workspaceCapping: {
      dailyQuotaGb: 1
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Automation Account for backup orchestration
resource automationAccount 'Microsoft.Automation/automationAccounts@2023-11-01' = {
  name: namingConvention.automationAccount
  location: primaryLocation
  tags: tags
  properties: {
    sku: {
      name: 'Basic'
    }
    encryption: {
      keySource: 'Microsoft.Automation'
    }
    publicNetworkAccess: true
    disableLocalAuth: false
  }
}

// PowerShell modules for automation runbooks
resource powerShellModules 'Microsoft.Automation/automationAccounts/modules@2020-01-13-preview' = [for moduleName in [
  'Az.Accounts'
  'Az.Profile' 
  'Az.Sql'
  'Az.Storage'
  'Az.Websites'
  'Az.Resources'
]: {
  parent: automationAccount
  name: moduleName
  properties: {
    moduleUri: 'https://www.powershellgallery.com/packages/${moduleName}'
  }
}]

// Backup orchestration runbook
resource backupRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = {
  parent: automationAccount
  name: 'DailyBackupOrchestration'
  properties: {
    runbookType: 'PowerShell'
    logVerbose: true
    logProgress: true
    description: 'Daily backup orchestration for Flight Companion platform'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/lesley-gao/networking-app/main/Scripts/Invoke-BackupOrchestration.ps1'
      version: '1.0.0.0'
    }
  }
}

// DR testing runbook
resource drTestRunbook 'Microsoft.Automation/automationAccounts/runbooks@2020-01-13-preview' = {
  parent: automationAccount
  name: 'DisasterRecoveryTesting'
  properties: {
    runbookType: 'PowerShell'
    logVerbose: true
    logProgress: true
    description: 'Automated disaster recovery testing procedures'
    publishContentLink: {
      uri: 'https://raw.githubusercontent.com/lesley-gao/networking-app/main/Scripts/Test-DisasterRecovery.ps1'
      version: '1.0.0.0'
    }
  }
}

// Schedules for automated backup operations
resource dailyBackupSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  parent: automationAccount
  name: 'DailyBackupSchedule'
  properties: {
    description: 'Daily backup execution at 2:00 AM NZST'
    startTime: '2024-01-01T02:00:00+13:00'
    frequency: 'Day'
    interval: 1
    timeZone: 'New Zealand Standard Time'
  }
}

resource weeklyValidationSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  parent: automationAccount
  name: 'WeeklyValidationSchedule'
  properties: {
    description: 'Weekly backup validation every Tuesday at 3:00 AM'
    startTime: '2024-01-02T03:00:00+13:00'
    frequency: 'Week'
    interval: 1
    advancedSchedule: {
      weekDays: ['Tuesday']
    }
    timeZone: 'New Zealand Standard Time'
  }
}

resource monthlyTestSchedule 'Microsoft.Automation/automationAccounts/schedules@2020-01-13-preview' = {
  parent: automationAccount
  name: 'MonthlyDRTestSchedule'
  properties: {
    description: 'Monthly DR test on first Tuesday at 4:00 AM'
    startTime: '2024-01-02T04:00:00+13:00'
    frequency: 'Month'
    interval: 1
    advancedSchedule: {
      weekDays: ['Tuesday']
      monthDays: [1, 2, 3, 4, 5, 6, 7]
    }
    timeZone: 'New Zealand Standard Time'
  }
}

// Job schedules linking runbooks to schedules
resource dailyBackupJobSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2020-01-13-preview' = {
  parent: automationAccount
  name: guid(automationAccount.id, dailyBackupSchedule.id, backupRunbook.id)
  properties: {
    runbook: {
      name: backupRunbook.name
    }
    schedule: {
      name: dailyBackupSchedule.name
    }
    parameters: {
      Operation: 'DailyBackup'
      SubscriptionId: subscription().subscriptionId
      ForceExecution: 'false'
    }
  }
}

resource weeklyValidationJobSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2020-01-13-preview' = {
  parent: automationAccount
  name: guid(automationAccount.id, weeklyValidationSchedule.id, drTestRunbook.id)
  properties: {
    runbook: {
      name: drTestRunbook.name
    }
    schedule: {
      name: weeklyValidationSchedule.name
    }
    parameters: {
      TestType: 'BackupValidation'
      SubscriptionId: subscription().subscriptionId
    }
  }
}

resource monthlyTestJobSchedule 'Microsoft.Automation/automationAccounts/jobSchedules@2020-01-13-preview' = {
  parent: automationAccount
  name: guid(automationAccount.id, monthlyTestSchedule.id, drTestRunbook.id)
  properties: {
    runbook: {
      name: drTestRunbook.name
    }
    schedule: {
      name: monthlyTestSchedule.name
    }
    parameters: {
      TestType: 'DatabaseRestore'
      SubscriptionId: subscription().subscriptionId
    }
  }
}

// Action Group for backup and DR alerts
resource backupActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: namingConvention.actionGroup
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'FCBackup'
    enabled: true
    emailReceivers: [
      {
        name: 'Operations Team'
        emailAddress: 'operations@flightcompanion.com'
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: [
      {
        name: 'Slack Notifications'
        serviceUri: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
        useCommonAlertSchema: true
      }
    ]
    azureFunctionReceivers: []
    armRoleReceivers: [
      {
        name: 'Backup Operators'
        roleId: '00482a5a-887f-4fb3-b363-3b7fe8e74483' // Backup Operator role
        useCommonAlertSchema: true
      }
    ]
  }
}

// Metric alerts for backup monitoring
resource backupFailureAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'BackupJobFailure'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when backup job fails'
    severity: 1
    enabled: true
    scopes: [
      automationAccount.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'BackupJobFailure'
          metricName: 'TotalJob'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Total'
          dimensions: [
            {
              name: 'Status'
              operator: 'Include'
              values: ['Failed']
            }
          ]
        }
      ]
    }
    actions: [
      {
        actionGroupId: backupActionGroup.id
      }
    ]
  }
}

resource storageCapacityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'BackupStorageCapacity'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Alert when backup storage capacity exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      backupStorageAccount.id
    ]
    evaluationFrequency: 'PT1H'
    windowSize: 'PT1H'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'StorageCapacity'
          metricName: 'UsedCapacity'
          operator: 'GreaterThan'
          threshold: 858993459200 // 800 GB (80% of 1TB)
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: backupActionGroup.id
      }
    ]
  }
}

// Application Insights component for backup monitoring
resource backupAppInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${environmentPrefix}-backup-insights'
  location: primaryLocation
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Diagnostic settings for backup storage account
resource backupStorageDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'backup-storage-diagnostics'
  scope: backupStorageAccount
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'StorageRead'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'StorageWrite'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'StorageDelete'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'Capacity'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
  }
}

// Diagnostic settings for automation account
resource automationDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'automation-diagnostics'
  scope: automationAccount
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'JobLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 365
        }
      }
      {
        category: 'JobStreams'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 365
        }
      }
    ]
  }
}

// Output key information for configuration
output backupStorageAccountName string = backupStorageAccount.name
output backupStorageAccountKey string = backupStorageAccount.listKeys().keys[0].value
output drStorageAccountName string = drStorageAccount.name
output recoveryVaultName string = recoveryVault.name
output automationAccountName string = automationAccount.name
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.properties.customerId
output appInsightsInstrumentationKey string = backupAppInsights.properties.InstrumentationKey
output actionGroupId string = backupActionGroup.id

// Key Vault secrets for backup configuration
resource backupStorageConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${last(split(keyVaultId, '/'))}/BackupStorageConnectionString'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${backupStorageAccount.name};AccountKey=${backupStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    attributes: {
      enabled: true
    }
    contentType: 'connection-string'
  }
}

resource drStorageConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${last(split(keyVaultId, '/'))}/DRStorageConnectionString'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${drStorageAccount.name};AccountKey=${drStorageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    attributes: {
      enabled: true
    }
    contentType: 'connection-string'
  }
}

resource appInsightsConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${last(split(keyVaultId, '/'))}/BackupAppInsightsConnectionString'
  properties: {
    value: backupAppInsights.properties.ConnectionString
    attributes: {
      enabled: true
    }
    contentType: 'connection-string'
  }
}
