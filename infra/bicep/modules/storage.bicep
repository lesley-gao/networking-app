// ----------------------------------------------------------------------------------------------------
// Azure Blob Storage Module for User Verification Documents
// Using Azure Verified Modules and security best practices
// ----------------------------------------------------------------------------------------------------

targetScope = 'resourceGroup'

// ----------------------------------------------------------------------------------------------------
// Parameters
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where the storage account should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object = {}

@description('The resource token for resource naming.')
param resourceToken string

@description('The environment name (dev, test, prod).')
@allowed([
  'dev'
  'test'
  'prod'
])
param environmentName string

@description('The resource ID of the Key Vault for storing secrets.')
param keyVaultId string

@description('The resource ID of the user-assigned managed identity.')
param userAssignedIdentityId string

@description('The principal ID of the App Service for RBAC assignments.')
param appServicePrincipalId string

@description('The resource ID of the Log Analytics workspace for diagnostics.')
param logAnalyticsWorkspaceId string

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

// Storage account configuration based on environment
var storageConfig = {
  dev: {
    sku: 'Standard_LRS'
    accessTier: 'Hot'
    deleteRetentionDays: 7
    versioning: false
    changeFeed: false
  }
  test: {
    sku: 'Standard_ZRS'
    accessTier: 'Hot'
    deleteRetentionDays: 30
    versioning: true
    changeFeed: true
  }
  prod: {
    sku: 'Standard_GRS'
    accessTier: 'Hot'
    deleteRetentionDays: 90
    versioning: true
    changeFeed: true
  }
}

var currentConfig = storageConfig[environmentName]

// Resource naming
var storageAccountName = replace('st${resourceToken}docs', '-', '')
var containerName = 'verification-documents'
var quarantineContainerName = 'quarantine'

// ----------------------------------------------------------------------------------------------------
// Storage Account
// ----------------------------------------------------------------------------------------------------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: currentConfig.sku
  }
  kind: 'StorageV2'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentityId}': {}
    }
  }
  properties: {
    accessTier: currentConfig.accessTier
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    allowSharedKeyAccess: false // Force use of Azure AD authentication
    publicNetworkAccess: 'Enabled' // Can be restricted later with private endpoints
    networkAcls: {
      defaultAction: 'Allow' // Will be restricted in production
      bypass: 'AzureServices'
    }
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
      requireInfrastructureEncryption: true
    }
    largeFileSharesState: 'Disabled'
  }
}

// ----------------------------------------------------------------------------------------------------
// Blob Service Configuration
// ----------------------------------------------------------------------------------------------------

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: currentConfig.deleteRetentionDays
    }
    isVersioningEnabled: currentConfig.versioning
    changeFeed: {
      enabled: currentConfig.changeFeed
      retentionInDays: currentConfig.changeFeed ? 30 : null
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: currentConfig.deleteRetentionDays
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Blob Containers
// ----------------------------------------------------------------------------------------------------

resource verificationContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: containerName
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'User verification documents'
      environment: environmentName
    }
  }
}

resource quarantineContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: quarantineContainerName
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Quarantined documents pending security scan'
      environment: environmentName
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Role Assignments for App Service
// ----------------------------------------------------------------------------------------------------

// Storage Blob Data Contributor role for App Service
resource appServiceStorageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  name: guid(storageAccount.id, appServicePrincipalId, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Storage Account Contributor role for managed operations
resource appServiceAccountRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  name: guid(storageAccount.id, appServicePrincipalId, '17d1049b-9a84-46fb-8f53-869881c3d3ab')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '17d1049b-9a84-46fb-8f53-869881c3d3ab') // Storage Account Contributor
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ----------------------------------------------------------------------------------------------------
// Key Vault Secrets for Storage Configuration
// ----------------------------------------------------------------------------------------------------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: last(split(keyVaultId, '/'))
}

resource storageAccountNameSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-account-name'
  properties: {
    value: storageAccount.name
    contentType: 'Azure Storage Account Name'
  }
}

resource storageAccountEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-account-endpoint'
  properties: {
    value: storageAccount.properties.primaryEndpoints.blob
    contentType: 'Azure Storage Account Blob Endpoint'
  }
}

resource verificationContainerSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'verification-container-name'
  properties: {
    value: containerName
    contentType: 'Azure Blob Storage Container Name'
  }
}

resource quarantineContainerSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'quarantine-container-name'
  properties: {
    value: quarantineContainerName
    contentType: 'Azure Blob Storage Container Name'
  }
}

// ----------------------------------------------------------------------------------------------------
// Diagnostic Settings
// ----------------------------------------------------------------------------------------------------

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: storageAccount
  name: 'storage-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

resource blobDiagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: blobServices
  name: 'blob-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output primaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
output verificationContainerName string = containerName
output quarantineContainerName string = quarantineContainerName

output keyVaultReferences object = {
  storageAccountName: '@Microsoft.KeyVault(VaultName=${last(split(keyVaultId, '/'))};SecretName=storage-account-name)'
  storageAccountEndpoint: '@Microsoft.KeyVault(VaultName=${last(split(keyVaultId, '/'))};SecretName=storage-account-endpoint)'
  verificationContainerName: '@Microsoft.KeyVault(VaultName=${last(split(keyVaultId, '/'))};SecretName=verification-container-name)'
  quarantineContainerName: '@Microsoft.KeyVault(VaultName=${last(split(keyVaultId, '/'))};SecretName=quarantine-container-name)'
}
