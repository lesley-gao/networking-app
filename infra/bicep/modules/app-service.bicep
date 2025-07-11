// ----------------------------------------------------------------------------------------------------
// App Service Module - Azure App Service with Application Service Plan and Deployment Slots
// TASK-084: Set up Azure App Service with .NET 8 runtime and configure deployment slots
// Using Azure Verified Modules (AVM) pattern
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where all resources should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object

@description('Resource token used for naming resources.')
param resourceToken string

@description('Virtual Network ID for VNet integration.')
param vnetId string

@description('App Service subnet ID for VNet integration.')
param appSubnetId string

@description('Environment name (dev, test, prod).')
@allowed([
  'dev'
  'test'
  'prod'
])
param environmentName string = 'dev'

@description('App Service Plan SKU configuration.')
param appServicePlanSku object = {
  dev: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  test: {
    name: 'S1'
    tier: 'Standard'
    capacity: 1
  }
  prod: {
    name: 'P1v3'
    tier: 'PremiumV3'
    capacity: 2
  }
}

@description('Enable deployment slots for staging/testing.')
param enableDeploymentSlots bool = true

@description('Application Insights connection string.')
param applicationInsightsConnectionString string = ''

@description('Key Vault reference for storing secrets.')
param keyVaultName string = ''

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var appServicePlanName = 'asp-${resourceToken}'
var appServiceName = 'app-${resourceToken}'
var selectedSku = appServicePlanSku[environmentName]

// Common app settings for all environments
var commonAppSettings = [
  {
    name: 'WEBSITE_RUN_FROM_PACKAGE'
    value: '1'
  }
  {
    name: 'WEBSITE_ENABLE_SYNC_UPDATE_SITE'
    value: 'true'
  }
  {
    name: 'WEBSITE_HTTPLOGGING_RETENTION_DAYS'
    value: '30'
  }
  {
    name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
    value: 'false'
  }
  {
    name: 'WEBSITE_HEALTHCHECK_MAXPINGFAILURES'
    value: '10'
  }
  {
    name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
    value: 'false'
  }
  {
    name: 'WEBSITES_PORT'
    value: '8080'
  }
]

// Environment-specific app settings
var environmentAppSettings = environmentName == 'prod' ? [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Production'
  }
  {
    name: 'WEBSITE_TIME_ZONE'
    value: 'New Zealand Standard Time'
  }
] : environmentName == 'test' ? [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Testing'
  }
] : [
  {
    name: 'ASPNETCORE_ENVIRONMENT'
    value: 'Development'
  }
]

// Application Insights settings
var applicationInsightsSettings = !empty(applicationInsightsConnectionString) ? [
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: applicationInsightsConnectionString
  }
  {
    name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
    value: '~3'
  }
  {
    name: 'XDT_MicrosoftApplicationInsights_Mode'
    value: 'Recommended'
  }
] : []

// All app settings combined
var allAppSettings = concat(commonAppSettings, environmentAppSettings, applicationInsightsSettings)

// ----------------------------------------------------------------------------------------------------
// Application Service Plan
// ----------------------------------------------------------------------------------------------------

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
    'component': 'app-service-plan'
    'environment': environmentName
  })
  sku: {
    name: selectedSku.name
    tier: selectedSku.tier
    capacity: selectedSku.capacity
  }
  kind: 'linux'
  properties: {
    reserved: true
    targetWorkerCount: selectedSku.capacity
    targetWorkerSizeId: selectedSku.name == 'P1v3' ? 3 : selectedSku.name == 'S1' ? 1 : 0
  }
}

// ----------------------------------------------------------------------------------------------------
// Production App Service
// ----------------------------------------------------------------------------------------------------

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appServiceName
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
    'component': 'app-service'
    'environment': environmentName
    'slot': 'production'
  })
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    virtualNetworkSubnetId: appSubnetId
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: environmentName == 'prod' ? true : false
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: false
      webSocketsEnabled: true
      healthCheckPath: '/health'
      http20Enabled: true
      httpLoggingEnabled: true
      logsDirectorySizeLimit: 35
      detailedErrorLoggingEnabled: true
      requestTracingEnabled: environmentName != 'prod'
      remoteDebuggingEnabled: false
      autoSwapSlotName: environmentName == 'prod' ? 'staging' : ''
      appSettings: allAppSettings
      connectionStrings: []
      defaultDocuments: [
        'index.html'
      ]
      ipSecurityRestrictions: []
      scmIpSecurityRestrictions: []
      scmIpSecurityRestrictionsUseMain: false
      cors: {
        allowedOrigins: [
          'https://${appServiceName}.azurewebsites.net'
          'https://${appServiceName}-staging.azurewebsites.net'
        ]
        supportCredentials: true
      }
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// VNet Integration
// ----------------------------------------------------------------------------------------------------

resource vnetConnection 'Microsoft.Web/sites/virtualNetworkConnections@2023-01-01' = {
  parent: appService
  name: 'vnet-integration'
  properties: {
    vnetResourceId: vnetId
    isSwift: true
  }
}

// ----------------------------------------------------------------------------------------------------
// Deployment Slots (Staging and Testing)
// ----------------------------------------------------------------------------------------------------

// Staging Deployment Slot
resource stagingSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (enableDeploymentSlots) {
  parent: appService
  name: 'staging'
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
    'component': 'app-service'
    'environment': environmentName
    'slot': 'staging'
  })
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: false
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: false
      webSocketsEnabled: true
      healthCheckPath: '/health'
      http20Enabled: true
      appSettings: concat(commonAppSettings, [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Staging'
        }
        {
          name: 'SLOT_NAME'
          value: 'staging'
        }
      ], applicationInsightsSettings)
      connectionStrings: []
    }
  }
}

// Testing Deployment Slot (for test environment only)
resource testingSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (enableDeploymentSlots && environmentName == 'test') {
  parent: appService
  name: 'testing'
  location: location
  tags: union(tags, {
    'azd-service-name': 'api'
    'component': 'app-service'
    'environment': environmentName
    'slot': 'testing'
  })
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: false
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: false
      webSocketsEnabled: true
      healthCheckPath: '/health'
      http20Enabled: true
      appSettings: concat(commonAppSettings, [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Testing'
        }
        {
          name: 'SLOT_NAME'
          value: 'testing'
        }
      ], applicationInsightsSettings)
      connectionStrings: []
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Auto-scaling Configuration (Production only)
// ----------------------------------------------------------------------------------------------------

resource autoScale 'Microsoft.Insights/autoscalesettings@2022-10-01' = if (environmentName == 'prod') {
  name: 'autoscale-${resourceToken}'
  location: location
  tags: union(tags, {
    'component': 'autoscale'
    'environment': environmentName
  })
  properties: {
    name: 'autoscale-${resourceToken}'
    targetResourceUri: appServicePlan.id
    enabled: true
    profiles: [
      {
        name: 'Default'
        capacity: {
          minimum: '2'
          maximum: '10'
          default: '2'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
          {
            metricTrigger: {
              metricName: 'MemoryPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 80
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
      {
        name: 'Peak Hours'
        capacity: {
          minimum: '3'
          maximum: '15'
          default: '3'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 60
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '2'
              cooldown: 'PT5M'
            }
          }
        ]
        recurrence: {
          frequency: 'Week'
          schedule: {
            timeZone: 'New Zealand Standard Time'
            days: [
              'Monday'
              'Tuesday'
              'Wednesday'
              'Thursday'
              'Friday'
            ]
            hours: [
              6
              7
              8
              17
              18
              19
            ]
            minutes: [
              0
            ]
          }
        }
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

output appServiceName string = appService.name
output appServiceId string = appService.id
output appServiceHostName string = appService.properties.defaultHostName
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePrincipalId string = appService.identity.principalId

// Staging slot outputs
output stagingSlotName string = enableDeploymentSlots ? stagingSlot.name : ''
output stagingSlotHostName string = enableDeploymentSlots ? stagingSlot.properties.defaultHostName : ''
output stagingSlotUrl string = enableDeploymentSlots ? 'https://${stagingSlot.properties.defaultHostName}' : ''
output stagingSlotPrincipalId string = enableDeploymentSlots ? stagingSlot.identity.principalId : ''

// Testing slot outputs (test environment only)
output testingSlotName string = (enableDeploymentSlots && environmentName == 'test') ? testingSlot.name : ''
output testingSlotHostName string = (enableDeploymentSlots && environmentName == 'test') ? testingSlot.properties.defaultHostName : ''
output testingSlotUrl string = (enableDeploymentSlots && environmentName == 'test') ? 'https://${testingSlot.properties.defaultHostName}' : ''
output testingSlotPrincipalId string = (enableDeploymentSlots && environmentName == 'test') ? testingSlot.identity.principalId : ''

// App Service Plan outputs
output appServicePlanName string = appServicePlan.name
output appServicePlanId string = appServicePlan.id
output appServicePlanSku string = selectedSku.name

// Deployment information
output deploymentSlots object = {
  production: {
    name: appService.name
    url: 'https://${appService.properties.defaultHostName}'
    enabled: true
  }
  staging: {
    name: enableDeploymentSlots ? stagingSlot.name : ''
    url: enableDeploymentSlots ? 'https://${stagingSlot.properties.defaultHostName}' : ''
    enabled: enableDeploymentSlots
  }
  testing: {
    name: (enableDeploymentSlots && environmentName == 'test') ? testingSlot.name : ''
    url: (enableDeploymentSlots && environmentName == 'test') ? 'https://${testingSlot.properties.defaultHostName}' : ''
    enabled: enableDeploymentSlots && environmentName == 'test'
  }
}
