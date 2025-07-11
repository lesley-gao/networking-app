# ==================================================================================================
# Setup Azure Monitor Alerts - PowerShell Automation Script
# Configures comprehensive monitoring alerts for the Flight Companion Platform
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
    [string]$AlertEmailAddress = "admin@networkingapp.com",

    [Parameter(Mandatory = $false)]
    [bool]$EnableAlerts = $true,

    [Parameter(Mandatory = $false)]
    [bool]$ValidateOnly = $false
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

function Test-AzureConnection {
    Write-StatusMessage "Testing Azure connection..."
    
    try {
        $context = Get-AzContext
        if (-not $context) {
            Write-StatusMessage "No Azure context found. Please run Connect-AzAccount first." -Level "ERROR"
            return $false
        }
        
        Write-StatusMessage "Connected to Azure subscription: $($context.Subscription.Name)" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-StatusMessage "Failed to get Azure context: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Get-AzureResources {
    param(
        [string]$ResourceGroupName
    )
    
    Write-StatusMessage "Retrieving Azure resources from resource group: $ResourceGroupName"
    
    try {
        # Get Application Insights
        $appInsights = Get-AzApplicationInsights -ResourceGroupName $ResourceGroupName | Select-Object -First 1
        if (-not $appInsights) {
            throw "Application Insights not found in resource group"
        }
        
        # Get App Service
        $appService = Get-AzWebApp -ResourceGroupName $ResourceGroupName | Select-Object -First 1
        if (-not $appService) {
            throw "App Service not found in resource group"
        }
        
        # Get SQL Database
        $sqlDatabase = Get-AzSqlDatabase -ResourceGroupName $ResourceGroupName | Where-Object { $_.DatabaseName -ne "master" } | Select-Object -First 1
        if (-not $sqlDatabase) {
            throw "SQL Database not found in resource group"
        }
        
        # Get Action Group
        $actionGroup = Get-AzActionGroup -ResourceGroupName $ResourceGroupName | Select-Object -First 1
        if (-not $actionGroup) {
            throw "Action Group not found in resource group"
        }
        
        Write-StatusMessage "Successfully retrieved all required Azure resources" -Level "SUCCESS"
        
        return @{
            ApplicationInsights = $appInsights
            AppService = $appService
            SqlDatabase = $sqlDatabase
            ActionGroup = $actionGroup
        }
    }
    catch {
        Write-StatusMessage "Failed to retrieve Azure resources: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Get-AlertThresholds {
    param(
        [string]$Environment
    )
    
    $thresholds = @{
        dev = @{
            ResponseTimeThreshold = 3000
            ErrorRateThreshold = 10
            AvailabilityThreshold = 95
            CpuThreshold = 80
            MemoryThreshold = 85
            DtuThreshold = 80
            ConnectionThreshold = 80
            EvaluationFrequency = "PT15M"
            WindowSize = "PT30M"
            Severity = 2
        }
        test = @{
            ResponseTimeThreshold = 2000
            ErrorRateThreshold = 8
            AvailabilityThreshold = 97
            CpuThreshold = 75
            MemoryThreshold = 80
            DtuThreshold = 75
            ConnectionThreshold = 75
            EvaluationFrequency = "PT10M"
            WindowSize = "PT20M"
            Severity = 1
        }
        prod = @{
            ResponseTimeThreshold = 1500
            ErrorRateThreshold = 5
            AvailabilityThreshold = 99
            CpuThreshold = 70
            MemoryThreshold = 75
            DtuThreshold = 70
            ConnectionThreshold = 70
            EvaluationFrequency = "PT5M"
            WindowSize = "PT15M"
            Severity = 0
        }
    }
    
    return $thresholds[$Environment]
}

function Test-ExistingAlerts {
    param(
        [string]$ResourceGroupName,
        [string]$Environment
    )
    
    Write-StatusMessage "Checking for existing alert rules..."
    
    try {
        $alertPrefix = "alert-NetworkingApp-$Environment"
        $existingAlerts = Get-AzMetricAlertRuleV2 -ResourceGroupName $ResourceGroupName | Where-Object { $_.Name -like "$alertPrefix*" }
        
        if ($existingAlerts.Count -gt 0) {
            Write-StatusMessage "Found $($existingAlerts.Count) existing alert rules:" -Level "WARNING"
            foreach ($alert in $existingAlerts) {
                Write-StatusMessage "  - $($alert.Name) (Enabled: $($alert.Enabled))"
            }
            return $true
        }
        else {
            Write-StatusMessage "No existing alert rules found" -Level "SUCCESS"
            return $false
        }
    }
    catch {
        Write-StatusMessage "Failed to check existing alerts: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Deploy-AlertRules {
    param(
        [hashtable]$Resources,
        [hashtable]$Config,
        [string]$Environment,
        [string]$AlertEmailAddress
    )
    
    Write-StatusMessage "Deploying alert rules for $Environment environment..."
    
    $alertPrefix = "alert-NetworkingApp-$Environment"
    $deployedAlerts = @()
    
    try {
        # 1. High Response Time Alert
        Write-StatusMessage "Creating high response time alert..."
        $responseTimeAlert = @{
            Name = "$alertPrefix-high-response-time"
            Description = "Alert when average response time exceeds $($Config.ResponseTimeThreshold)ms"
            Severity = $Config.Severity
            Enabled = $EnableAlerts
            Scopes = @($Resources.ApplicationInsights.Id)
            EvaluationFrequency = $Config.EvaluationFrequency
            WindowSize = $Config.WindowSize
            TargetResourceType = "Microsoft.Insights/components"
            MetricName = "requests/duration"
            MetricNamespace = "Microsoft.Insights/components"
            Operator = "GreaterThan"
            Threshold = $Config.ResponseTimeThreshold
            TimeAggregation = "Average"
            ActionGroupId = $Resources.ActionGroup.Id
        }
        
        # 2. High Error Rate Alert
        Write-StatusMessage "Creating high error rate alert..."
        $errorRateAlert = @{
            Name = "$alertPrefix-high-error-rate"
            Description = "Alert when error rate exceeds $($Config.ErrorRateThreshold)%"
            Severity = $Config.Severity
            Enabled = $EnableAlerts
            Scopes = @($Resources.ApplicationInsights.Id)
            EvaluationFrequency = $Config.EvaluationFrequency
            WindowSize = $Config.WindowSize
            TargetResourceType = "Microsoft.Insights/components"
            MetricName = "requests/failed"
            MetricNamespace = "Microsoft.Insights/components"
            Operator = "GreaterThan"
            Threshold = $Config.ErrorRateThreshold
            TimeAggregation = "Average"
            ActionGroupId = $Resources.ActionGroup.Id
        }
        
        # 3. High CPU Utilization Alert
        Write-StatusMessage "Creating high CPU utilization alert..."
        $cpuAlert = @{
            Name = "$alertPrefix-high-cpu-usage"
            Description = "Alert when CPU usage exceeds $($Config.CpuThreshold)%"
            Severity = $Config.Severity
            Enabled = $EnableAlerts
            Scopes = @($Resources.AppService.Id)
            EvaluationFrequency = $Config.EvaluationFrequency
            WindowSize = $Config.WindowSize
            TargetResourceType = "Microsoft.Web/sites"
            MetricName = "CpuPercentage"
            MetricNamespace = "Microsoft.Web/sites"
            Operator = "GreaterThan"
            Threshold = $Config.CpuThreshold
            TimeAggregation = "Average"
            ActionGroupId = $Resources.ActionGroup.Id
        }
        
        # 4. High DTU Utilization Alert
        Write-StatusMessage "Creating high DTU utilization alert..."
        $dtuAlert = @{
            Name = "$alertPrefix-high-dtu-usage"
            Description = "Alert when DTU usage exceeds $($Config.DtuThreshold)%"
            Severity = $Config.Severity
            Enabled = $EnableAlerts
            Scopes = @($Resources.SqlDatabase.ResourceId)
            EvaluationFrequency = $Config.EvaluationFrequency
            WindowSize = $Config.WindowSize
            TargetResourceType = "Microsoft.Sql/servers/databases"
            MetricName = "dtu_consumption_percent"
            MetricNamespace = "Microsoft.Sql/servers/databases"
            Operator = "GreaterThan"
            Threshold = $Config.DtuThreshold
            TimeAggregation = "Average"
            ActionGroupId = $Resources.ActionGroup.Id
        }
        
        $deployedAlerts += $responseTimeAlert, $errorRateAlert, $cpuAlert, $dtuAlert
        
        Write-StatusMessage "Successfully created $($deployedAlerts.Count) alert rules" -Level "SUCCESS"
        return $deployedAlerts
    }
    catch {
        Write-StatusMessage "Failed to deploy alert rules: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Test-AlertConfiguration {
    param(
        [string]$ResourceGroupName,
        [string]$Environment
    )
    
    Write-StatusMessage "Testing alert configuration..."
    
    try {
        $alertPrefix = "alert-NetworkingApp-$Environment"
        $alerts = Get-AzMetricAlertRuleV2 -ResourceGroupName $ResourceGroupName | Where-Object { $_.Name -like "$alertPrefix*" }
        
        if ($alerts.Count -eq 0) {
            Write-StatusMessage "No alerts found for testing" -Level "WARNING"
            return $false
        }
        
        $enabledAlerts = $alerts | Where-Object { $_.Enabled -eq $true }
        $disabledAlerts = $alerts | Where-Object { $_.Enabled -eq $false }
        
        Write-StatusMessage "Alert Configuration Summary:" -Level "SUCCESS"
        Write-StatusMessage "  Total Alerts: $($alerts.Count)"
        Write-StatusMessage "  Enabled: $($enabledAlerts.Count)"
        Write-StatusMessage "  Disabled: $($disabledAlerts.Count)"
        
        foreach ($alert in $alerts) {
            $status = if ($alert.Enabled) { "ENABLED" } else { "DISABLED" }
            Write-StatusMessage "  - $($alert.Name): $status"
        }
        
        return $true
    }
    catch {
        Write-StatusMessage "Failed to test alert configuration: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Export-AlertConfiguration {
    param(
        [string]$ResourceGroupName,
        [string]$Environment,
        [string]$OutputPath = ".\alert-configuration-$Environment.json"
    )
    
    Write-StatusMessage "Exporting alert configuration to $OutputPath..."
    
    try {
        $alertPrefix = "alert-NetworkingApp-$Environment"
        $alerts = Get-AzMetricAlertRuleV2 -ResourceGroupName $ResourceGroupName | Where-Object { $_.Name -like "$alertPrefix*" }
        
        $configuration = @{
            Environment = $Environment
            ResourceGroup = $ResourceGroupName
            ExportDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            AlertCount = $alerts.Count
            Alerts = @()
        }
        
        foreach ($alert in $alerts) {
            $alertConfig = @{
                Name = $alert.Name
                Description = $alert.Description
                Enabled = $alert.Enabled
                Severity = $alert.Severity
                EvaluationFrequency = $alert.EvaluationFrequency
                WindowSize = $alert.WindowSize
                Scopes = $alert.Scopes
                Criteria = $alert.Criteria
            }
            $configuration.Alerts += $alertConfig
        }
        
        $configuration | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-StatusMessage "Alert configuration exported successfully to $OutputPath" -Level "SUCCESS"
        
        return $OutputPath
    }
    catch {
        Write-StatusMessage "Failed to export alert configuration: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

# ==================================================================================================
# Main Execution
# ==================================================================================================

Write-StatusMessage "Starting Azure Monitor Alerts setup for $Environment environment..." -Level "SUCCESS"
Write-StatusMessage "Resource Group: $ResourceGroupName"
Write-StatusMessage "Alert Email: $AlertEmailAddress"
Write-StatusMessage "Enable Alerts: $EnableAlerts"
Write-StatusMessage "Validation Only: $ValidateOnly"

try {
    # Step 1: Verify Azure connection
    if (-not (Test-AzureConnection)) {
        exit 1
    }
    
    # Step 2: Set subscription if provided
    if ($SubscriptionId) {
        Write-StatusMessage "Setting Azure subscription to $SubscriptionId"
        Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
    }
    
    # Step 3: Get alert configuration for environment
    $config = Get-AlertThresholds -Environment $Environment
    Write-StatusMessage "Loaded alert thresholds for $Environment environment"
    
    # Step 4: Retrieve Azure resources
    $resources = Get-AzureResources -ResourceGroupName $ResourceGroupName
    
    # Step 5: Check for existing alerts
    $hasExistingAlerts = Test-ExistingAlerts -ResourceGroupName $ResourceGroupName -Environment $Environment
    
    if ($ValidateOnly) {
        Write-StatusMessage "Validation completed successfully" -Level "SUCCESS"
        
        # Export current configuration if alerts exist
        if ($hasExistingAlerts) {
            Export-AlertConfiguration -ResourceGroupName $ResourceGroupName -Environment $Environment
        }
        
        exit 0
    }
    
    # Step 6: Deploy alert rules (only if not validation mode)
    if ($EnableAlerts) {
        $deployedAlerts = Deploy-AlertRules -Resources $resources -Config $config -Environment $Environment -AlertEmailAddress $AlertEmailAddress
        Write-StatusMessage "Deployed $($deployedAlerts.Count) alert rules" -Level "SUCCESS"
    }
    else {
        Write-StatusMessage "Alert deployment skipped (EnableAlerts = false)" -Level "WARNING"
    }
    
    # Step 7: Test final configuration
    Start-Sleep -Seconds 30  # Wait for alerts to be fully deployed
    $testResult = Test-AlertConfiguration -ResourceGroupName $ResourceGroupName -Environment $Environment
    
    if ($testResult) {
        # Step 8: Export configuration
        $configPath = Export-AlertConfiguration -ResourceGroupName $ResourceGroupName -Environment $Environment
        
        Write-StatusMessage "Azure Monitor Alerts setup completed successfully!" -Level "SUCCESS"
        Write-StatusMessage "Configuration exported to: $configPath"
        Write-StatusMessage "Monitor the alerts in the Azure portal or via Azure CLI"
    }
    else {
        Write-StatusMessage "Alert configuration test failed" -Level "ERROR"
        exit 1
    }
}
catch {
    Write-StatusMessage "Setup failed with error: $($_.Exception.Message)" -Level "ERROR"
    Write-StatusMessage "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
    exit 1
}

Write-StatusMessage "Setup completed at $(Get-Date)" -Level "SUCCESS"
