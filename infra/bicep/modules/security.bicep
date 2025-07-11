// ----------------------------------------------------------------------------------------------------
// Security Module - Azure Key Vault and Security Configuration
// Using Azure Verified Modules (AVM) pattern
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where all resources should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object

@description('Resource token used for naming resources.')
param resourceToken string

@description('App Service principal ID for Key Vault access.')
param appServicePrincipalId string

@description('Environment name (dev, test, prod)')
param environmentName string

@description('Stripe API keys for the environment')
param stripeApiKey string = ''

@description('Stripe publishable key for the environment')
param stripePublishableKey string = ''

@description('Stripe webhook secret for the environment')
param stripeWebhookSecret string = ''

@description('Email service configuration')
param emailSmtpPassword string = ''

@description('Enable private endpoint for Key Vault (recommended for production)')
param enablePrivateEndpoint bool = false

@description('Subnet ID for private endpoint (required if enablePrivateEndpoint is true)')
param privateEndpointSubnetId string = ''

@description('Log Analytics workspace ID for diagnostics.')
param logAnalyticsWorkspaceId string

@description('Application Insights connection string.')
param applicationInsightsConnectionString string

@description('Application Insights instrumentation key.')
param applicationInsightsInstrumentationKey string

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var keyVaultName = 'kv-${resourceToken}'

// Environment-specific Key Vault configuration
var keyVaultConfig = {
  dev: {
    skuName: 'standard'
    publicNetworkAccess: 'Enabled'
    softDeleteRetentionDays: 7
    enablePurgeProtection: false
  }
  test: {
    skuName: 'standard'
    publicNetworkAccess: 'Enabled'
    softDeleteRetentionDays: 30
    enablePurgeProtection: false
  }
  prod: {
    skuName: 'premium'
    publicNetworkAccess: enablePrivateEndpoint ? 'Disabled' : 'Enabled'
    softDeleteRetentionDays: 90
    enablePurgeProtection: true
  }
}

var currentConfig = keyVaultConfig[environmentName]

// ----------------------------------------------------------------------------------------------------
// Key Vault
// ----------------------------------------------------------------------------------------------------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: currentConfig.skuName
    }
    tenantId: tenant().tenantId
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: currentConfig.softDeleteRetentionDays
    enablePurgeProtection: currentConfig.enablePurgeProtection
    enableRbacAuthorization: true
    publicNetworkAccess: currentConfig.publicNetworkAccess
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: currentConfig.publicNetworkAccess == 'Enabled' ? 'Allow' : 'Deny'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Role Assignments for Key Vault
// ----------------------------------------------------------------------------------------------------

// Key Vault Secrets User role for App Service
resource appServiceKeyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appServicePrincipalId, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: appServicePrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ----------------------------------------------------------------------------------------------------
// Application Secrets
// ----------------------------------------------------------------------------------------------------

// JWT Secret Key - Generated unique per environment
resource jwtSecretKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JwtSecretKey'
  properties: {
    value: base64(uniqueString(resourceGroup().id, environmentName, 'jwt-secret'))
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Database Connection String (will be populated by database module)
resource defaultConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DefaultConnection'
  properties: {
    value: 'placeholder-will-be-updated-by-database-module'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Stripe Configuration
resource stripeSecretKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(stripeApiKey)) {
  parent: keyVault
  name: 'StripeSecretKey'
  properties: {
    value: stripeApiKey
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource stripePublishableKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(stripePublishableKey)) {
  parent: keyVault
  name: 'StripePublishableKey'
  properties: {
    value: stripePublishableKey
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource stripeWebhookSecretKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(stripeWebhookSecret)) {
  parent: keyVault
  name: 'StripeWebhookSecret'
  properties: {
    value: stripeWebhookSecret
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Email Configuration
resource emailSmtpPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(emailSmtpPassword)) {
  parent: keyVault
  name: 'EmailSmtpPassword'
  properties: {
    value: emailSmtpPassword
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Application Insights Instrumentation Key
resource appInsightsInstrumentationKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AppInsightsInstrumentationKey'
  properties: {
    value: applicationInsightsInstrumentationKey
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// Application Insights Connection String
resource appInsightsConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AppInsightsConnectionString'
  properties: {
    value: applicationInsightsConnectionString
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Managed Identity for Key Vault access
// ----------------------------------------------------------------------------------------------------

resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${resourceToken}'
  location: location
  tags: tags
}

// Key Vault Secrets User role for the managed identity
resource managedIdentityKeyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, userAssignedIdentity.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: userAssignedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ----------------------------------------------------------------------------------------------------
// Diagnostic Settings
// ----------------------------------------------------------------------------------------------------

resource keyVaultDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${keyVaultName}'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'audit'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
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
        category: 'AllMetrics'
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
// Private Endpoint for Key Vault (Optional - for production environments)
// ----------------------------------------------------------------------------------------------------

// Uncomment below for production deployments with private endpoints
/*
resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-kv-${resourceToken}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'keyvault-connection'
        properties: {
          privateLinkServiceId: keyVault.id
          groupIds: [
            'vault'
          ]
        }
      }
    ]
  }
}
*/

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

@description('The name of the Key Vault')
output keyVaultName string = keyVault.name

@description('The resource ID of the Key Vault')
output keyVaultId string = keyVault.id

@description('The URI of the Key Vault')
output keyVaultEndpoint string = keyVault.properties.vaultUri

@description('The resource ID of the managed identity')
output userAssignedIdentityId string = userAssignedIdentity.id

@description('The principal ID of the managed identity')
output userAssignedIdentityPrincipalId string = userAssignedIdentity.properties.principalId

@description('The client ID of the managed identity')
output userAssignedIdentityClientId string = userAssignedIdentity.properties.clientId

@description('Key Vault secret names for application configuration')
output secretNames object = {
  jwtSecretKey: 'JwtSecretKey'
  defaultConnection: 'DefaultConnection'
  stripeSecretKey: 'StripeSecretKey'
  stripePublishableKey: 'StripePublishableKey'
  stripeWebhookSecret: 'StripeWebhookSecret'
  emailSmtpPassword: 'EmailSmtpPassword'
  appInsightsInstrumentationKey: 'AppInsightsInstrumentationKey'
  appInsightsConnectionString: 'AppInsightsConnectionString'
}

@description('Key Vault reference configuration for application settings')
output keyVaultReferences object = {
  ConnectionStrings__DefaultConnection: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=DefaultConnection)'
  ConnectionStrings__ApplicationInsights: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=AppInsightsConnectionString)'
  JwtSettings__SecretKey: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=JwtSecretKey)'
  StripeSettings__SecretKey: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=StripeSecretKey)'
  StripeSettings__PublishableKey: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=StripePublishableKey)'
  StripeSettings__WebhookSecret: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=StripeWebhookSecret)'
  EmailConfiguration__Password: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=EmailSmtpPassword)'
  ApplicationInsights__ConnectionString: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=AppInsightsConnectionString)'
  ApplicationInsights__InstrumentationKey: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=AppInsightsInstrumentationKey)'
}
