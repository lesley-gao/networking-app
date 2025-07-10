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

@description('Log Analytics workspace ID for diagnostics.')
param logAnalyticsWorkspaceId string

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var keyVaultName = 'kv-${resourceToken}'

// Get current user/deployment principal for Key Vault access
var currentPrincipalId = ''  // This will need to be set during deployment

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
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enableRbacAuthorization: true
    publicNetworkAccess: 'Enabled' // Can be changed to 'Disabled' for production with private endpoints
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
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

resource jwtSecretKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JwtSecretKey'
  properties: {
    value: base64(uniqueString(resourceGroup().id, 'jwt-secret', utcNow()))
    contentType: 'text/plain'
  }
}

resource stripeSecretKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'StripeSecretKey'
  properties: {
    value: 'sk_test_your_stripe_secret_key_here' // Replace with actual Stripe secret key
    contentType: 'text/plain'
  }
}

resource stripePublishableKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'StripePublishableKey'
  properties: {
    value: 'pk_test_your_stripe_publishable_key_here' // Replace with actual Stripe publishable key
    contentType: 'text/plain'
  }
}

resource emailServiceKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'EmailServiceKey'
  properties: {
    value: 'your_email_service_key_here' // Replace with actual email service key (SendGrid, etc.)
    contentType: 'text/plain'
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

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultEndpoint string = keyVault.properties.vaultUri

output userAssignedIdentityId string = userAssignedIdentity.id
output userAssignedIdentityPrincipalId string = userAssignedIdentity.properties.principalId
output userAssignedIdentityClientId string = userAssignedIdentity.properties.clientId
