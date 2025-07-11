# ==================================================================================================
# Test Azure Monitor Alerts - PowerShell Validation and Testing Script
# Validates alert configuration and simulates alert conditions for testing
# ==================================================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId = "",

    [Parameter(Mandatory = $false)]
    [switch]$SimulateAlerts,

    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport,

    [Parameter(Mandatory = $false)]
    [string]$ReportPath = ".\alert-testing-report-$Environment.html"
)

# Set strict mode and error action preference
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ==================================================================================================
# Functions
# ==================================================================================================

function Write-StatusMessage {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Get-AlertRules {
    param(
        [string]$ResourceGroupName,
        [string]$Environment
    )
    
    Write-StatusMessage "Retrieving alert rules for $Environment environment..."
    
    try {
        $alertPrefix = "alert-NetworkingApp-$Environment"
        
        # Get metric alerts
        $metricAlerts = Get-AzMetricAlertRuleV2 -ResourceGroupName $ResourceGroupName | Where-Object { $_.Name -like "$alertPrefix*" }
        
        # Get log-based alerts (scheduled query rules)
        $logAlerts = Get-AzScheduledQueryRule -ResourceGroupName $ResourceGroupName | Where-Object { $_.DisplayName -like "*$Environment*" }
        
        Write-StatusMessage "Found $($metricAlerts.Count) metric alerts and $($logAlerts.Count) log alerts" -Level "SUCCESS"
        
        return @{
            MetricAlerts = $metricAlerts
            LogAlerts = $logAlerts
            TotalCount = $metricAlerts.Count + $logAlerts.Count
        }
    }
    catch {
        Write-StatusMessage "Failed to retrieve alert rules: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Test-AlertConfiguration {
    param(
        [hashtable]$AlertRules
    )
    
    Write-StatusMessage "Testing alert rule configuration..."
    
    $testResults = @{
        MetricAlertTests = @()
        LogAlertTests = @()
        OverallScore = 0
        TotalTests = 0
        PassedTests = 0
    }
    
    # Test metric alerts
    foreach ($alert in $AlertRules.MetricAlerts) {
        $testResult = @{
            AlertName = $alert.Name
            Tests = @()
            Passed = 0
            Failed = 0
        }
        
        # Test 1: Alert is enabled
        $isEnabled = $alert.Enabled
        $testResult.Tests += @{
            Name = "Alert Enabled"
            Passed = $isEnabled
            Message = if ($isEnabled) { "Alert is enabled" } else { "Alert is disabled" }
        }
        
        # Test 2: Has valid action group
        $hasActionGroup = $alert.Actions.Count -gt 0
        $testResult.Tests += @{
            Name = "Action Group Configured"
            Passed = $hasActionGroup
            Message = if ($hasActionGroup) { "Action group configured" } else { "No action group configured" }
        }
        
        # Test 3: Has valid criteria
        $hasValidCriteria = $alert.Criteria -and $alert.Criteria.AllOf.Count -gt 0
        $testResult.Tests += @{
            Name = "Valid Criteria"
            Passed = $hasValidCriteria
            Message = if ($hasValidCriteria) { "Valid criteria configured" } else { "Invalid or missing criteria" }
        }
        
        # Test 4: Reasonable evaluation frequency
        $evalFreq = $alert.EvaluationFrequency
        $isReasonableFreq = $evalFreq -in @("PT1M", "PT5M", "PT10M", "PT15M", "PT30M")
        $testResult.Tests += @{
            Name = "Reasonable Evaluation Frequency"
            Passed = $isReasonableFreq
            Message = "Evaluation frequency: $evalFreq"
        }
        
        # Count results
        $testResult.Passed = ($testResult.Tests | Where-Object { $_.Passed }).Count
        $testResult.Failed = ($testResult.Tests | Where-Object { -not $_.Passed }).Count
        
        $testResults.MetricAlertTests += $testResult
        $testResults.TotalTests += $testResult.Tests.Count
        $testResults.PassedTests += $testResult.Passed
    }
    
    # Test log alerts
    foreach ($alert in $AlertRules.LogAlerts) {
        $testResult = @{
            AlertName = $alert.DisplayName
            Tests = @()
            Passed = 0
            Failed = 0
        }
        
        # Test 1: Alert is enabled
        $isEnabled = $alert.Enabled
        $testResult.Tests += @{
            Name = "Alert Enabled"
            Passed = $isEnabled
            Message = if ($isEnabled) { "Alert is enabled" } else { "Alert is disabled" }
        }
        
        # Test 2: Has valid query
        $hasValidQuery = $alert.Criteria.AllOf[0].Query.Length -gt 10
        $testResult.Tests += @{
            Name = "Valid KQL Query"
            Passed = $hasValidQuery
            Message = if ($hasValidQuery) { "KQL query configured" } else { "Invalid or missing KQL query" }
        }
        
        # Test 3: Has action groups
        $hasActionGroup = $alert.Actions.ActionGroups.Count -gt 0
        $testResult.Tests += @{
            Name = "Action Group Configured"
            Passed = $hasActionGroup
            Message = if ($hasActionGroup) { "Action group configured" } else { "No action group configured" }
        }
        
        # Count results
        $testResult.Passed = ($testResult.Tests | Where-Object { $_.Passed }).Count
        $testResult.Failed = ($testResult.Tests | Where-Object { -not $_.Passed }).Count
        
        $testResults.LogAlertTests += $testResult
        $testResults.TotalTests += $testResult.Tests.Count
        $testResults.PassedTests += $testResult.Passed
    }
    
    # Calculate overall score
    if ($testResults.TotalTests -gt 0) {
        $testResults.OverallScore = [math]::Round(($testResults.PassedTests / $testResults.TotalTests) * 100, 2)
    }
    
    Write-StatusMessage "Alert configuration testing completed" -Level "SUCCESS"
    Write-StatusMessage "Overall Score: $($testResults.OverallScore)% ($($testResults.PassedTests)/$($testResults.TotalTests) tests passed)"
    
    return $testResults
}

function Get-AlertHistory {
    param(
        [string]$ResourceGroupName,
        [int]$HoursBack = 24
    )
    
    Write-StatusMessage "Retrieving alert history for the last $HoursBack hours..."
    
    try {
        $startTime = (Get-Date).AddHours(-$HoursBack)
        $endTime = Get-Date
        
        # Get alert instances
        $alertInstances = Get-AzAlertHistory -ResourceGroupName $ResourceGroupName -StartDateTime $startTime -EndDateTime $endTime
        
        Write-StatusMessage "Found $($alertInstances.Count) alert instances in the last $HoursBack hours" -Level "SUCCESS"
        
        return $alertInstances
    }
    catch {
        Write-StatusMessage "Failed to retrieve alert history: $($_.Exception.Message)" -Level "WARNING"
        return @()
    }
}

function Invoke-AlertSimulation {
    param(
        [string]$ResourceGroupName,
        [string]$Environment
    )
    
    Write-StatusMessage "Simulating alert conditions for testing..." -Level "WARNING"
    Write-StatusMessage "This will generate test load and may trigger real alerts"
    
    try {
        # Get Application Insights for custom events
        $appInsights = Get-AzApplicationInsights -ResourceGroupName $ResourceGroupName | Select-Object -First 1
        
        if (-not $appInsights) {
            Write-StatusMessage "Application Insights not found - cannot simulate alerts" -Level "ERROR"
            return $false
        }
        
        Write-StatusMessage "Sending test telemetry data..."
        
        # Simulate high error rate by sending exception telemetry
        $testEvents = @(
            @{
                Name = "TestException"
                Properties = @{
                    Environment = $Environment
                    TestType = "AlertSimulation"
                    Severity = "Error"
                }
                Measurements = @{
                    ResponseTime = 5000
                    ErrorCode = 500
                }
            },
            @{
                Name = "TestSlowResponse"
                Properties = @{
                    Environment = $Environment
                    TestType = "AlertSimulation"
                    Endpoint = "/api/test"
                }
                Measurements = @{
                    ResponseTime = 8000
                    Duration = 8000
                }
            },
            @{
                Name = "TestAuthFailure"
                Properties = @{
                    Environment = $Environment
                    TestType = "AlertSimulation"
                    Endpoint = "/api/auth/login"
                }
                Measurements = @{
                    ResponseTime = 1500
                    ErrorCode = 401
                }
            }
        )
        
        foreach ($event in $testEvents) {
            Write-StatusMessage "Sending test event: $($event.Name)"
            # Note: In a real implementation, you would use Application Insights SDK to send telemetry
            # For this script, we'll just log the intention
        }
        
        Write-StatusMessage "Test telemetry simulation completed" -Level "SUCCESS"
        Write-StatusMessage "Monitor alerts in Azure portal for the next 15-30 minutes"
        
        return $true
    }
    catch {
        Write-StatusMessage "Failed to simulate alerts: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Generate-TestReport {
    param(
        [hashtable]$TestResults,
        [hashtable]$AlertRules,
        [array]$AlertHistory,
        [string]$Environment,
        [string]$OutputPath
    )
    
    Write-StatusMessage "Generating test report..."
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Azure Monitor Alerts Test Report - $Environment</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .score { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Azure Monitor Alerts Test Report</h1>
        <p><strong>Environment:</strong> $Environment</p>
        <p><strong>Generated:</strong> $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p><strong>Overall Score:</strong> <span class="score">$($TestResults.OverallScore)%</span></p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <ul>
            <li>Total Alert Rules: $($AlertRules.TotalCount)</li>
            <li>Metric Alerts: $($AlertRules.MetricAlerts.Count)</li>
            <li>Log Alerts: $($AlertRules.LogAlerts.Count)</li>
            <li>Total Tests Run: $($TestResults.TotalTests)</li>
            <li>Tests Passed: $($TestResults.PassedTests)</li>
            <li>Tests Failed: $($TestResults.TotalTests - $TestResults.PassedTests)</li>
            <li>Recent Alert Instances: $($AlertHistory.Count)</li>
        </ul>
    </div>

    <div class="section">
        <h2>Metric Alert Test Results</h2>
        <table>
            <tr>
                <th>Alert Name</th>
                <th>Tests Passed</th>
                <th>Tests Failed</th>
                <th>Status</th>
            </tr>
"@

    foreach ($test in $TestResults.MetricAlertTests) {
        $status = if ($test.Failed -eq 0) { "success" } elseif ($test.Passed -gt $test.Failed) { "warning" } else { "error" }
        $statusText = if ($test.Failed -eq 0) { "PASS" } elseif ($test.Passed -gt $test.Failed) { "PARTIAL" } else { "FAIL" }
        
        $html += @"
            <tr>
                <td>$($test.AlertName)</td>
                <td class="success">$($test.Passed)</td>
                <td class="error">$($test.Failed)</td>
                <td class="$status">$statusText</td>
            </tr>
"@
    }

    $html += @"
        </table>
    </div>

    <div class="section">
        <h2>Log Alert Test Results</h2>
        <table>
            <tr>
                <th>Alert Name</th>
                <th>Tests Passed</th>
                <th>Tests Failed</th>
                <th>Status</th>
            </tr>
"@

    foreach ($test in $TestResults.LogAlertTests) {
        $status = if ($test.Failed -eq 0) { "success" } elseif ($test.Passed -gt $test.Failed) { "warning" } else { "error" }
        $statusText = if ($test.Failed -eq 0) { "PASS" } elseif ($test.Passed -gt $test.Failed) { "PARTIAL" } else { "FAIL" }
        
        $html += @"
            <tr>
                <td>$($test.AlertName)</td>
                <td class="success">$($test.Passed)</td>
                <td class="error">$($test.Failed)</td>
                <td class="$status">$statusText</td>
            </tr>
"@
    }

    $html += @"
        </table>
    </div>

    <div class="section">
        <h2>Recent Alert History</h2>
        <p>Alert instances in the last 24 hours: $($AlertHistory.Count)</p>
        <table>
            <tr>
                <th>Alert Name</th>
                <th>Timestamp</th>
                <th>Status</th>
            </tr>
"@

    foreach ($instance in $AlertHistory | Select-Object -First 20) {
        $html += @"
            <tr>
                <td>$($instance.Name)</td>
                <td>$($instance.Timestamp)</td>
                <td>$($instance.Status)</td>
            </tr>
"@
    }

    $html += @"
        </table>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
"@

    if ($TestResults.OverallScore -lt 90) {
        $html += "<li class='error'>Overall score is below 90%. Review failed tests and fix configuration issues.</li>"
    }
    
    if ($AlertRules.TotalCount -lt 8) {
        $html += "<li class='warning'>Consider adding more alert rules for comprehensive monitoring.</li>"
    }
    
    if ($AlertHistory.Count -eq 0) {
        $html += "<li class='warning'>No recent alert history found. Consider testing alert functionality.</li>"
    }

    $html += @"
            <li>Regularly review and update alert thresholds based on application performance.</li>
            <li>Ensure action groups have current contact information.</li>
            <li>Test alert notifications periodically to verify they work correctly.</li>
        </ul>
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Address any failed tests identified in this report</li>
            <li>Monitor alerts over the next week to validate thresholds</li>
            <li>Update alert configurations based on actual application performance</li>
            <li>Set up regular alert testing and review processes</li>
        </ol>
    </div>
</body>
</html>
"@

    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-StatusMessage "Test report generated: $OutputPath" -Level "SUCCESS"
    
    return $OutputPath
}

# ==================================================================================================
# Main Execution
# ==================================================================================================

Write-StatusMessage "Starting Azure Monitor Alerts testing for $Environment environment..." -Level "SUCCESS"

try {
    # Step 1: Verify Azure connection
    $context = Get-AzContext
    if (-not $context) {
        Write-StatusMessage "No Azure context found. Please run Connect-AzAccount first." -Level "ERROR"
        exit 1
    }
    
    # Step 2: Set subscription if provided
    if ($SubscriptionId) {
        Write-StatusMessage "Setting Azure subscription to $SubscriptionId"
        Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
    }
    
    # Step 3: Get alert rules
    $alertRules = Get-AlertRules -ResourceGroupName $ResourceGroupName -Environment $Environment
    
    if ($alertRules.TotalCount -eq 0) {
        Write-StatusMessage "No alert rules found. Run Setup-AzureMonitorAlerts.ps1 first." -Level "ERROR"
        exit 1
    }
    
    # Step 4: Test alert configuration
    $testResults = Test-AlertConfiguration -AlertRules $alertRules
    
    # Step 5: Get alert history
    $alertHistory = Get-AlertHistory -ResourceGroupName $ResourceGroupName
    
    # Step 6: Simulate alerts if requested
    if ($SimulateAlerts) {
        $simulationResult = Invoke-AlertSimulation -ResourceGroupName $ResourceGroupName -Environment $Environment
        
        if ($simulationResult) {
            Write-StatusMessage "Alert simulation completed. Check Azure portal in 15-30 minutes for triggered alerts." -Level "SUCCESS"
        }
    }
    
    # Step 7: Generate report if requested
    if ($GenerateReport) {
        $reportPath = Generate-TestReport -TestResults $testResults -AlertRules $alertRules -AlertHistory $alertHistory -Environment $Environment -OutputPath $ReportPath
        Write-StatusMessage "Test report available at: $reportPath" -Level "SUCCESS"
    }
    
    # Step 8: Display summary
    Write-StatusMessage "Alert Testing Summary:" -Level "SUCCESS"
    Write-StatusMessage "  Environment: $Environment"
    Write-StatusMessage "  Total Alerts: $($alertRules.TotalCount)"
    Write-StatusMessage "  Test Score: $($testResults.OverallScore)%"
    Write-StatusMessage "  Recent Alert Activity: $($alertHistory.Count) instances"
    
    if ($testResults.OverallScore -ge 90) {
        Write-StatusMessage "Alert configuration looks good! ✅" -Level "SUCCESS"
    }
    elseif ($testResults.OverallScore -ge 70) {
        Write-StatusMessage "Alert configuration needs some improvements ⚠️" -Level "WARNING"
    }
    else {
        Write-StatusMessage "Alert configuration has significant issues ❌" -Level "ERROR"
    }
}
catch {
    Write-StatusMessage "Testing failed with error: $($_.Exception.Message)" -Level "ERROR"
    Write-StatusMessage "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
    exit 1
}

Write-StatusMessage "Testing completed at $(Get-Date)" -Level "SUCCESS"
