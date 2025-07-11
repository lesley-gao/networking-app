@description('Environment name for resource naming')
param environmentName string = 'dev'

@description('Location for resources')
param location string = resourceGroup().location

@description('Database administrator login name')
@secure()
param administratorLogin string

@description('Database administrator password')
@secure()
param administratorLoginPassword string

@description('Database name for the Flight Companion application')
param databaseName string = 'flight-companion-db'

@description('Database SKU tier')
@allowed([
  'Basic'
  'Standard'
  'Premium'
  'GeneralPurpose'
  'BusinessCritical'
])
param databaseTier string = 'Standard'

@description('Database compute size')
param databaseComputeSize string = 'S2'

@description('Maximum database size in bytes')
param maxSizeBytes int = 268435456000 // 250 GB

@description('Backup retention period in days')
param backupRetentionDays int = 7

@description('Enable geo-redundant backup')
param geoRedundantBackup bool = false

@description('Enable automatic tuning')
param enableAutoTuning bool = true

@description('Enable advanced threat protection')
param enableThreatProtection bool = true

@description('Enable diagnostic logging')
param enableDiagnosticLogging bool = true

@description('Log Analytics workspace ID for diagnostics')
param logAnalyticsWorkspaceId string = ''

@description('Tags to apply to resources')
param tags object = {}

// ==================================================================================================
// Variables
// ==================================================================================================

var resourceNamingPrefix = 'fc-${environmentName}'
var sqlServerName = '${resourceNamingPrefix}-sql'
var keyVaultName = '${resourceNamingPrefix}-kv'
var storageAccountName = replace('${resourceNamingPrefix}storage', '-', '')

var commonTags = union(tags, {
  Environment: environmentName
  Application: 'FlightCompanion'
  Component: 'Database'
  ManagedBy: 'AzureDeveloperCLI'
})

// Environment-specific configurations
var environmentConfig = {
  dev: {
    skuTier: 'Standard'
    skuName: 'S1'
    maxSizeBytes: 5368709120 // 5 GB
    backupRetentionDays: 7
    geoRedundantBackup: false
    enableAdvancedSecurity: false
  }
  test: {
    skuTier: 'Standard'
    skuName: 'S2'
    maxSizeBytes: 26843545600 // 25 GB
    backupRetentionDays: 14
    geoRedundantBackup: false
    enableAdvancedSecurity: true
  }
  prod: {
    skuTier: 'Premium'
    skuName: 'P2'
    maxSizeBytes: 268435456000 // 250 GB
    backupRetentionDays: 35
    geoRedundantBackup: true
    enableAdvancedSecurity: true
  }
}

var currentConfig = environmentConfig[environmentName]

// ==================================================================================================
// Azure SQL Server
// ==================================================================================================

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: commonTags
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled' // Configure based on security requirements
  }

  // Azure Active Directory Administrator
  resource aadAdmin 'administrators@2023-05-01-preview' = if (environmentName == 'prod') {
    name: 'ActiveDirectory'
    properties: {
      administratorType: 'ActiveDirectory'
      login: 'FlightCompanionDBAdmins'
      sid: '00000000-0000-0000-0000-000000000000' // Replace with actual AAD group SID
      tenantId: subscription().tenantId
    }
  }

  // Firewall rules
  resource allowAzureServices 'firewallRules@2023-05-01-preview' = {
    name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }

  // Development environment firewall rule (remove in production)
  resource allowDevelopment 'firewallRules@2023-05-01-preview' = if (environmentName == 'dev') {
    name: 'AllowDevelopmentAccess'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '255.255.255.255'
    }
  }
}

// ==================================================================================================
// Azure SQL Database
// ==================================================================================================

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  tags: commonTags
  sku: {
    name: currentConfig.skuName
    tier: currentConfig.skuTier
  }
  properties: {
    maxSizeBytes: currentConfig.maxSizeBytes
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: environmentName == 'prod'
    readScale: environmentName == 'prod' ? 'Enabled' : 'Disabled'
    requestedBackupStorageRedundancy: currentConfig.geoRedundantBackup ? 'Geo' : 'Local'
    isLedgerOn: false
  }

  // Backup policy
  resource backupShortTermRetentionPolicy 'backupShortTermRetentionPolicies@2023-05-01-preview' = {
    name: 'default'
    properties: {
      retentionDays: currentConfig.backupRetentionDays
    }
  }

  // Long-term backup retention for production
  resource backupLongTermRetentionPolicy 'backupLongTermRetentionPolicies@2023-05-01-preview' = if (environmentName == 'prod') {
    name: 'default'
    properties: {
      weeklyRetention: 'P4W'
      monthlyRetention: 'P12M'
      yearlyRetention: 'P5Y'
      weekOfYear: 1
    }
  }

  // Transparent Data Encryption
  resource transparentDataEncryption 'transparentDataEncryption@2023-05-01-preview' = {
    name: 'current'
    properties: {
      state: 'Enabled'
    }
  }
}

// ==================================================================================================
// Advanced Threat Protection
// ==================================================================================================

resource sqlServerSecurityAlertPolicy 'Microsoft.Sql/servers/securityAlertPolicies@2023-05-01-preview' = if (currentConfig.enableAdvancedSecurity) {
  parent: sqlServer
  name: 'default'
  properties: {
    state: 'Enabled'
    emailAddresses: [
      'security@flightcompanion.com'
    ]
    emailAccountAdmins: true
    retentionDays: 30
    disabledAlerts: []
  }
}

resource sqlServerVulnerabilityAssessment 'Microsoft.Sql/servers/vulnerabilityAssessments@2023-05-01-preview' = if (currentConfig.enableAdvancedSecurity) {
  parent: sqlServer
  name: 'default'
  properties: {
    storageContainerPath: '${storageAccount.properties.primaryEndpoints.blob}vulnerability-assessment'
    storageAccountAccessKey: storageAccount.listKeys().keys[0].value
    recurringScans: {
      isEnabled: true
      emailSubscriptionAdmins: true
      emails: [
        'security@flightcompanion.com'
      ]
    }
  }
}

// ==================================================================================================
// Storage Account for Backups and Security Scans
// ==================================================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: commonTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }

  resource blobService 'blobServices@2023-01-01' = {
    name: 'default'
    
    resource backupContainer 'containers@2023-01-01' = {
      name: 'database-backups'
      properties: {
        publicAccess: 'None'
      }
    }

    resource vulnerabilityContainer 'containers@2023-01-01' = {
      name: 'vulnerability-assessment'
      properties: {
        publicAccess: 'None'
      }
    }
  }
}

// ==================================================================================================
// Key Vault for Secrets Management
// ==================================================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: commonTags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: environmentName == 'prod'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }

  // Store database connection string
  resource connectionStringSecret 'secrets@2023-07-01' = {
    name: 'DatabaseConnectionString'
    properties: {
      value: 'Server=${sqlServer.properties.fullyQualifiedDomainName};Database=${databaseName};User Id=${administratorLogin};Password=${administratorLoginPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    }
  }

  // Store admin credentials
  resource adminLoginSecret 'secrets@2023-07-01' = {
    name: 'DatabaseAdminLogin'
    properties: {
      value: administratorLogin
    }
  }

  resource adminPasswordSecret 'secrets@2023-07-01' = {
    name: 'DatabaseAdminPassword'
    properties: {
      value: administratorLoginPassword
    }
  }
}

// ==================================================================================================
// Diagnostic Settings
// ==================================================================================================

resource sqlDatabaseDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableDiagnosticLogging && !empty(logAnalyticsWorkspaceId)) {
  scope: sqlDatabase
  name: 'database-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 30
        }
      }
    ]
  }
}

resource sqlServerDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableDiagnosticLogging && !empty(logAnalyticsWorkspaceId)) {
  scope: sqlServer
  name: 'server-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'audit'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
  }
}

// ==================================================================================================
// Auto-tuning Configuration
// ==================================================================================================

resource databaseAutoTuning 'Microsoft.Sql/servers/databases/advisors@2014-04-01' = if (enableAutoTuning) {
  parent: sqlDatabase
  name: 'CreateIndex'
  properties: {
    autoExecuteValue: environmentName == 'prod' ? 'Disabled' : 'Enabled'
  }
}

// ==================================================================================================
// Outputs
// ==================================================================================================

@description('SQL Server fully qualified domain name')
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName

@description('SQL Server name')
output sqlServerName string = sqlServer.name

@description('Database name')
output databaseName string = sqlDatabase.name

@description('Connection string (without credentials)')
output connectionStringTemplate string = 'Server=${sqlServer.properties.fullyQualifiedDomainName};Database=${databaseName};User Id={username};Password={password};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

@description('Key Vault name for storing secrets')
output keyVaultName string = keyVault.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Storage account name for backups')
output storageAccountName string = storageAccount.name

@description('Database resource ID')
output databaseResourceId string = sqlDatabase.id

@description('SQL Server resource ID')
output sqlServerResourceId string = sqlServer.id

@description('Environment configuration applied')
output environmentConfig object = currentConfig
