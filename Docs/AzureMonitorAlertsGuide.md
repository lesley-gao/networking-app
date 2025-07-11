# Azure Monitor Alerts Configuration Guide

## Overview

This document provides comprehensive guidance for configuring and managing Azure Monitor alerts for the Flight Companion & Airport Pickup Platform. The alerting system provides proactive monitoring for application health, database performance, and error rates across development, testing, and production environments.

## Table of Contents

1. [Alert Architecture](#alert-architecture)
2. [Alert Types and Categories](#alert-types-and-categories)
3. [Environment-Specific Configuration](#environment-specific-configuration)
4. [Deployment Guide](#deployment-guide)
5. [Testing and Validation](#testing-and-validation)
6. [Monitoring Dashboard](#monitoring-dashboard)
7. [Alert Management](#alert-management)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Alert Architecture

The Azure Monitor alerts system is built using a modular approach with the following components:

### Core Components

- **Application Insights**: Collects application telemetry and performance data
- **Log Analytics Workspace**: Centralized logging and query engine
- **Metric Alerts**: Real-time monitoring of numerical metrics
- **Log Alerts**: KQL-based queries for complex conditions
- **Action Groups**: Notification and response automation
- **Alert Rules**: Define conditions and thresholds

### Infrastructure Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Application    │    │   Database      │    │  Infrastructure │
│  Insights       │    │   Metrics       │    │  Metrics        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Alert Engine   │
                    │  (Azure Monitor)│
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Action Groups  │
                    │  (Notifications)│
                    └─────────────────┘
```

## Alert Types and Categories

### 1. Application Health Alerts

#### High Response Time Alert
- **Metric**: `requests/duration`
- **Threshold**: Environment-specific (1.5s-3s)
- **Purpose**: Detect performance degradation
- **Action**: Investigate slow endpoints and database queries

#### High Error Rate Alert
- **Metric**: `requests/failed`
- **Threshold**: Environment-specific (5%-10%)
- **Purpose**: Identify application errors and failures
- **Action**: Review error logs and fix critical issues

#### Low Availability Alert
- **Metric**: `availabilityResults/availabilityPercentage`
- **Threshold**: Environment-specific (95%-99%)
- **Purpose**: Monitor overall service availability
- **Action**: Check infrastructure and service dependencies

### 2. Application Server Performance Alerts

#### High CPU Utilization Alert
- **Metric**: `CpuPercentage`
- **Threshold**: Environment-specific (70%-80%)
- **Purpose**: Prevent resource exhaustion
- **Action**: Scale resources or optimize code

#### High Memory Utilization Alert
- **Metric**: `MemoryPercentage`
- **Threshold**: Environment-specific (75%-85%)
- **Purpose**: Prevent memory-related failures
- **Action**: Investigate memory leaks or scale resources

### 3. Database Performance Alerts

#### High DTU Utilization Alert
- **Metric**: `dtu_consumption_percent`
- **Threshold**: Environment-specific (70%-80%)
- **Purpose**: Monitor database resource usage
- **Action**: Optimize queries or scale database tier

#### High Database Connection Alert
- **Metric**: `connection_successful`
- **Threshold**: Environment-specific (70%-80% of limit)
- **Purpose**: Prevent connection pool exhaustion
- **Action**: Review connection management and pooling

#### Database Deadlock Alert
- **Metric**: `deadlock`
- **Threshold**: Any occurrence
- **Purpose**: Identify database concurrency issues
- **Action**: Review and optimize database queries

### 4. Log-Based Alerts (KQL Queries)

#### Application Exception Alert
```kusto
exceptions
| where timestamp > ago(15m)
| where severityLevel >= 3
| summarize ExceptionCount = count() by bin(timestamp, 5m)
| where ExceptionCount > 5
```

#### Authentication Failure Alert
```kusto
requests
| where timestamp > ago(15m)
| where url contains "/api/auth/"
| where resultCode startswith "4"
| summarize FailedRequests = count() by bin(timestamp, 5m)
| where FailedRequests > 10
```

#### Payment Processing Error Alert
```kusto
requests
| where timestamp > ago(15m)
| where url contains "/api/payment"
| where resultCode startswith "5" or resultCode startswith "4"
| summarize ErrorCount = count() by bin(timestamp, 5m)
| where ErrorCount > 0
```

#### Slow Query Alert
```kusto
dependencies
| where timestamp > ago(15m)
| where type == "SQL"
| where duration > 2000
| summarize SlowQueries = count() by bin(timestamp, 5m)
| where SlowQueries > 3
```

## Environment-Specific Configuration

### Development Environment
- **Response Time Threshold**: 3000ms
- **Error Rate Threshold**: 10%
- **Availability Threshold**: 95%
- **Evaluation Frequency**: Every 15 minutes
- **Window Size**: 30 minutes
- **Severity**: Warning (2)

### Test Environment
- **Response Time Threshold**: 2000ms
- **Error Rate Threshold**: 8%
- **Availability Threshold**: 97%
- **Evaluation Frequency**: Every 10 minutes
- **Window Size**: 20 minutes
- **Severity**: Error (1)

### Production Environment
- **Response Time Threshold**: 1500ms
- **Error Rate Threshold**: 5%
- **Availability Threshold**: 99%
- **Evaluation Frequency**: Every 5 minutes
- **Window Size**: 15 minutes
- **Severity**: Critical (0)

## Deployment Guide

### Prerequisites

1. Azure CLI installed and configured
2. PowerShell 5.1 or PowerShell Core 7+
3. Azure PowerShell module
4. Appropriate permissions on target Azure subscription

### Bicep Deployment

1. **Deploy Infrastructure with Alerts**:
```bash
az deployment group create \
  --resource-group "rg-netapp-dev" \
  --template-file "infra/bicep/main.bicep" \
  --parameters "@infra/bicep/parameters/main.dev.json"
```

2. **Verify Deployment**:
```bash
az monitor metrics alert list \
  --resource-group "rg-netapp-dev" \
  --query "[].{Name:name, Enabled:enabled, Severity:severity}"
```

### PowerShell Deployment

1. **Setup Alerts**:
```powershell
.\Scripts\Setup-AzureMonitorAlerts.ps1 \
  -Environment "dev" \
  -ResourceGroupName "rg-netapp-dev" \
  -AlertEmailAddress "dev-alerts@networkingapp.com" \
  -EnableAlerts $true
```

2. **Validate Configuration**:
```powershell
.\Scripts\Test-AzureMonitorAlerts.ps1 \
  -Environment "dev" \
  -ResourceGroupName "rg-netapp-dev" \
  -GenerateReport \
  -ReportPath ".\alert-validation-report.html"
```

## Testing and Validation

### Automated Testing

The `Test-AzureMonitorAlerts.ps1` script provides comprehensive validation:

1. **Configuration Testing**:
   - Verifies alert rules are properly configured
   - Checks action group assignments
   - Validates evaluation frequencies and thresholds

2. **Alert Simulation**:
   - Generates test telemetry data
   - Simulates error conditions
   - Verifies alert triggers

3. **Report Generation**:
   - Creates HTML reports with test results
   - Provides recommendations for improvements
   - Tracks alert history and patterns

### Manual Testing

1. **Test Application Errors**:
```bash
# Generate 500 errors to trigger error rate alert
for i in {1..20}; do
  curl -X POST https://yourapp.azurewebsites.net/api/test/error
done
```

2. **Test High Response Time**:
```bash
# Generate slow requests to trigger response time alert
for i in {1..10}; do
  curl -X GET https://yourapp.azurewebsites.net/api/test/slow
done
```

3. **Test Database Load**:
```sql
-- Generate database load to trigger DTU alert
DECLARE @i INT = 0
WHILE @i < 1000
BEGIN
    SELECT COUNT(*) FROM Users u1 
    CROSS JOIN Users u2 
    CROSS JOIN Users u3
    SET @i = @i + 1
END
```

## Monitoring Dashboard

### Azure Portal Dashboard

1. **Navigate to Azure Monitor** → **Dashboards**
2. **Import Dashboard**: Use the generated dashboard JSON from deployment
3. **Key Widgets**:
   - Alert Summary
   - Active Alerts Timeline
   - Alert Distribution by Severity
   - Top Triggered Alerts

### Custom Workbooks

Access the monitoring workbook via:
1. **Azure Portal** → **Application Insights** → **Workbooks**
2. **NetworkingApp Monitoring Dashboard**

### Key Metrics to Monitor

- **Request Volume**: Total requests per hour
- **Response Time Trends**: P95 response times
- **Error Rate**: Failed requests percentage
- **Availability**: Service uptime percentage
- **Database Performance**: DTU usage and query performance
- **User Activity**: Active users and feature usage

## Alert Management

### Alert States

- **New**: Recently triggered, requires investigation
- **Acknowledged**: Being investigated by team member
- **Closed**: Issue resolved or false positive

### Response Procedures

#### Critical Alerts (Severity 0)
1. **Immediate Response**: Within 15 minutes
2. **Escalation**: Notify on-call engineer
3. **Communication**: Update status page if customer-facing
4. **Resolution**: Fix issue and post-mortem if needed

#### Error Alerts (Severity 1)
1. **Response Time**: Within 1 hour
2. **Investigation**: Identify root cause
3. **Temporary Fix**: Implement workaround if needed
4. **Permanent Fix**: Deploy fix within 24 hours

#### Warning Alerts (Severity 2)
1. **Response Time**: Within 4 hours during business hours
2. **Investigation**: Add to backlog for investigation
3. **Resolution**: Fix during next deployment cycle

### Alert Tuning

Regular review and adjustment of alert thresholds:

1. **Weekly Review**: Check for false positives and negatives
2. **Monthly Analysis**: Review alert patterns and trends
3. **Quarterly Optimization**: Adjust thresholds based on baseline performance

## Troubleshooting

### Common Issues

#### 1. Alerts Not Triggering

**Symptoms**: Expected alerts are not firing
**Causes**:
- Incorrect metric namespace or name
- Threshold too high/low
- Evaluation frequency too long
- Data source not sending metrics

**Solutions**:
```powershell
# Check metric availability
Get-AzMetricDefinition -ResourceId $resourceId

# Verify data ingestion
# Use KQL query in Log Analytics
requests
| where timestamp > ago(1h)
| summarize count()
```

#### 2. Too Many False Positives

**Symptoms**: Alerts firing frequently for non-issues
**Causes**:
- Thresholds too sensitive
- Normal traffic spikes misinterpreted
- Insufficient evaluation window

**Solutions**:
- Adjust thresholds based on baseline performance
- Increase evaluation window size
- Use dynamic thresholds for variable metrics

#### 3. Alert Notification Delays

**Symptoms**: Delays between alert condition and notification
**Causes**:
- Evaluation frequency too low
- Action group configuration issues
- Email delivery delays

**Solutions**:
- Reduce evaluation frequency for critical alerts
- Add multiple notification channels
- Test action group functionality

### Diagnostic Queries

#### Check Alert Rule Status
```kusto
AlertsManagementResources
| where type == "microsoft.alertsmanagement/alerts"
| where properties.essentials.alertRule contains "NetworkingApp"
| project 
    AlertRule = properties.essentials.alertRule,
    Severity = properties.essentials.severity,
    State = properties.essentials.alertState,
    StartTime = properties.essentials.startDateTime
```

#### Analyze Alert Patterns
```kusto
AlertsManagementResources
| where type == "microsoft.alertsmanagement/alerts"
| where properties.essentials.startDateTime > ago(7d)
| summarize AlertCount = count() by 
    AlertRule = properties.essentials.alertRule,
    bin(todatetime(properties.essentials.startDateTime), 1h)
| render timechart
```

## Best Practices

### 1. Alert Design Principles

- **Actionable**: Every alert should have a clear response action
- **Relevant**: Avoid alert fatigue with too many non-critical alerts
- **Timely**: Alert timing should match required response time
- **Contextual**: Include enough information for quick diagnosis

### 2. Threshold Management

- **Baseline First**: Establish performance baselines before setting thresholds
- **Environment-Specific**: Use different thresholds for dev/test/prod
- **Dynamic Adjustment**: Regularly review and adjust based on actual performance
- **Seasonal Considerations**: Account for traffic patterns and business cycles

### 3. Notification Strategy

- **Tiered Notifications**: Different severity levels for different audiences
- **Multiple Channels**: Email, SMS, webhooks for critical alerts
- **Escalation Rules**: Automatic escalation for unacknowledged critical alerts
- **Maintenance Windows**: Suppress alerts during planned maintenance

### 4. Documentation and Training

- **Runbooks**: Document response procedures for each alert type
- **Training**: Ensure team members understand alert meanings and responses
- **Regular Reviews**: Monthly alert effectiveness reviews
- **Continuous Improvement**: Update alerts based on incidents and lessons learned

### 5. Security Considerations

- **Access Control**: Limit alert management permissions
- **Audit Trail**: Log all alert configuration changes
- **Sensitive Data**: Avoid including secrets in alert notifications
- **Compliance**: Ensure alert data retention meets compliance requirements

## Integration with DevOps

### CI/CD Pipeline Integration

1. **Alert as Code**: Store alert configurations in source control
2. **Automated Testing**: Include alert testing in deployment pipeline
3. **Infrastructure Validation**: Verify alert deployment in each environment
4. **Rollback Procedures**: Include alert rollback in deployment rollback

### Monitoring Metrics for DevOps

- **Deployment Success Rate**: Track deployment-related alerts
- **Mean Time to Detection (MTTD)**: How quickly issues are detected
- **Mean Time to Resolution (MTTR)**: How quickly issues are resolved
- **Alert Accuracy**: Ratio of actionable vs false positive alerts

## Conclusion

This comprehensive Azure Monitor alerts system provides robust monitoring capabilities for the Flight Companion Platform. Regular maintenance, testing, and optimization ensure the alerts remain effective and actionable.

For additional support or questions, contact the DevOps team or refer to the Azure Monitor documentation.

---

**Document Version**: 1.0  
**Last Updated**: July 11, 2025  
**Next Review**: August 11, 2025
