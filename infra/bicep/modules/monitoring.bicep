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

@description('The environment name for the deployment (dev, test, prod).')
param environmentName string = 'dev'

@description('Email address for alert notifications.')
param alertEmailAddress string = 'admin@wingcompanion.com'

@description('Application Insights sampling percentage (0-100).')
param samplingPercentage int = 100

@description('Log Analytics workspace retention in days.')
param logRetentionDays int = 30

@description('Daily data cap for Log Analytics workspace in GB.')
param dailyQuotaGb int = 10

// ----------------------------------------------------------------------------------------------------
// Variables
// ----------------------------------------------------------------------------------------------------

var logAnalyticsWorkspaceName = 'log-${resourceToken}'
var applicationInsightsName = 'appi-${resourceToken}'
var actionGroupName = 'ag-${resourceToken}'
var smartDetectorName = 'sd-${resourceToken}'

// Environment-specific configurations
var environmentConfig = {
  dev: {
    logRetentionDays: 7
    dailyQuotaGb: 5
    samplingPercentage: 50
    alertFrequency: 'PT15M'
    alertWindowSize: 'PT30M'
  }
  test: {
    logRetentionDays: 30
    dailyQuotaGb: 10
    samplingPercentage: 100
    alertFrequency: 'PT10M'
    alertWindowSize: 'PT15M'
  }
  prod: {
    logRetentionDays: 90
    dailyQuotaGb: 50
    samplingPercentage: 100
    alertFrequency: 'PT5M'
    alertWindowSize: 'PT10M'
  }
}

var config = environmentConfig[environmentName]

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
    retentionInDays: logRetentionDays != 0 ? logRetentionDays : config.logRetentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
      clusterResourceId: null
    }
    workspaceCapping: {
      dailyQuotaGb: dailyQuotaGb != 0 ? dailyQuotaGb : config.dailyQuotaGb
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
    SamplingPercentage: samplingPercentage != 0 ? samplingPercentage : config.samplingPercentage
    RetentionInDays: logRetentionDays != 0 ? logRetentionDays : config.logRetentionDays
    DisableIpMasking: false
    DisableLocalAuth: false
  }
}

// ----------------------------------------------------------------------------------------------------
// Action Groups for Alerting
// ----------------------------------------------------------------------------------------------------

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'Global'
  tags: tags
  properties: {
    groupShortName: 'NetApp'
    enabled: true
    emailReceivers: [
      {
        name: 'Admin Email'
        emailAddress: alertEmailAddress
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
    eventHubReceivers: []
  }
}

// ----------------------------------------------------------------------------------------------------
// Smart Detection Rules
// ----------------------------------------------------------------------------------------------------

resource smartDetectorAnomalyRule 'Microsoft.AlertsManagement/smartDetectorAlertRules@2021-04-01' = {
  name: 'Failure Anomalies - ${applicationInsightsName}'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Failure anomaly detection rule for NetworkingApp'
    state: 'Enabled'
    severity: 'Sev2'
    frequency: 'PT1M'
    detector: {
      id: 'FailureAnomaliesDetector'
    }
    scope: [
      applicationInsights.id
    ]
    actionGroups: {
      groupIds: [
        actionGroup.id
      ]
    }
  }
}

resource smartDetectorPerformanceRule 'Microsoft.AlertsManagement/smartDetectorAlertRules@2021-04-01' = {
  name: 'Performance Anomalies - ${applicationInsightsName}'
  location: 'Global'
  tags: tags
  properties: {
    description: 'Performance anomaly detection rule for NetworkingApp'
    state: 'Enabled'
    severity: 'Sev3'
    frequency: 'PT1M'
    detector: {
      id: 'RequestPerformanceDegradationDetector'
    }
    scope: [
      applicationInsights.id
    ]
    actionGroups: {
      groupIds: [
        actionGroup.id
      ]
    }
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
    evaluationFrequency: config.alertFrequency
    windowSize: config.alertWindowSize
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
// Application-Specific Alerts
// ----------------------------------------------------------------------------------------------------

// Database Connection Failures Alert
resource databaseConnectionAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'Database Connection Failures - ${resourceToken}'
  location: location
  tags: tags
  properties: {
    displayName: 'Database Connection Failures'
    description: 'Alert when database connection failures exceed threshold'
    severity: 1
    enabled: true
    evaluationFrequency: config.alertFrequency
    windowSize: config.alertWindowSize
    scopes: [
      applicationInsights.id
    ]
    criteria: {
      allOf: [
        {
          query: 'dependencies | where type == "SQL" and success == false | summarize count() by bin(timestamp, 5m)'
          timeAggregation: 'Total'
          threshold: 5
          operator: 'GreaterThan'
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

// Payment Processing Failures Alert
resource paymentFailuresAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'Payment Processing Failures - ${resourceToken}'
  location: location
  tags: tags
  properties: {
    displayName: 'Payment Processing Failures'
    description: 'Alert when payment processing failures exceed threshold'
    severity: 1
    enabled: true
    evaluationFrequency: config.alertFrequency
    windowSize: config.alertWindowSize
    scopes: [
      applicationInsights.id
    ]
    criteria: {
      allOf: [
        {
          query: 'customEvents | where name == "PaymentProcessed" and customDimensions.Status == "Failed" | summarize count() by bin(timestamp, 15m)'
          timeAggregation: 'Total'
          threshold: 3
          operator: 'GreaterThan'
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

// User Authentication Failures Alert
resource authFailuresAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'Authentication Failures - ${resourceToken}'
  location: location
  tags: tags
  properties: {
    displayName: 'High Authentication Failures'
    description: 'Alert when authentication failures suggest potential security issues'
    severity: 2
    enabled: true
    evaluationFrequency: config.alertFrequency
    windowSize: config.alertWindowSize
    scopes: [
      applicationInsights.id
    ]
    criteria: {
      allOf: [
        {
          query: 'requests | where url contains "/api/auth/" and resultCode startswith "4" | summarize count() by bin(timestamp, 10m)'
          timeAggregation: 'Total'
          threshold: 20
          operator: 'GreaterThan'
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

// Low User Activity Alert (Business Metric)
resource lowUserActivityAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'Low User Activity - ${resourceToken}'
  location: location
  tags: tags
  properties: {
    displayName: 'Low User Activity'
    description: 'Alert when daily active users drop below threshold'
    severity: 3
    enabled: environmentName == 'prod' // Only enable in production
    evaluationFrequency: 'PT1H'
    windowSize: 'PT24H'
    scopes: [
      applicationInsights.id
    ]
    criteria: {
      allOf: [
        {
          query: 'customEvents | where name in ("FlightCompanionRequestCreated", "PickupRequestCreated", "UserRegistered") | summarize dcount(tostring(customDimensions.UserId))'
          timeAggregation: 'Total'
          threshold: 10
          operator: 'LessThan'
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
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
    serializedData: '{"version":"Notebook/1.0","items":[{"type":1,"content":{"json":"# NetworkingApp Monitoring Dashboard\\n\\nComprehensive monitoring for the Flight Companion & Airport Pickup Platform.\\n\\n## Key Metrics\\n- Request volume and response times\\n- User activity and engagement\\n- Payment processing status\\n- System health and errors"},"name":"text - header"},{"type":9,"content":{"version":"KqlParameterItem/1.0","parameters":[{"id":"timeRange","version":"KqlParameterItem/1.0","name":"TimeRange","type":4,"isRequired":true,"value":{"durationMs":86400000},"typeSettings":{"selectableValues":[{"durationMs":3600000},{"durationMs":14400000},{"durationMs":43200000},{"durationMs":86400000},{"durationMs":172800000},{"durationMs":259200000},{"durationMs":604800000}],"allowCustom":true}}]},"name":"parameters"},{"type":3,"content":{"version":"KqlItem/1.0","query":"requests\\n| where timestamp {TimeRange}\\n| summarize RequestCount = count(), AvgDuration = avg(duration), P95Duration = percentile(duration, 95) by bin(timestamp, 1h)\\n| render timechart","size":0,"title":"Request Volume and Performance","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - requests"},{"type":3,"content":{"version":"KqlItem/1.0","query":"requests\\n| where timestamp {TimeRange}\\n| where success == false\\n| summarize FailedRequests = count() by bin(timestamp, 1h), resultCode\\n| render timechart","size":0,"title":"Failed Requests by Response Code","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - failed requests"},{"type":3,"content":{"version":"KqlItem/1.0","query":"customEvents\\n| where timestamp {TimeRange}\\n| where name in (\\"FlightCompanionRequestCreated\\", \\"PickupRequestCreated\\", \\"UserRegistered\\", \\"MatchConfirmed\\")\\n| summarize EventCount = count() by name, bin(timestamp, 1h)\\n| render timechart","size":0,"title":"Business Events","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - business events"},{"type":3,"content":{"version":"KqlItem/1.0","query":"customEvents\\n| where timestamp {TimeRange}\\n| where name == \\"PaymentProcessed\\"\\n| extend Status = tostring(customDimensions.Status), Amount = todouble(customMeasurements.Amount)\\n| summarize PaymentCount = count(), TotalAmount = sum(Amount) by Status, bin(timestamp, 4h)\\n| render columnchart","size":0,"title":"Payment Processing","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - payments"},{"type":3,"content":{"version":"KqlItem/1.0","query":"dependencies\\n| where timestamp {TimeRange}\\n| summarize DependencyCount = count(), AvgDuration = avg(duration), SuccessRate = avg(todouble(success)) * 100 by type, bin(timestamp, 1h)\\n| render timechart","size":0,"title":"Dependency Performance","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - dependencies"},{"type":3,"content":{"version":"KqlItem/1.0","query":"exceptions\\n| where timestamp {TimeRange}\\n| summarize ExceptionCount = count() by type, bin(timestamp, 1h)\\n| render timechart","size":0,"title":"Exceptions Over Time","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - exceptions"},{"type":3,"content":{"version":"KqlItem/1.0","query":"customEvents\\n| where timestamp {TimeRange}\\n| where name == \\"UserRegistered\\"\\n| summarize DailyActiveUsers = dcount(tostring(customDimensions.UserId)) by bin(timestamp, 1d)\\n| render timechart","size":0,"title":"Daily Active Users","queryType":0,"resourceType":"microsoft.insights/components"},"name":"query - daily users"}],"isLocked":false,"fallbackResourceIds":["${applicationInsights.id}"]}'
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
