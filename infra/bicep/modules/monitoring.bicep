// ----------------------------------------------------------------------------------------------------
// Monitoring Module - Application Insights and Log Analytics
// Using Azure Verified Modules (AVM) pattern
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where all resources should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object

@description('Resource token used for naming resources.')
param resourceToken string

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var logAnalyticsWorkspaceName = 'log-${resourceToken}'
var applicationInsightsName = 'appi-${resourceToken}'

// ----------------------------------------------------------------------------------------------------
// Log Analytics Workspace
// ----------------------------------------------------------------------------------------------------

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
    workspaceCapping: {
      dailyQuotaGb: 10
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ----------------------------------------------------------------------------------------------------
// Application Insights
// ----------------------------------------------------------------------------------------------------

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaWebAppExtensionCreate'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ----------------------------------------------------------------------------------------------------
// Action Groups for Alerting
// ----------------------------------------------------------------------------------------------------

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'NetApp'
    enabled: true
    emailReceivers: [
      {
        name: 'Admin Email'
        emailAddress: 'admin@networkingapp.com' // Replace with actual admin email
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: []
    webhookReceivers: []
    azureAppPushReceivers: []
    itsmReceivers: []
    azureFunction: []
    azureFunctionReceivers: []
    logicAppReceivers: []
    automationRunbookReceivers: []
    voiceReceivers: []
    armRoleReceivers: []
    azureAppPushReceivers: []
    eventHubReceivers: []
  }
}

// ----------------------------------------------------------------------------------------------------
// Alert Rules
// ----------------------------------------------------------------------------------------------------

// High CPU Alert
resource highCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'High CPU Usage - ${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    severity: 2
    enabled: true
    scopes: [
      '/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}'
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'High CPU'
          metricName: 'CpuPercentage'
          metricNamespace: 'Microsoft.Web/serverfarms'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// High Memory Alert
resource highMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'High Memory Usage - ${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    severity: 2
    enabled: true
    scopes: [
      '/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}'
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'High Memory'
          metricName: 'MemoryPercentage'
          metricNamespace: 'Microsoft.Web/serverfarms'
          operator: 'GreaterThan'
          threshold: 85
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Application Response Time Alert
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'High Response Time - ${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    severity: 3
    enabled: true
    scopes: [
      applicationInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'High Response Time'
          metricName: 'requests/duration'
          metricNamespace: 'Microsoft.Insights/components'
          operator: 'GreaterThan'
          threshold: 5000 // 5 seconds
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Failed Requests Alert
resource failedRequestsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'High Failed Requests - ${resourceToken}'
  location: 'Global'
  tags: tags
  properties: {
    severity: 2
    enabled: true
    scopes: [
      applicationInsights.id
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'High Failed Requests'
          metricName: 'requests/failed'
          metricNamespace: 'Microsoft.Insights/components'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Custom Workbooks for Monitoring
// ----------------------------------------------------------------------------------------------------

resource workbook 'Microsoft.Insights/workbooks@2023-06-01' = {
  name: guid('workbook-${resourceToken}')
  location: location
  tags: tags
  kind: 'shared'
  properties: {
    displayName: 'NetworkingApp Monitoring Dashboard'
    serializedData: '{"version":"Notebook/1.0","items":[{"type":1,"content":{"json":"## NetworkingApp Monitoring Dashboard\\n\\nThis workbook provides key metrics for the Flight Companion & Airport Pickup Platform."},"name":"text - header"},{"type":3,"content":{"version":"KqlItem/1.0","query":"requests\\n| where timestamp > ago(24h)\\n| summarize Count = count() by bin(timestamp, 1h)\\n| render timechart","size":0,"title":"Request Count (24h)","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - requests"},{"type":3,"content":{"version":"KqlItem/1.0","query":"requests\\n| where timestamp > ago(24h)\\n| where success == false\\n| summarize Count = count() by bin(timestamp, 1h)\\n| render timechart","size":0,"title":"Failed Requests (24h)","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - failed requests"}],"isLocked":false,"fallbackResourceIds":["/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}/providers/Microsoft.Insights/components/${applicationInsightsName}"]}'
    category: 'workbook'
    sourceId: applicationInsights.id
  }
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
output logAnalyticsWorkspaceCustomerId string = logAnalyticsWorkspace.properties.customerId

output applicationInsightsName string = applicationInsights.name
output applicationInsightsId string = applicationInsights.id
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString

output actionGroupId string = actionGroup.id
