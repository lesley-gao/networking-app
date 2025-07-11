// ----------------------------------------------------------------------------------------------------
// Custom Domain & SSL Certificate Module
// TASK-091: Configure custom domain with SSL certificate and Azure App Service authentication
// Using Azure Verified Modules (AVM) pattern
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where all resources should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object

@description('Resource token used for naming resources.')
param resourceToken string

@description('Environment name (dev, test, prod).')
@allowed([
  'dev'
  'test'
  'prod'
])
param environmentName string = 'dev'

@description('Custom domain name for the application (e.g., flightcompanion.example.com)')
param customDomainName string

@description('Root domain for DNS zone (e.g., example.com)')
param rootDomainName string

@description('App Service resource ID')
param appServiceId string

@description('App Service name')
param appServiceName string

@description('App Service default hostname')
param appServiceDefaultHostname string

@description('Enable DNS zone management')
param enableDnsZoneManagement bool = false

@description('Azure AD tenant ID for authentication')
param azureAdTenantId string = ''

@description('Azure AD client ID for authentication')
param azureAdClientId string = ''

@description('Azure AD client secret for authentication')
@secure()
param azureAdClientSecret string = ''

@description('Enable App Service authentication')
param enableAuthentication bool = false

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var certificateName = replace(customDomainName, '.', '-')
var dnsZoneName = rootDomainName
var subdomain = length(customDomainName) > length(rootDomainName) ? 
  replace(customDomainName, '.${rootDomainName}', '') : '@'

// Environment-specific certificate configuration
var certificateConfig = {
  dev: {
    autoRenew: false
    validityInMonths: 12
  }
  test: {
    autoRenew: true
    validityInMonths: 12
  }
  prod: {
    autoRenew: true
    validityInMonths: 24
  }
}

var selectedCertConfig = certificateConfig[environmentName]

// ----------------------------------------------------------------------------------------------------
// DNS Zone (Optional)
// ----------------------------------------------------------------------------------------------------

resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' = if (enableDnsZoneManagement) {
  name: dnsZoneName
  location: 'global'
  tags: tags
  properties: {
    zoneType: 'Public'
  }
}

// CNAME record for custom domain pointing to App Service
resource cnameRecord 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = if (enableDnsZoneManagement && subdomain != '@') {
  parent: dnsZone
  name: subdomain
  properties: {
    TTL: 3600
    CNAMERecord: {
      cname: appServiceDefaultHostname
    }
  }
}

// A record for root domain (if using root domain)
resource aRecord 'Microsoft.Network/dnsZones/A@2018-05-01' = if (enableDnsZoneManagement && subdomain == '@') {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 3600
    ARecords: [
      // Azure App Service IP addresses (these should be obtained from the App Service)
      // Note: In production, you would get these from the App Service properties
    ]
  }
}

// TXT record for domain verification
resource txtRecord 'Microsoft.Network/dnsZones/TXT@2018-05-01' = if (enableDnsZoneManagement) {
  parent: dnsZone
  name: 'asuid.${subdomain == '@' ? '' : subdomain}'
  properties: {
    TTL: 3600
    TXTRecords: [
      {
        value: [
          // This will be populated by the App Service custom domain verification ID
          // The value needs to be obtained from the App Service properties
        ]
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// App Service Managed Certificate
// ----------------------------------------------------------------------------------------------------

resource managedCertificate 'Microsoft.Web/certificates@2022-09-01' = {
  name: 'cert-${certificateName}-${resourceToken}'
  location: location
  tags: tags
  properties: {
    serverFarmId: resourceId('Microsoft.Web/serverfarms', 'asp-${resourceToken}')
    canonicalName: customDomainName
    domainValidationMethod: 'cname-delegation'
    // Use App Service Managed Certificate for automatic SSL
  }
  dependsOn: [
    cnameRecord
    aRecord
  ]
}

// ----------------------------------------------------------------------------------------------------
// Custom Domain Binding
// ----------------------------------------------------------------------------------------------------

resource customDomain 'Microsoft.Web/sites/hostNameBindings@2022-09-01' = {
  name: '${appServiceName}/${customDomainName}'
  properties: {
    siteName: appServiceName
    hostNameType: 'Verified'
    customHostNameDnsRecordType: subdomain == '@' ? 'A' : 'CName'
    sslState: 'SniEnabled'
    thumbprint: managedCertificate.properties.thumbprint
  }
  dependsOn: [
    managedCertificate
  ]
}

// ----------------------------------------------------------------------------------------------------
// App Service Authentication Configuration
// ----------------------------------------------------------------------------------------------------

resource authSettings 'Microsoft.Web/sites/config@2022-09-01' = if (enableAuthentication) {
  name: '${appServiceName}/authsettingsV2'
  properties: {
    globalValidation: {
      requireAuthentication: false
      unauthenticatedClientAction: 'AllowAnonymous'
      redirectToProvider: 'azureActiveDirectory'
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          openIdIssuer: 'https://sts.windows.net/${azureAdTenantId}/'
          clientId: azureAdClientId
          clientSecretSettingName: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
        }
        validation: {
          jwtClaimChecks: {}
          allowedAudiences: [
            azureAdClientId
            'https://${customDomainName}'
            'https://${appServiceDefaultHostname}'
          ]
        }
        isAutoProvisioned: false
      }
    }
    login: {
      routes: {
        logoutEndpoint: '/logout'
      }
      tokenStore: {
        enabled: true
        tokenRefreshExtensionHours: 72.0
        fileSystem: {
          directory: '/home/data/tokens'
        }
      }
      preserveUrlFragmentsForLogins: false
      allowedExternalRedirectUrls: [
        'https://${customDomainName}'
        'https://${customDomainName}/'
      ]
      cookieExpiration: {
        convention: 'FixedTime'
        timeToExpiration: '08:00:00'
      }
      nonce: {
        validateNonce: true
        nonceExpirationInterval: '00:05:00'
      }
    }
    httpSettings: {
      requireHttps: true
      routes: {
        apiPrefix: '/.auth'
      }
      forwardProxy: {
        convention: 'NoProxy'
      }
    }
    platform: {
      enabled: true
      runtimeVersion: '~1'
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// App Service Configuration Updates for Custom Domain
// ----------------------------------------------------------------------------------------------------

resource appServiceConfig 'Microsoft.Web/sites/config@2022-09-01' = {
  name: '${appServiceName}/web'
  properties: {
    httpsOnly: true
    minTlsVersion: '1.2'
    scmMinTlsVersion: '1.2'
    ftpsState: 'FtpsOnly'
    http20Enabled: true
    remoteDebuggingEnabled: false
    use32BitWorkerProcess: false
    webSocketsEnabled: true
    alwaysOn: environmentName == 'prod'
    // Custom domain specific settings
    ipSecurityRestrictions: [
      {
        ipAddress: '0.0.0.0/0'
        action: 'Allow'
        priority: 100
        name: 'Allow all'
        description: 'Allow all traffic - customize based on security requirements'
      }
    ]
    scmIpSecurityRestrictions: [
      {
        ipAddress: '0.0.0.0/0'
        action: 'Allow'
        priority: 100
        name: 'Allow all SCM'
        description: 'Allow all SCM traffic - customize based on security requirements'
      }
    ]
    scmIpSecurityRestrictionsUseMain: false
    // HSTS settings for enhanced security
    httpHeaders: {
      'X-Content-Type-Options': 'nosniff'
      'X-Frame-Options': 'DENY'
      'X-XSS-Protection': '1; mode=block'
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com"
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Application Settings for Authentication
// ----------------------------------------------------------------------------------------------------

resource authAppSettings 'Microsoft.Web/sites/config@2022-09-01' = if (enableAuthentication) {
  name: '${appServiceName}/appsettings'
  properties: {
    MICROSOFT_PROVIDER_AUTHENTICATION_SECRET: azureAdClientSecret
    WEBSITE_AUTH_ENABLED: 'true'
    WEBSITE_AUTH_AUTO_AAD: 'true'
    WEBSITE_AUTH_CLIENT_ID: azureAdClientId
    WEBSITE_AUTH_TENANT_ID: azureAdTenantId
    WEBSITE_AUTH_LOGOUT_PATH: '/logout'
    WEBSITE_AUTH_DEFAULT_PROVIDER: 'AzureActiveDirectory'
    // Custom domain URLs
    WEBSITE_HOSTNAME: customDomainName
    WEBSITE_SITE_NAME: appServiceName
    // CORS settings for custom domain
    WEBSITE_CORS_ALLOWED_ORIGINS: 'https://${customDomainName}'
    WEBSITE_CORS_SUPPORT_CREDENTIALS: 'true'
  }
  dependsOn: [
    customDomain
    authSettings
  ]
}

// ----------------------------------------------------------------------------------------------------
// Health Check Configuration
// ----------------------------------------------------------------------------------------------------

resource healthCheckConfig 'Microsoft.Web/sites/config@2022-09-01' = {
  name: '${appServiceName}/web'
  properties: {
    healthCheckPath: '/health'
    // Custom domain health check
    customDomainVerificationId: managedCertificate.properties.subjectName
  }
  dependsOn: [
    customDomain
  ]
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

@description('Custom domain name configured')
output customDomainName string = customDomainName

@description('DNS zone name (if managed)')
output dnsZoneName string = enableDnsZoneManagement ? dnsZone.name : ''

@description('DNS zone name servers (if managed)')
output dnsZoneNameServers array = enableDnsZoneManagement ? dnsZone.properties.nameServers : []

@description('SSL certificate thumbprint')
output certificateThumbprint string = managedCertificate.properties.thumbprint

@description('SSL certificate expiration date')
output certificateExpirationDate string = managedCertificate.properties.expirationDate

@description('Custom domain URL')
output customDomainUrl string = 'https://${customDomainName}'

@description('Authentication enabled status')
output authenticationEnabled bool = enableAuthentication

@description('Domain verification ID')
output domainVerificationId string = managedCertificate.properties.subjectName

@description('SSL configuration status')
output sslConfigured bool = true

@description('HTTPS redirect enabled')
output httpsRedirectEnabled bool = true

// Domain validation information for manual DNS setup
@description('DNS validation records needed (if not using managed DNS)')
output dnsValidationRecords object = {
  cname: {
    name: subdomain == '@' ? 'www' : subdomain
    value: appServiceDefaultHostname
    description: 'CNAME record for domain validation'
  }
  txt: {
    name: 'asuid.${subdomain == '@' ? '' : subdomain}'
    value: managedCertificate.properties.subjectName
    description: 'TXT record for App Service domain verification'
  }
  a: subdomain == '@' ? {
    name: '@'
    description: 'A record for root domain (requires App Service IP addresses)'
    note: 'Contact Azure support for current App Service IP addresses'
  } : null
}

// Security configuration summary
@description('Security configuration applied')
output securityConfiguration object = {
  httpsOnly: true
  tlsVersion: '1.2'
  hstsEnabled: true
  xssProtection: true
  contentTypeOptions: true
  frameOptions: 'DENY'
  cspEnabled: true
  authenticationEnabled: enableAuthentication
}
