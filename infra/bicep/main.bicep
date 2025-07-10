// ----------------------------------------------------------------------------------------------------
// NetworkingApp - Flight Companion & Airport Pickup Platform
// Main Bicep Template for Azure Developer CLI (azd)
// ----------------------------------------------------------------------------------------------------

targetScope = 'subscription'

// ----------------------------------------------------------------------------------------------------
// Parameters
// ----------------------------------------------------------------------------------------------------

@description('The name of the workload being deployed. Used to ensure resource uniqueness.')
@minLength(3)
@maxLength(15)
param workloadName string

@description('The Azure region where all resources should be deployed.')
@minLength(3)
param location string = deployment().location

@description('The environment for this deployment (dev, test, prod).')
@allowed([
  'dev'
  'test'
  'prod'
])
param environmentName string = 'dev'

@description('Tags to be applied to all resources.')
param tags object = {}

@description('The contact information for the owner of this application')
param ownerName string = ''
param ownerEmail string = ''

// Merge the standard tags with any provided tags
var defaultTags = {
  'azd-env-name': environmentName
  'workload-name': workloadName
  owner: ownerName
  email: ownerEmail
  environment: environmentName
}
var allTags = union(defaultTags, tags)

// Resource naming
var resourceToken = toLower('${workloadName}-${environmentName}')
var resourceGroupName = 'rg-${resourceToken}'

// ----------------------------------------------------------------------------------------------------
// Resource Group
// ----------------------------------------------------------------------------------------------------

resource resourceGroup 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
  tags: allTags
}

// ----------------------------------------------------------------------------------------------------
// Networking Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module networking 'modules/networking.bicep' = {
  name: 'networking-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
  }
}

// ----------------------------------------------------------------------------------------------------
// App Service Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module appService 'modules/app-service.bicep' = {
  name: 'app-service-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    vnetId: networking.outputs.vnetId
    appSubnetId: networking.outputs.appSubnetId
  }
}

// ----------------------------------------------------------------------------------------------------
// Database Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module database 'modules/database.bicep' = {
  name: 'database-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    vnetId: networking.outputs.vnetId
    dbSubnetId: networking.outputs.dbSubnetId
    keyVaultId: security.outputs.keyVaultId
  }
  dependsOn: [
    security
  ]
}

// ----------------------------------------------------------------------------------------------------
// Security Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module security 'modules/security.bicep' = {
  name: 'security-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    appServicePrincipalId: appService.outputs.appServicePrincipalId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    monitoring
  ]
}

// ----------------------------------------------------------------------------------------------------
// Monitoring Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
  }
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP_NAME string = resourceGroup.name

output APP_SERVICE_NAME string = appService.outputs.appServiceName
output APP_SERVICE_HOSTNAME string = appService.outputs.appServiceHostName
output APP_SERVICE_URL string = appService.outputs.appServiceUrl

output KEY_VAULT_NAME string = security.outputs.keyVaultName
output KEY_VAULT_ENDPOINT string = security.outputs.keyVaultEndpoint

output SQL_SERVER_NAME string = database.outputs.sqlServerName
output SQL_DATABASE_NAME string = database.outputs.sqlDatabaseName

output APPLICATION_INSIGHTS_NAME string = monitoring.outputs.applicationInsightsName
output APPLICATION_INSIGHTS_CONNECTION_STRING string = monitoring.outputs.applicationInsightsConnectionString
