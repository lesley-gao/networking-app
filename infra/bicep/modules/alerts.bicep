// ----------------------------------------------------------------------------------------------------
// Azure Monitor Alerts Module - Comprehensive Application Health Monitoring
// Using Azure Verified Modules (AVM) pattern for Azure Monitor alerts
// ----------------------------------------------------------------------------------------------------

@description('The Azure region where all resources should be deployed.')
param location string

@description('Tags to be applied to all resources.')
param tags object

@description('Resource token used for naming resources.')
param resourceToken string

@description('The environment name for the deployment (dev, test, prod).')
param environmentName string = 'dev'

@description('Application Insights resource ID for alert queries.')
param applicationInsightsId string

@description('SQL Database resource ID for database performance alerts.')
param sqlDatabaseId string

@description('App Service resource ID for application health alerts.')
param appServiceId string

@description('Action Group resource ID for alert notifications.')
param actionGroupId string

@description('Enable or disable alerts for cost management.')
param enableAlerts bool = true

@description('Email address for critical alert notifications.')
param criticalAlertEmail string = 'admin@networkingapp.com'

@description('Application name for alert naming and identification.')
param applicationName string = 'NetworkingApp'

// ----------------------------------------------------------------------------------------------------
// Variables and Environment Configuration
// ----------------------------------------------------------------------------------------------------

// Environment-specific alert thresholds and configurations
var environmentConfig = {
  dev: {
    // Development environment - relaxed thresholds for testing
    responseTimeThreshold: 3000        // 3 seconds
    errorRateThreshold: 10             // 10% error rate
    availabilityThreshold: 95          // 95% availability
    cpuThreshold: 80                   // 80% CPU utilization
    memoryThreshold: 85                // 85% memory utilization
    dtuThreshold: 80                   // 80% DTU utilization
    connectionThreshold: 80            // 80% of max connections
    diskSpaceThreshold: 85             // 85% disk usage
    evaluationFrequency: 'PT15M'       // Check every 15 minutes
    windowSize: 'PT30M'                // 30-minute evaluation window
    severity: 2                        // Warning severity
  }
  test: {
    // Test environment - balanced thresholds for staging validation
    responseTimeThreshold: 2000        // 2 seconds
    errorRateThreshold: 8              // 8% error rate
    availabilityThreshold: 97          // 97% availability
    cpuThreshold: 75                   // 75% CPU utilization
    memoryThreshold: 80                // 80% memory utilization
    dtuThreshold: 75                   // 75% DTU utilization
    connectionThreshold: 75            // 75% of max connections
    diskSpaceThreshold: 80             // 80% disk usage
    evaluationFrequency: 'PT10M'       // Check every 10 minutes
    windowSize: 'PT20M'                // 20-minute evaluation window
    severity: 1                        // Error severity
  }
  prod: {
    // Production environment - strict thresholds for optimal performance
    responseTimeThreshold: 1500        // 1.5 seconds
    errorRateThreshold: 5              // 5% error rate
    availabilityThreshold: 99          // 99% availability
    cpuThreshold: 70                   // 70% CPU utilization
    memoryThreshold: 75                // 75% memory utilization
    dtuThreshold: 70                   // 70% DTU utilization
    connectionThreshold: 70            // 70% of max connections
    diskSpaceThreshold: 75             // 75% disk usage
    evaluationFrequency: 'PT5M'        // Check every 5 minutes
    windowSize: 'PT15M'                // 15-minute evaluation window
    severity: 0                        // Critical severity
  }
}

var config = environmentConfig[environmentName]

// Alert naming convention
var alertNamePrefix = 'alert-${applicationName}-${environmentName}'

// ----------------------------------------------------------------------------------------------------
// Application Health Alerts
// ----------------------------------------------------------------------------------------------------

// High Response Time Alert
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-high-response-time'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when average response time exceeds ${config.responseTimeThreshold}ms'
    severity: config.severity
    enabled: true
    scopes: [
      applicationInsightsId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Insights/components'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.responseTimeThreshold
          name: 'ResponseTime'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// High Error Rate Alert
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-high-error-rate'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when error rate exceeds ${config.errorRateThreshold}%'
    severity: config.severity
    enabled: true
    scopes: [
      applicationInsightsId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Insights/components'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.errorRateThreshold
          name: 'ErrorRate'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// Low Availability Alert
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-low-availability'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when availability drops below ${config.availabilityThreshold}%'
    severity: config.severity
    enabled: true
    scopes: [
      applicationInsightsId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Insights/components'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.availabilityThreshold
          name: 'Availability'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'availabilityResults/availabilityPercentage'
          operator: 'LessThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Application Server Performance Alerts (App Service)
// ----------------------------------------------------------------------------------------------------

// High CPU Utilization Alert
resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-high-cpu-usage'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when CPU usage exceeds ${config.cpuThreshold}%'
    severity: config.severity
    enabled: true
    scopes: [
      appServiceId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Web/sites'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.cpuThreshold
          name: 'CpuPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'CpuPercentage'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// High Memory Utilization Alert
resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-high-memory-usage'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when memory usage exceeds ${config.memoryThreshold}%'
    severity: config.severity
    enabled: true
    scopes: [
      appServiceId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Web/sites'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.memoryThreshold
          name: 'MemoryPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'MemoryPercentage'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Database Performance Alerts (Azure SQL Database)
// ----------------------------------------------------------------------------------------------------

// High DTU Utilization Alert
resource dtuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-high-dtu-usage'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when DTU usage exceeds ${config.dtuThreshold}%'
    severity: config.severity
    enabled: true
    scopes: [
      sqlDatabaseId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Sql/servers/databases'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.dtuThreshold
          name: 'DtuPercentage'
          metricNamespace: 'Microsoft.Sql/servers/databases'
          metricName: 'dtu_consumption_percent'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// High Database Connection Utilization Alert
resource connectionAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-high-db-connections'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when database connections exceed ${config.connectionThreshold}% of limit'
    severity: config.severity
    enabled: true
    scopes: [
      sqlDatabaseId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Sql/servers/databases'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: config.connectionThreshold
          name: 'ConnectionsPercent'
          metricNamespace: 'Microsoft.Sql/servers/databases'
          metricName: 'connection_successful'
          operator: 'GreaterThan'
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// Database Deadlock Alert
resource deadlockAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: '${alertNamePrefix}-database-deadlocks'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when database deadlocks are detected'
    severity: 1 // Error severity for deadlocks
    enabled: true
    scopes: [
      sqlDatabaseId
    ]
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    targetResourceType: 'Microsoft.Sql/servers/databases'
    targetResourceRegion: location
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          threshold: 0
          name: 'Deadlocks'
          metricNamespace: 'Microsoft.Sql/servers/databases'
          metricName: 'deadlock'
          operator: 'GreaterThan'
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ----------------------------------------------------------------------------------------------------
// Log Analytics Alert Rules (KQL-based alerts)
// ----------------------------------------------------------------------------------------------------

// Application Exception Alert
resource exceptionAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (enableAlerts) {
  name: '${alertNamePrefix}-application-exceptions'
  location: location
  tags: tags
  properties: {
    displayName: 'Application Exceptions Alert'
    description: 'Alert when application exceptions exceed threshold'
    severity: config.severity
    enabled: true
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    scopes: [
      applicationInsightsId
    ]
    targetResourceTypes: [
      'Microsoft.Insights/components'
    ]
    criteria: {
      allOf: [
        {
          query: '''
            exceptions
            | where timestamp > ago(15m)
            | where severityLevel >= 3
            | summarize ExceptionCount = count() by bin(timestamp, 5m)
            | where ExceptionCount > 5
          '''
          timeAggregation: 'Count'
          dimensions: []
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroupId
      ]
      customProperties: {}
    }
  }
}

// Failed Authentication Alert
resource authFailureAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (enableAlerts) {
  name: '${alertNamePrefix}-auth-failures'
  location: location
  tags: tags
  properties: {
    displayName: 'Authentication Failures Alert'
    description: 'Alert when authentication failures exceed threshold'
    severity: 1 // Error severity for security-related issues
    enabled: true
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    scopes: [
      applicationInsightsId
    ]
    targetResourceTypes: [
      'Microsoft.Insights/components'
    ]
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where timestamp > ago(15m)
            | where url contains "/api/auth/"
            | where resultCode startswith "4"
            | summarize FailedRequests = count() by bin(timestamp, 5m)
            | where FailedRequests > 10
          '''
          timeAggregation: 'Count'
          dimensions: []
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroupId
      ]
      customProperties: {}
    }
  }
}

// Payment Processing Error Alert
resource paymentErrorAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (enableAlerts) {
  name: '${alertNamePrefix}-payment-errors'
  location: location
  tags: tags
  properties: {
    displayName: 'Payment Processing Errors Alert'
    description: 'Alert when payment processing errors occur'
    severity: 0 // Critical severity for payment issues
    enabled: true
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    scopes: [
      applicationInsightsId
    ]
    targetResourceTypes: [
      'Microsoft.Insights/components'
    ]
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where timestamp > ago(15m)
            | where url contains "/api/payment"
            | where resultCode startswith "5" or resultCode startswith "4"
            | summarize ErrorCount = count() by bin(timestamp, 5m)
            | where ErrorCount > 0
          '''
          timeAggregation: 'Count'
          dimensions: []
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroupId
      ]
      customProperties: {}
    }
  }
}

// Slow Query Alert
resource slowQueryAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (enableAlerts) {
  name: '${alertNamePrefix}-slow-queries'
  location: location
  tags: tags
  properties: {
    displayName: 'Slow Database Queries Alert'
    description: 'Alert when database queries are running slowly'
    severity: config.severity
    enabled: true
    evaluationFrequency: config.evaluationFrequency
    windowSize: config.windowSize
    scopes: [
      applicationInsightsId
    ]
    targetResourceTypes: [
      'Microsoft.Insights/components'
    ]
    criteria: {
      allOf: [
        {
          query: '''
            dependencies
            | where timestamp > ago(15m)
            | where type == "SQL"
            | where duration > 2000
            | summarize SlowQueries = count() by bin(timestamp, 5m)
            | where SlowQueries > 3
          '''
          timeAggregation: 'Count'
          dimensions: []
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroupId
      ]
      customProperties: {}
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Outputs
// ----------------------------------------------------------------------------------------------------

@description('Resource IDs of all created alert rules for reference and management.')
output alertRuleIds array = enableAlerts ? [
  responseTimeAlert.id
  errorRateAlert.id
  availabilityAlert.id
  cpuAlert.id
  memoryAlert.id
  dtuAlert.id
  connectionAlert.id
  deadlockAlert.id
  exceptionAlert.id
  authFailureAlert.id
  paymentErrorAlert.id
  slowQueryAlert.id
] : []

@description('Alert configuration summary for documentation purposes.')
output alertConfiguration object = {
  environment: environmentName
  thresholds: config
  alertCount: enableAlerts ? 12 : 0
  actionGroupId: actionGroupId
}

@description('Environment-specific alert settings applied to this deployment.')
output environmentSettings object = config
