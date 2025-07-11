// ----------------------------------------------------------------------------------------------------
// Database Module - Azure SQL Database with Logical Server
// Using Azure Verified Modules (AVM) pattern
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where all resources should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object

@description('Resource token used for naming resources.')
param resourceToken string

@description('Virtual Network ID for private endpoints.')
param vnetId string

@description('Database subnet ID for private endpoints.')
param dbSubnetId string

@description('Key Vault ID for storing database connection strings.')
param keyVaultId string

@description('Environment name (dev, test, prod)')
param environmentName string

@description('Enable geo-redundant backup storage (recommended for production)')
param enableGeoRedundantBackup bool = false

@description('Log Analytics Workspace ID for diagnostics')
param logAnalyticsWorkspaceId string = ''

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var sqlServerName = 'sql-${resourceToken}'
var sqlDatabaseName = 'sqldb-${resourceToken}'
var privateEndpointName = 'pe-sql-${resourceToken}'

// Generate a random password for the SQL Server admin
var sqlAdminLogin = 'sqladmin'

// Environment-specific database configuration
var databaseConfig = {
  dev: {
    sku: {
      name: 'Basic'
      tier: 'Basic'
      capacity: 5
    }
    maxSizeBytes: 2147483648 // 2 GB
    backupStorageRedundancy: 'Local'
    zoneRedundant: false
    readScale: 'Disabled'
    shortTermRetentionDays: 7
    longTermRetentionWeeklyPolicy: 'Disabled'
    longTermRetentionMonthlyPolicy: 'Disabled'
    longTermRetentionYearlyPolicy: 'Disabled'
  }
  test: {
    sku: {
      name: 'S1'
      tier: 'Standard'
      capacity: 20
    }
    maxSizeBytes: 10737418240 // 10 GB
    backupStorageRedundancy: 'Local'
    zoneRedundant: false
    readScale: 'Disabled'
    shortTermRetentionDays: 14
    longTermRetentionWeeklyPolicy: 'P4W'
    longTermRetentionMonthlyPolicy: 'Disabled'
    longTermRetentionYearlyPolicy: 'Disabled'
  }
  prod: {
    sku: {
      name: 'S3'
      tier: 'Standard'
      capacity: 100
    }
    maxSizeBytes: 107374182400 // 100 GB
    backupStorageRedundancy: enableGeoRedundantBackup ? 'Geo' : 'Zone'
    zoneRedundant: true
    readScale: 'Enabled'
    shortTermRetentionDays: 35
    longTermRetentionWeeklyPolicy: 'P12W'
    longTermRetentionMonthlyPolicy: 'P12M'
    longTermRetentionYearlyPolicy: 'P5Y'
  }
}

var currentConfig = databaseConfig[environmentName]

// ----------------------------------------------------------------------------------------------------
// SQL Server
// ----------------------------------------------------------------------------------------------------

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: uniqueString(resourceGroup().id, 'sql-password', utcNow())
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    restrictOutboundNetworkAccess: 'Enabled'
  }
}

// ----------------------------------------------------------------------------------------------------
// SQL Database
// ----------------------------------------------------------------------------------------------------

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: currentConfig.sku
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: currentConfig.maxSizeBytes
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: currentConfig.zoneRedundant
    readScale: currentConfig.readScale
    requestedBackupStorageRedundancy: currentConfig.backupStorageRedundancy
    maintenanceConfigurationId: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.Maintenance/publicMaintenanceConfigurations/SQL_Default'
    isLedgerOn: false
  }
}

// ----------------------------------------------------------------------------------------------------
// Short-term Backup Retention Policy
// ----------------------------------------------------------------------------------------------------

resource shortTermRetentionPolicy 'Microsoft.Sql/servers/databases/backupShortTermRetentionPolicies@2023-05-01-preview' = {
  parent: sqlDatabase
  name: 'default'
  properties: {
    retentionDays: currentConfig.shortTermRetentionDays
  }
}

// ----------------------------------------------------------------------------------------------------
// Long-term Backup Retention Policy (Production only)
// ----------------------------------------------------------------------------------------------------

resource longTermRetentionPolicy 'Microsoft.Sql/servers/databases/backupLongTermRetentionPolicies@2023-05-01-preview' = if (environmentName == 'prod') {
  parent: sqlDatabase
  name: 'default'
  properties: {
    weeklyRetention: currentConfig.longTermRetentionWeeklyPolicy
    monthlyRetention: currentConfig.longTermRetentionMonthlyPolicy
    yearlyRetention: currentConfig.longTermRetentionYearlyPolicy
    weekOfYear: 1
  }
}

// ----------------------------------------------------------------------------------------------------
// Private DNS Zone for SQL Server
// ----------------------------------------------------------------------------------------------------

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.database.windows.net'
  location: 'global'
  tags: tags
}

resource privateDnsZoneVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Private Endpoint for SQL Server
// ----------------------------------------------------------------------------------------------------

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: privateEndpointName
  location: location
  tags: tags
  properties: {
    subnet: {
      id: dbSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'sql-connection'
        properties: {
          privateLinkServiceId: sqlServer.id
          groupIds: [
            'sqlServer'
          ]
        }
      }
    ]
  }
}

resource privateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-09-01' = {
  parent: privateEndpoint
  name: 'sql-dns-zone-group'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'privatelink-database-windows-net'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Azure AD Authentication
// ----------------------------------------------------------------------------------------------------

resource sqlAdAdministrator 'Microsoft.Sql/servers/administrators@2023-05-01-preview' = {
  parent: sqlServer
  name: 'ActiveDirectory'
  properties: {
    administratorType: 'ActiveDirectory'
    login: 'NetworkingApp-Admins'
    sid: '00000000-0000-0000-0000-000000000000' // This should be replaced with actual AAD group object ID
    tenantId: tenant().tenantId
  }
}

// ----------------------------------------------------------------------------------------------------
// Diagnostic Settings
// ----------------------------------------------------------------------------------------------------

resource sqlServerDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'diag-${sqlServerName}'
  scope: sqlServer
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'audit'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 90 : 30
        }
      }
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'Basic'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

resource sqlDatabaseDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'diag-${sqlDatabaseName}'
  scope: sqlDatabase
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'Basic'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 90 : 30
        }
      }
      {
        category: 'InstanceAndAppAdvanced'
        enabled: environmentName == 'prod'
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Database Auditing
// ----------------------------------------------------------------------------------------------------

resource sqlServerAuditingSettings 'Microsoft.Sql/servers/auditingSettings@2023-05-01-preview' = {
  parent: sqlServer
  name: 'default'
  properties: {
    state: 'Enabled'
    isAzureMonitorTargetEnabled: !empty(logAnalyticsWorkspaceId)
    retentionDays: environmentName == 'prod' ? 90 : 30
    auditActionsAndGroups: [
      'SUCCESSFUL_DATABASE_AUTHENTICATION_GROUP'
      'FAILED_DATABASE_AUTHENTICATION_GROUP'
      'BATCH_COMPLETED_GROUP'
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Transparent Data Encryption
// ----------------------------------------------------------------------------------------------------

resource transparentDataEncryption 'Microsoft.Sql/servers/databases/transparentDataEncryption@2023-05-01-preview' = {
  parent: sqlDatabase
  name: 'current'
  properties: {
    state: 'Enabled'
  }
}

// ----------------------------------------------------------------------------------------------------
// Store Connection String in Key Vault
// ----------------------------------------------------------------------------------------------------

resource connectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${last(split(keyVaultId, '/'))}/DefaultConnection'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabase.name};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${uniqueString(resourceGroup().id, 'sql-password', utcNow())};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    contentType: 'text/plain'
  }
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

output sqlServerName string = sqlServer.name
output sqlServerId string = sqlServer.id
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabase.name
output sqlDatabaseId string = sqlDatabase.id
output privateEndpointId string = privateEndpoint.id
output connectionStringSecretUri string = connectionStringSecret.properties.secretUri
output databaseSku object = currentConfig.sku
output backupRetentionDays int = currentConfig.shortTermRetentionDays
