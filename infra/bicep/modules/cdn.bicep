// ----------------------------------------------------------------------------------------------------
// Azure CDN Module for Static Asset Delivery and React Build Optimization
// Using Azure Verified Modules and performance best practices
// ----------------------------------------------------------------------------------------------------

targetScope = 'resourceGroup'

// ----------------------------------------------------------------------------------------------------
// Parameters
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where the CDN profile should be deployed.')
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

@description('The resource ID of the storage account for static assets.')
param storageAccountId string

@description('The primary endpoint of the storage account.')
param storageAccountEndpoint string

@description('The resource ID of the App Service for origin configuration.')
param appServiceId string

@description('The hostname of the App Service.')
param appServiceHostname string

@description('The resource ID of the Log Analytics workspace for diagnostics.')
param logAnalyticsWorkspaceId string

@description('Custom domain name for the CDN endpoint (optional).')
param customDomainName string = ''

@description('Enable HTTPS redirect for the CDN endpoint.')
param enableHttpsRedirect bool = true

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

// CDN configuration based on environment
var cdnConfig = {
  dev: {
    sku: 'Standard_Microsoft'
    optimizationType: 'GeneralWebDelivery'
    compressionEnabled: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    cachingRules: [
      {
        name: 'StaticAssets'
        order: 1
        matchConditions: [
          {
            matchVariable: 'UrlFileExtension'
            operator: 'Equal'
            negateCondition: false
            matchValues: ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot']
          }
        ]
        actions: [
          {
            name: 'CacheExpiration'
            parameters: {
              cacheBehavior: 'Override'
              cacheType: 'All'
              cacheDuration: 'P30D' // 30 days
            }
          }
        ]
      }
    ]
    geoFilters: []
  }
  test: {
    sku: 'Standard_Microsoft'
    optimizationType: 'GeneralWebDelivery'
    compressionEnabled: true
    queryStringCachingBehavior: 'UseQueryString'
    cachingRules: [
      {
        name: 'StaticAssets'
        order: 1
        matchConditions: [
          {
            matchVariable: 'UrlFileExtension'
            operator: 'Equal'
            negateCondition: false
            matchValues: ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot']
          }
        ]
        actions: [
          {
            name: 'CacheExpiration'
            parameters: {
              cacheBehavior: 'Override'
              cacheType: 'All'
              cacheDuration: 'P7D' // 7 days
            }
          }
        ]
      }
      {
        name: 'ApiRequests'
        order: 2
        matchConditions: [
          {
            matchVariable: 'UrlPath'
            operator: 'BeginsWith'
            negateCondition: false
            matchValues: ['/api/']
          }
        ]
        actions: [
          {
            name: 'CacheExpiration'
            parameters: {
              cacheBehavior: 'Override'
              cacheType: 'All'
              cacheDuration: 'PT0S' // No caching for API requests
            }
          }
        ]
      }
    ]
    geoFilters: []
  }
  prod: {
    sku: 'Premium_Verizon'
    optimizationType: 'GeneralWebDelivery'
    compressionEnabled: true
    queryStringCachingBehavior: 'UseQueryString'
    cachingRules: [
      {
        name: 'StaticAssets'
        order: 1
        matchConditions: [
          {
            matchVariable: 'UrlFileExtension'
            operator: 'Equal'
            negateCondition: false
            matchValues: ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'webp', 'avif']
          }
        ]
        actions: [
          {
            name: 'CacheExpiration'
            parameters: {
              cacheBehavior: 'Override'
              cacheType: 'All'
              cacheDuration: 'P365D' // 1 year for static assets
            }
          }
          {
            name: 'ModifyResponseHeader'
            parameters: {
              headerAction: 'Overwrite'
              headerName: 'Cache-Control'
              value: 'public, max-age=31536000, immutable'
            }
          }
        ]
      }
      {
        name: 'HtmlFiles'
        order: 2
        matchConditions: [
          {
            matchVariable: 'UrlFileExtension'
            operator: 'Equal'
            negateCondition: false
            matchValues: ['html', 'htm']
          }
        ]
        actions: [
          {
            name: 'CacheExpiration'
            parameters: {
              cacheBehavior: 'Override'
              cacheType: 'All'
              cacheDuration: 'PT1H' // 1 hour for HTML files
            }
          }
        ]
      }
      {
        name: 'ApiRequests'
        order: 3
        matchConditions: [
          {
            matchVariable: 'UrlPath'
            operator: 'BeginsWith'
            negateCondition: false
            matchValues: ['/api/']
          }
        ]
        actions: [
          {
            name: 'CacheExpiration'
            parameters: {
              cacheBehavior: 'Override'
              cacheType: 'All'
              cacheDuration: 'PT0S' // No caching for API requests
            }
          }
        ]
      }
    ]
    geoFilters: [
      {
        relativePath: '/admin/*'
        action: 'Block'
        countryCodes: ['CN', 'RU', 'KP'] // Block admin access from certain countries
      }
    ]
  }
}

var currentConfig = cdnConfig[environmentName]

// Resource naming
var cdnProfileName = 'cdn-${resourceToken}'
var cdnEndpointName = 'cdn-${resourceToken}-endpoint'
var staticAssetsContainerName = 'static-assets'

// ----------------------------------------------------------------------------------------------------
// Storage Account for Static Assets
// ----------------------------------------------------------------------------------------------------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: last(split(storageAccountId, '/'))
}

resource staticAssetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/${staticAssetsContainerName}'
  properties: {
    publicAccess: 'Blob' // Allow public read access for CDN
    metadata: {
      purpose: 'Static assets for CDN delivery'
      environment: environmentName
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// CDN Profile
// ----------------------------------------------------------------------------------------------------

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'Global'
  tags: tags
  sku: {
    name: currentConfig.sku
  }
  properties: {
    originResponseTimeoutSeconds: 240
  }
}

// ----------------------------------------------------------------------------------------------------
// CDN Endpoint for Static Assets
// ----------------------------------------------------------------------------------------------------

resource staticAssetsCdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: '${cdnEndpointName}-static'
  location: 'Global'
  tags: tags
  properties: {
    isHttpAllowed: !enableHttpsRedirect
    isHttpsAllowed: true
    queryStringCachingBehavior: currentConfig.queryStringCachingBehavior
    isCompressionEnabled: currentConfig.compressionEnabled
    contentTypesToCompress: [
      'application/javascript'
      'application/json'
      'application/x-javascript'
      'text/css'
      'text/html'
      'text/javascript'
      'text/plain'
      'text/xml'
      'image/svg+xml'
      'application/xml'
      'application/xml+rss'
      'application/rss+xml'
      'application/atom+xml'
      'image/x-icon'
    ]
    optimizationType: currentConfig.optimizationType
    origins: [
      {
        name: 'storage-origin'
        properties: {
          hostName: replace(replace(storageAccountEndpoint, 'https://', ''), '/', '')
          httpPort: 80
          httpsPort: 443
          originHostHeader: replace(replace(storageAccountEndpoint, 'https://', ''), '/', '')
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
    originPath: '/${staticAssetsContainerName}'
    deliveryPolicy: {
      rules: [for rule in currentConfig.cachingRules: {
        name: rule.name
        order: rule.order
        conditions: [for condition in rule.matchConditions: {
          name: condition.matchVariable
          parameters: {
            '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRule${condition.matchVariable}MatchConditionParameters'
            operator: condition.operator
            negateCondition: condition.negateCondition
            matchValues: condition.matchValues
          }
        }]
        actions: [for action in rule.actions: {
          name: action.name
          parameters: action.parameters
        }]
      }]
    }
    geoFilters: currentConfig.geoFilters
  }
}

// ----------------------------------------------------------------------------------------------------
// CDN Endpoint for App Service (SPA Routing)
// ----------------------------------------------------------------------------------------------------

resource appServiceCdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: '${cdnEndpointName}-app'
  location: 'Global'
  tags: tags
  properties: {
    isHttpAllowed: !enableHttpsRedirect
    isHttpsAllowed: true
    queryStringCachingBehavior: 'UseQueryString'
    isCompressionEnabled: true
    contentTypesToCompress: [
      'text/html'
      'application/javascript'
      'text/css'
      'application/json'
    ]
    optimizationType: 'GeneralWebDelivery'
    origins: [
      {
        name: 'appservice-origin'
        properties: {
          hostName: appServiceHostname
          httpPort: 80
          httpsPort: 443
          originHostHeader: appServiceHostname
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
    deliveryPolicy: {
      rules: [
        {
          name: 'SpaRouting'
          order: 1
          conditions: [
            {
              name: 'UrlFileExtension'
              parameters: {
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlFileExtensionMatchConditionParameters'
                operator: 'Equal'
                negateCondition: true
                matchValues: ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'json', 'xml']
              }
            }
          ]
          actions: [
            {
              name: 'UrlRewrite'
              parameters: {
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRewriteActionParameters'
                sourcePattern: '/'
                destination: '/index.html'
                preserveUnmatchedPath: false
              }
            }
          ]
        }
        {
          name: 'ApiPassthrough'
          order: 2
          conditions: [
            {
              name: 'UrlPath'
              parameters: {
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlPathMatchConditionParameters'
                operator: 'BeginsWith'
                negateCondition: false
                matchValues: ['/api/']
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                '@odata.type': '#Microsoft.Azure.Cdn.Models.DeliveryRuleCacheExpirationActionParameters'
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: 'PT0S'
              }
            }
          ]
        }
      ]
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Custom Domain (if provided)
// ----------------------------------------------------------------------------------------------------

resource customDomain 'Microsoft.Cdn/profiles/endpoints/customDomains@2023-05-01' = if (!empty(customDomainName)) {
  parent: appServiceCdnEndpoint
  name: replace(customDomainName, '.', '-')
  properties: {
    hostName: customDomainName
  }
}

// ----------------------------------------------------------------------------------------------------
// Diagnostic Settings
// ----------------------------------------------------------------------------------------------------

resource cdnDiagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: cdnProfile
  name: 'cdn-diagnostics'
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
// Outputs
// ----------------------------------------------------------------------------------------------------

output cdnProfileName string = cdnProfile.name
output cdnProfileId string = cdnProfile.id
output staticAssetsCdnEndpointName string = staticAssetsCdnEndpoint.name
output staticAssetsCdnEndpointHostname string = staticAssetsCdnEndpoint.properties.hostName
output staticAssetsCdnEndpointUrl string = 'https://${staticAssetsCdnEndpoint.properties.hostName}'
output appServiceCdnEndpointName string = appServiceCdnEndpoint.name
output appServiceCdnEndpointHostname string = appServiceCdnEndpoint.properties.hostName
output appServiceCdnEndpointUrl string = 'https://${appServiceCdnEndpoint.properties.hostName}'
output staticAssetsContainerName string = staticAssetsContainerName
output customDomainConfigured bool = !empty(customDomainName)
