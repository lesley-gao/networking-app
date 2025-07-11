@description('Environment name for resource naming')
param environmentName string = 'dev'

@description('Location for resources')
param location string = resourceGroup().location

@description('Virtual network name')
param vnetName string = 'vnet-flight-companion-${environmentName}'

@description('Virtual network address prefix')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Application Gateway subnet prefix')
param appGatewaySubnetPrefix string = '10.0.1.0/24'

@description('App Service subnet prefix')
param appServiceSubnetPrefix string = '10.0.2.0/24'

@description('Database subnet prefix')
param databaseSubnetPrefix string = '10.0.3.0/24'

@description('Management subnet prefix')
param managementSubnetPrefix string = '10.0.4.0/24'

@description('Application Gateway SKU')
@allowed([
  'Standard_v2'
  'WAF_v2'
])
param appGatewaySkuName string = 'WAF_v2'

@description('Application Gateway capacity')
param appGatewayCapacity int = 2

@description('Enable DDoS Protection')
param enableDdosProtection bool = false

@description('DDoS Protection Plan ID')
param ddosProtectionPlanId string = ''

@description('Tags to apply to resources')
param tags object = {}

@description('App Service name for backend configuration')
param appServiceName string = 'app-flight-companion-${environmentName}'

@description('SQL Server name for database security')
param sqlServerName string = 'sql-flight-companion-${environmentName}'

@description('Key Vault name for certificate storage')
param keyVaultName string = 'kv-flight-companion-${environmentName}'

@description('Log Analytics workspace ID for diagnostics')
param logAnalyticsWorkspaceId string = ''

// ==================================================================================================
// Variables
// ==================================================================================================

var resourceNamingPrefix = 'fc-${environmentName}'
var nsgAppGatewayName = '${resourceNamingPrefix}-nsg-appgw'
var nsgAppServiceName = '${resourceNamingPrefix}-nsg-app'
var nsgDatabaseName = '${resourceNamingPrefix}-nsg-db'
var nsgManagementName = '${resourceNamingPrefix}-nsg-mgmt'
var appGatewayName = '${resourceNamingPrefix}-appgw'
var publicIpName = '${resourceNamingPrefix}-pip-appgw'
var wafPolicyName = '${resourceNamingPrefix}-waf-policy'

var commonTags = union(tags, {
  Environment: environmentName
  Application: 'FlightCompanion'
  Component: 'NetworkSecurity'
  ManagedBy: 'AzureDeveloperCLI'
})

// Environment-specific configurations
var environmentConfig = {
  dev: {
    ddosProtection: false
    wafMode: 'Detection'
    publicIpSku: 'Standard'
    appGatewayTier: 'WAF_v2'
    enablePrivateEndpoints: false
  }
  test: {
    ddosProtection: false
    wafMode: 'Prevention'
    publicIpSku: 'Standard'
    appGatewayTier: 'WAF_v2'
    enablePrivateEndpoints: true
  }
  prod: {
    ddosProtection: true
    wafMode: 'Prevention'
    publicIpSku: 'Standard'
    appGatewayTier: 'WAF_v2'
    enablePrivateEndpoints: true
  }
}

var currentConfig = environmentConfig[environmentName]

// ==================================================================================================
// Network Security Groups
// ==================================================================================================

// Application Gateway NSG
resource nsgAppGateway 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgAppGatewayName
  location: location
  tags: commonTags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPSInbound'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
          description: 'Allow HTTPS traffic from Internet'
        }
      }
      {
        name: 'AllowHTTPInbound'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
          description: 'Allow HTTP traffic for redirect to HTTPS'
        }
      }
      {
        name: 'AllowAppGatewayManagement'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '65200-65535'
          sourceAddressPrefix: 'GatewayManager'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1020
          direction: 'Inbound'
          description: 'Allow Azure infrastructure communication'
        }
      }
      {
        name: 'AllowAzureLoadBalancer'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'AzureLoadBalancer'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1030
          direction: 'Inbound'
          description: 'Allow Azure Load Balancer'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// App Service NSG
resource nsgAppService 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgAppServiceName
  location: location
  tags: commonTags
  properties: {
    securityRules: [
      {
        name: 'AllowAppGatewayToAppService'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRanges: [
            '80'
            '443'
          ]
          sourceAddressPrefix: appGatewaySubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
          description: 'Allow traffic from Application Gateway'
        }
      }
      {
        name: 'AllowAzureInfrastructure'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '454'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
          description: 'Allow Azure App Service infrastructure'
        }
      }
      {
        name: 'DenyDirectInternetAccess'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRanges: [
            '80'
            '443'
          ]
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 2000
          direction: 'Inbound'
          description: 'Deny direct internet access to App Service'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// Database NSG
resource nsgDatabase 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgDatabaseName
  location: location
  tags: commonTags
  properties: {
    securityRules: [
      {
        name: 'AllowAppServiceToDatabase'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '1433'
          sourceAddressPrefix: appServiceSubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
          description: 'Allow App Service to access SQL Database'
        }
      }
      {
        name: 'AllowManagementToDatabase'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '1433'
          sourceAddressPrefix: managementSubnetPrefix
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
          description: 'Allow management subnet to access database'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// Management NSG
resource nsgManagement 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgManagementName
  location: location
  tags: commonTags
  properties: {
    securityRules: [
      {
        name: 'AllowSSHFromInternet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
          description: 'Allow SSH for management access'
        }
      }
      {
        name: 'AllowRDPFromInternet'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3389'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1010
          direction: 'Inbound'
          description: 'Allow RDP for management access'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Deny'
          priority: 4096
          direction: 'Inbound'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// ==================================================================================================
// Virtual Network and Subnets
// ==================================================================================================

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: commonTags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    enableDdosProtection: currentConfig.ddosProtection
    ddosProtectionPlan: currentConfig.ddosProtection && !empty(ddosProtectionPlanId) ? {
      id: ddosProtectionPlanId
    } : null
    subnets: [
      {
        name: 'AppGatewaySubnet'
        properties: {
          addressPrefix: appGatewaySubnetPrefix
          networkSecurityGroup: {
            id: nsgAppGateway.id
          }
          serviceEndpoints: []
          delegations: []
        }
      }
      {
        name: 'AppServiceSubnet'
        properties: {
          addressPrefix: appServiceSubnetPrefix
          networkSecurityGroup: {
            id: nsgAppService.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Web'
            }
            {
              service: 'Microsoft.KeyVault'
            }
          ]
          delegations: [
            {
              name: 'appServiceDelegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: 'DatabaseSubnet'
        properties: {
          addressPrefix: databaseSubnetPrefix
          networkSecurityGroup: {
            id: nsgDatabase.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Sql'
            }
          ]
          delegations: []
        }
      }
      {
        name: 'ManagementSubnet'
        properties: {
          addressPrefix: managementSubnetPrefix
          networkSecurityGroup: {
            id: nsgManagement.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.KeyVault'
            }
          ]
          delegations: []
        }
      }
    ]
  }
}

// ==================================================================================================
// Public IP for Application Gateway
// ==================================================================================================

resource publicIpAppGateway 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: publicIpName
  location: location
  tags: commonTags
  sku: {
    name: currentConfig.publicIpSku
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
    dnsSettings: {
      domainNameLabel: '${resourceNamingPrefix}-appgw'
    }
    idleTimeoutInMinutes: 4
  }
}

// ==================================================================================================
// Web Application Firewall Policy
// ==================================================================================================

resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-05-01' = {
  name: wafPolicyName
  location: location
  tags: commonTags
  properties: {
    policySettings: {
      requestBodyCheck: true
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 10
      state: 'Enabled'
      mode: currentConfig.wafMode
      requestBodyInspectLimitInKB: 128
      fileUploadEnforcement: true
      requestBodyEnforcement: true
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'OWASP'
          ruleSetVersion: '3.2'
          ruleGroupOverrides: []
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '0.1'
          ruleGroupOverrides: []
        }
      ]
      exclusions: []
    }
    customRules: [
      {
        name: 'RateLimitRule'
        priority: 1
        ruleType: 'RateLimitRule'
        action: 'Block'
        rateLimitDuration: 'OneMin'
        rateLimitThreshold: 100
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RemoteAddr'
              }
            ]
            operator: 'IPMatch'
            negationCondition: false
            matchValues: [
              '0.0.0.0/0'
            ]
          }
        ]
      }
      {
        name: 'GeoBlockRule'
        priority: 2
        ruleType: 'MatchRule'
        action: 'Block'
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RemoteAddr'
              }
            ]
            operator: 'GeoMatch'
            negationCondition: true
            matchValues: [
              'NZ'
              'AU'
              'CN'
              'US'
              'CA'
              'GB'
            ]
          }
        ]
      }
    ]
  }
}

// ==================================================================================================
// Application Gateway
// ==================================================================================================

resource applicationGateway 'Microsoft.Network/applicationGateways@2023-05-01' = {
  name: appGatewayName
  location: location
  tags: commonTags
  properties: {
    sku: {
      name: currentConfig.appGatewayTier
      tier: currentConfig.appGatewayTier
      capacity: appGatewayCapacity
    }
    gatewayIPConfigurations: [
      {
        name: 'appGatewayIpConfig'
        properties: {
          subnet: {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'AppGatewaySubnet')
          }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'appGwPublicFrontendIp'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          publicIPAddress: {
            id: publicIpAppGateway.id
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: 'port_80'
        properties: {
          port: 80
        }
      }
      {
        name: 'port_443'
        properties: {
          port: 443
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'appServiceBackendPool'
        properties: {
          backendAddresses: [
            {
              fqdn: '${appServiceName}.azurewebsites.net'
            }
          ]
        }
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'appServiceBackendHttpSettings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 20
          probe: {
            id: resourceId('Microsoft.Network/applicationGateways/probes', appGatewayName, 'appServiceHealthProbe')
          }
        }
      }
    ]
    httpListeners: [
      {
        name: 'appGatewayHttpListener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGwPublicFrontendIp')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_80')
          }
          protocol: 'Http'
          requireServerNameIndication: false
        }
      }
      {
        name: 'appGatewayHttpsListener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGwPublicFrontendIp')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_443')
          }
          protocol: 'Https'
          requireServerNameIndication: false
          sslCertificate: {
            id: resourceId('Microsoft.Network/applicationGateways/sslCertificates', appGatewayName, 'appGatewaySslCert')
          }
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'httpToHttpsRedirect'
        properties: {
          ruleType: 'Basic'
          priority: 1000
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'appGatewayHttpListener')
          }
          redirectConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/redirectConfigurations', appGatewayName, 'httpToHttpsRedirect')
          }
        }
      }
      {
        name: 'httpsRule'
        properties: {
          ruleType: 'Basic'
          priority: 1001
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'appGatewayHttpsListener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', appGatewayName, 'appServiceBackendPool')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', appGatewayName, 'appServiceBackendHttpSettings')
          }
        }
      }
    ]
    redirectConfigurations: [
      {
        name: 'httpToHttpsRedirect'
        properties: {
          redirectType: 'Permanent'
          targetListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'appGatewayHttpsListener')
          }
          includePath: true
          includeQueryString: true
        }
      }
    ]
    probes: [
      {
        name: 'appServiceHealthProbe'
        properties: {
          protocol: 'Https'
          host: '${appServiceName}.azurewebsites.net'
          path: '/health'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
          pickHostNameFromBackendHttpSettings: false
          minServers: 0
          match: {
            statusCodes: [
              '200-399'
            ]
          }
        }
      }
    ]
    sslCertificates: [
      {
        name: 'appGatewaySslCert'
        properties: {
          keyVaultSecretId: 'https://${keyVaultName}.vault.azure.net/secrets/ssl-certificate'
        }
      }
    ]
    webApplicationFirewallConfiguration: {
      enabled: true
      firewallMode: currentConfig.wafMode
      ruleSetType: 'OWASP'
      ruleSetVersion: '3.2'
      disabledRuleGroups: []
      requestBodyCheck: true
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 10
    }
    firewallPolicy: {
      id: wafPolicy.id
    }
    enableHttp2: true
    autoscaleConfiguration: {
      minCapacity: environmentName == 'prod' ? 2 : 1
      maxCapacity: environmentName == 'prod' ? 10 : 3
    }
  }
  dependsOn: [
    virtualNetwork
  ]
}

// ==================================================================================================
// Private Endpoints (for production and test environments)
// ==================================================================================================

resource privateEndpointSql 'Microsoft.Network/privateEndpoints@2023-05-01' = if (currentConfig.enablePrivateEndpoints) {
  name: '${resourceNamingPrefix}-pe-sql'
  location: location
  tags: commonTags
  properties: {
    subnet: {
      id: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'DatabaseSubnet')
    }
    privateLinkServiceConnections: [
      {
        name: '${resourceNamingPrefix}-pe-sql-connection'
        properties: {
          privateLinkServiceId: resourceId('Microsoft.Sql/servers', sqlServerName)
          groupIds: [
            'sqlServer'
          ]
        }
      }
    ]
  }
  dependsOn: [
    virtualNetwork
  ]
}

resource privateEndpointKeyVault 'Microsoft.Network/privateEndpoints@2023-05-01' = if (currentConfig.enablePrivateEndpoints) {
  name: '${resourceNamingPrefix}-pe-kv'
  location: location
  tags: commonTags
  properties: {
    subnet: {
      id: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'AppServiceSubnet')
    }
    privateLinkServiceConnections: [
      {
        name: '${resourceNamingPrefix}-pe-kv-connection'
        properties: {
          privateLinkServiceId: resourceId('Microsoft.KeyVault/vaults', keyVaultName)
          groupIds: [
            'vault'
          ]
        }
      }
    ]
  }
  dependsOn: [
    virtualNetwork
  ]
}

// ==================================================================================================
// Diagnostic Settings
// ==================================================================================================

resource nsgAppGatewayDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  scope: nsgAppGateway
  name: 'nsg-appgateway-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
  }
}

resource applicationGatewayDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  scope: applicationGateway
  name: 'appgateway-diagnostics'
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environmentName == 'prod' ? 365 : 90
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
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
// Outputs
// ==================================================================================================

@description('Virtual Network resource ID')
output vnetId string = virtualNetwork.id

@description('Virtual Network name')
output vnetName string = virtualNetwork.name

@description('Application Gateway public IP address')
output appGatewayPublicIp string = publicIpAppGateway.properties.ipAddress

@description('Application Gateway FQDN')
output appGatewayFqdn string = publicIpAppGateway.properties.dnsSettings.fqdn

@description('Application Gateway resource ID')
output appGatewayId string = applicationGateway.id

@description('Application Gateway name')
output appGatewayName string = applicationGateway.name

@description('WAF Policy resource ID')
output wafPolicyId string = wafPolicy.id

@description('Network Security Group IDs')
output nsgIds object = {
  appGateway: nsgAppGateway.id
  appService: nsgAppService.id
  database: nsgDatabase.id
  management: nsgManagement.id
}

@description('Subnet IDs')
output subnetIds object = {
  appGateway: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'AppGatewaySubnet')
  appService: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'AppServiceSubnet')
  database: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'DatabaseSubnet')
  management: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'ManagementSubnet')
}

@description('Private Endpoint IDs (if enabled)')
output privateEndpointIds object = currentConfig.enablePrivateEndpoints ? {
  sql: privateEndpointSql.id
  keyVault: privateEndpointKeyVault.id
} : {}

@description('Environment configuration applied')
output environmentConfig object = currentConfig
