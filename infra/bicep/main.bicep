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

// ----------------------------------------------------------------------------------------------------
// Application Secret Parameters (Optional - will be set via parameter files)
// ----------------------------------------------------------------------------------------------------

@description('Stripe API secret key for payment processing')
@secure()
param stripeApiKey string = ''

@description('Stripe publishable key for client-side payment processing')
param stripePublishableKey string = ''

@description('Stripe webhook secret for payment event verification')
@secure()
param stripeWebhookSecret string = ''

@description('SMTP password for email service configuration')
@secure()
param emailSmtpPassword string = ''

@description('The environment name for the deployment')
param environmentName string = 'dev'

// ----------------------------------------------------------------------------------------------------
// Custom Domain & SSL Certificate Parameters
// ----------------------------------------------------------------------------------------------------

@description('Custom domain name for the application (e.g., flightcompanion.example.com)')
param customDomainName string = ''

@description('Enable custom domain configuration')
param enableCustomDomain bool = false

@description('Enable App Service authentication with Azure AD')
param enableAuthentication bool = false

@description('Azure AD tenant ID for authentication')
param azureAdTenantId string = ''

@description('Azure AD client ID for authentication')
param azureAdClientId string = ''

@description('Azure AD client secret for authentication')
@secure()
param azureAdClientSecret string = ''

@description('Root domain for DNS zone (e.g., example.com)')
param rootDomainName string = ''

@description('Enable automatic DNS zone creation and management')
param enableDnsZoneManagement bool = false

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
    environmentName: environmentName
    appServicePrincipalId: appService.outputs.appServicePrincipalId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    applicationInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    applicationInsightsInstrumentationKey: monitoring.outputs.applicationInsightsInstrumentationKey
    stripeApiKey: stripeApiKey
    stripePublishableKey: stripePublishableKey
    stripeWebhookSecret: stripeWebhookSecret
    emailSmtpPassword: emailSmtpPassword
  }
  dependsOn: [
    monitoring
  ]
}

// ----------------------------------------------------------------------------------------------------
// Storage Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module storage 'modules/storage.bicep' = {
  name: 'storage-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    environmentName: environmentName
    keyVaultId: security.outputs.keyVaultId
    userAssignedIdentityId: security.outputs.userAssignedIdentityId
    appServicePrincipalId: appService.outputs.appServicePrincipalId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
  dependsOn: [
    security
  ]
}

// ----------------------------------------------------------------------------------------------------
// CDN Module (Using Azure Verified Modules)
// ----------------------------------------------------------------------------------------------------

module cdn 'modules/cdn.bicep' = {
  name: 'cdn-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    environmentName: environmentName
    storageAccountId: storage.outputs.storageAccountId
    storageAccountEndpoint: storage.outputs.primaryEndpoint
    appServiceId: appService.outputs.appServiceId
    appServiceHostname: appService.outputs.appServiceHostName
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    enableHttpsRedirect: environmentName == 'prod'
  }
  dependsOn: [
    storage
    appService
  ]
}

// ----------------------------------------------------------------------------------------------------
// Custom Domain & SSL Configuration Module
// ----------------------------------------------------------------------------------------------------

module customDomain 'modules/custom-domain.bicep' = if (enableCustomDomain && !empty(customDomainName)) {
  name: 'custom-domain-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    environmentName: environmentName
    customDomainName: customDomainName
    rootDomainName: !empty(rootDomainName) ? rootDomainName : customDomainName
    appServiceId: appService.outputs.appServiceId
    appServiceName: appService.outputs.appServiceName
    appServiceDefaultHostname: appService.outputs.appServiceHostName
    enableDnsZoneManagement: enableDnsZoneManagement
    enableAuthentication: enableAuthentication
    azureAdTenantId: azureAdTenantId
    azureAdClientId: azureAdClientId
    azureAdClientSecret: azureAdClientSecret
  }
  dependsOn: [
    appService
    security
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
    environmentName: environmentName
    alertEmailAddress: ownerEmail
    samplingPercentage: environmentName == 'dev' ? 50 : 100
    logRetentionDays: environmentName == 'dev' ? 7 : (environmentName == 'test' ? 30 : 90)
    dailyQuotaGb: environmentName == 'dev' ? 5 : (environmentName == 'test' ? 10 : 50)
  }
}

// ----------------------------------------------------------------------------------------------------
// Azure Monitor Alerts Module (Comprehensive Application Health Monitoring)
// ----------------------------------------------------------------------------------------------------

module alerts 'modules/alerts.bicep' = {
  name: 'alerts-${uniqueString(resourceGroup.id)}'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    resourceToken: resourceToken
    environmentName: environmentName
    applicationInsightsId: monitoring.outputs.applicationInsightsId
    sqlDatabaseId: database.outputs.databaseId
    appServiceId: application.outputs.appServiceId
    actionGroupId: monitoring.outputs.actionGroupId
    enableAlerts: true
    criticalAlertEmail: ownerEmail
    applicationName: workloadName
  }
  dependsOn: [
    monitoring
    database
    application
  ]
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
output KEY_VAULT_REFERENCES object = security.outputs.keyVaultReferences
output MANAGED_IDENTITY_CLIENT_ID string = security.outputs.userAssignedIdentityClientId

output SQL_SERVER_NAME string = database.outputs.sqlServerName
output SQL_DATABASE_NAME string = database.outputs.sqlDatabaseName

output APPLICATION_INSIGHTS_NAME string = monitoring.outputs.applicationInsightsName
output APPLICATION_INSIGHTS_CONNECTION_STRING string = monitoring.outputs.applicationInsightsConnectionString

output STORAGE_ACCOUNT_NAME string = storage.outputs.storageAccountName
output STORAGE_ACCOUNT_ENDPOINT string = storage.outputs.primaryEndpoint
output VERIFICATION_CONTAINER_NAME string = storage.outputs.verificationContainerName
output STORAGE_KEY_VAULT_REFERENCES object = storage.outputs.keyVaultReferences

output CDN_PROFILE_NAME string = cdn.outputs.cdnProfileName
output CDN_STATIC_ASSETS_ENDPOINT string = cdn.outputs.staticAssetsCdnEndpointUrl
output CDN_APP_ENDPOINT string = cdn.outputs.appServiceCdnEndpointUrl
output CDN_STATIC_ASSETS_HOSTNAME string = cdn.outputs.staticAssetsCdnEndpointHostname
output CDN_APP_HOSTNAME string = cdn.outputs.appServiceCdnEndpointHostname

// Custom Domain & SSL Outputs
output CUSTOM_DOMAIN_NAME string = enableCustomDomain ? customDomain.outputs.customDomainName : ''
output CUSTOM_DOMAIN_URL string = enableCustomDomain ? customDomain.outputs.customDomainUrl : ''
output CUSTOM_DOMAIN_SSL_THUMBPRINT string = enableCustomDomain ? customDomain.outputs.certificateThumbprint : ''
output CUSTOM_DOMAIN_SSL_EXPIRATION string = enableCustomDomain ? customDomain.outputs.certificateExpirationDate : ''
output CUSTOM_DOMAIN_DNS_ZONE string = enableCustomDomain ? customDomain.outputs.dnsZoneName : ''
output CUSTOM_DOMAIN_NAME_SERVERS array = enableCustomDomain ? customDomain.outputs.dnsZoneNameServers : []
output CUSTOM_DOMAIN_AUTH_ENABLED bool = enableCustomDomain ? customDomain.outputs.authenticationEnabled : false
output CUSTOM_DOMAIN_VALIDATION_RECORDS object = enableCustomDomain ? customDomain.outputs.dnsValidationRecords : {}
output CUSTOM_DOMAIN_SECURITY_CONFIG object = enableCustomDomain ? customDomain.outputs.securityConfiguration : {}
