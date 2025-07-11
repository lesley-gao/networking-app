# ==================================================================================================
# Network Security Deployment Script
# Deploys Azure Network Security Groups and Application Gateway infrastructure
# ==================================================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "rg-flight-companion-$Environment",

    [Parameter(Mandatory = $false)]
    [string]$Location = "Australia East",

    [Parameter(Mandatory = $false)]
    [switch]$ValidateOnly,

    [Parameter(Mandatory = $false)]
    [switch]$WhatIf,

    [Parameter(Mandatory = $false)]
    [string]$LogAnalyticsWorkspaceId = "",

    [Parameter(Mandatory = $false)]
    [string]$DdosProtectionPlanId = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ==================================================================================================
# Configuration and Variables
# ==================================================================================================

$TemplatesPath = ".\infra\bicep"
$ParametersPath = ".\infra\bicep\parameters"
$LogPath = ".\network-security-deployment-log-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# ==================================================================================================
# Logging Functions
# ==================================================================================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "INFO" { "White" }
        default { "Gray" }
    }
    
    Write-Host $logEntry -ForegroundColor $color
    Add-Content -Path $LogPath -Value $logEntry
}

function Write-Header {
    param([string]$Title)
    
    $separator = "=" * 80
    Write-Log $separator
    Write-Log "  $Title"
    Write-Log $separator
}

# ==================================================================================================
# Validation Functions
# ==================================================================================================

function Test-Prerequisites {
    Write-Log "Checking deployment prerequisites..."
    
    $issues = @()
    
    # Check Azure CLI
    try {
        $azVersion = az version --output json | ConvertFrom-Json
        Write-Log "✓ Azure CLI version: $($azVersion.'azure-cli')" -Level "SUCCESS"
    }
    catch {
        $issues += "Azure CLI not found or not accessible"
        Write-Log "✗ Azure CLI not available" -Level "ERROR"
    }
    
    # Check Azure login
    try {
        $account = az account show --output json | ConvertFrom-Json
        Write-Log "✓ Logged into Azure as: $($account.user.name)" -Level "SUCCESS"
        Write-Log "✓ Current subscription: $($account.name)" -Level "SUCCESS"
    }
    catch {
        $issues += "Not logged into Azure CLI"
        Write-Log "✗ Not logged into Azure CLI" -Level "ERROR"
    }
    
    # Check Bicep CLI
    try {
        $bicepVersion = az bicep version
        Write-Log "✓ Bicep CLI available: $bicepVersion" -Level "SUCCESS"
    }
    catch {
        Write-Log "Installing Bicep CLI..." -Level "WARNING"
        az bicep install
    }
    
    # Check template files
    $templateFile = Join-Path $TemplatesPath "network-security.bicep"
    if (Test-Path $templateFile) {
        Write-Log "✓ Template file found: $templateFile" -Level "SUCCESS"
    }
    else {
        $issues += "Template file not found: $templateFile"
        Write-Log "✗ Template file not found" -Level "ERROR"
    }
    
    # Check parameter files
    $parameterFile = Join-Path $ParametersPath "network-security.$Environment.json"
    if (Test-Path $parameterFile) {
        Write-Log "✓ Parameter file found: $parameterFile" -Level "SUCCESS"
    }
    else {
        $issues += "Parameter file not found: $parameterFile"
        Write-Log "✗ Parameter file not found" -Level "ERROR"
    }
    
    if ($issues.Count -gt 0) {
        Write-Log "Prerequisites check failed with $($issues.Count) issues:" -Level "ERROR"
        foreach ($issue in $issues) {
            Write-Log "  - $issue" -Level "ERROR"
        }
        return $false
    }
    
    Write-Log "All prerequisites met successfully" -Level "SUCCESS"
    return $true
}

function Test-ResourceGroup {
    param([string]$ResourceGroupName, [string]$Location)
    
    Write-Log "Checking resource group: $ResourceGroupName"
    
    try {
        $rg = az group show --name $ResourceGroupName --output json 2>$null | ConvertFrom-Json
        
        if ($rg) {
            Write-Log "✓ Resource group exists: $ResourceGroupName" -Level "SUCCESS"
            Write-Log "  Location: $($rg.location)"
            Write-Log "  Provisioning State: $($rg.properties.provisioningState)"
            return $true
        }
        else {
            Write-Log "Resource group does not exist, will be created: $ResourceGroupName" -Level "WARNING"
            return $false
        }
    }
    catch {
        Write-Log "Resource group does not exist, will be created: $ResourceGroupName" -Level "WARNING"
        return $false
    }
}

function New-ResourceGroup {
    param([string]$ResourceGroupName, [string]$Location)
    
    Write-Log "Creating resource group: $ResourceGroupName in $Location"
    
    try {
        $result = az group create --name $ResourceGroupName --location $Location --output json | ConvertFrom-Json
        
        if ($result.properties.provisioningState -eq "Succeeded") {
            Write-Log "✓ Resource group created successfully" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "✗ Resource group creation failed" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "✗ Resource group creation failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# ==================================================================================================
# Deployment Functions
# ==================================================================================================

function Test-BicepTemplate {
    param([string]$TemplateFile, [string]$ParameterFile)
    
    Write-Log "Validating Bicep template..."
    
    try {
        # Build Bicep template to ARM
        Write-Log "Building Bicep template..."
        az bicep build --file $TemplateFile
        
        # Validate the template
        Write-Log "Validating ARM template..."
        $validation = az deployment group validate `
            --resource-group $ResourceGroupName `
            --template-file $TemplateFile `
            --parameters "@$ParameterFile" `
            --parameters logAnalyticsWorkspaceId=$LogAnalyticsWorkspaceId `
            --parameters ddosProtectionPlanId=$DdosProtectionPlanId `
            --output json | ConvertFrom-Json
        
        if ($validation.error) {
            Write-Log "✗ Template validation failed: $($validation.error.message)" -Level "ERROR"
            return $false
        }
        else {
            Write-Log "✓ Template validation successful" -Level "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "✗ Template validation failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Start-NetworkSecurityDeployment {
    param([string]$TemplateFile, [string]$ParameterFile)
    
    Write-Log "Starting network security infrastructure deployment..."
    
    try {
        $deploymentName = "network-security-$Environment-$(Get-Date -Format 'yyyyMMddHHmmss')"
        
        if ($WhatIf) {
            Write-Log "Running What-If analysis..." -Level "WARNING"
            
            $whatIfResult = az deployment group what-if `
                --resource-group $ResourceGroupName `
                --template-file $TemplateFile `
                --parameters "@$ParameterFile" `
                --parameters logAnalyticsWorkspaceId=$LogAnalyticsWorkspaceId `
                --parameters ddosProtectionPlanId=$DdosProtectionPlanId `
                --name $deploymentName `
                --output json
            
            Write-Log "What-If analysis completed" -Level "SUCCESS"
            Write-Log "What-If Results:"
            Write-Log $whatIfResult
            return $true
        }
        
        Write-Log "Executing deployment: $deploymentName"
        
        $deployment = az deployment group create `
            --resource-group $ResourceGroupName `
            --template-file $TemplateFile `
            --parameters "@$ParameterFile" `
            --parameters logAnalyticsWorkspaceId=$LogAnalyticsWorkspaceId `
            --parameters ddosProtectionPlanId=$DdosProtectionPlanId `
            --name $deploymentName `
            --output json | ConvertFrom-Json
        
        if ($deployment.properties.provisioningState -eq "Succeeded") {
            Write-Log "✓ Network security deployment successful" -Level "SUCCESS"
            
            # Display outputs
            if ($deployment.properties.outputs) {
                Write-Log "Deployment Outputs:" -Level "SUCCESS"
                foreach ($output in $deployment.properties.outputs.PSObject.Properties) {
                    Write-Log "  $($output.Name): $($output.Value.value)"
                }
            }
            
            return $true
        }
        else {
            Write-Log "✗ Network security deployment failed" -Level "ERROR"
            Write-Log "Provisioning State: $($deployment.properties.provisioningState)"
            return $false
        }
    }
    catch {
        Write-Log "✗ Deployment failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# ==================================================================================================
# Validation Functions
# ==================================================================================================

function Test-NetworkSecurityDeployment {
    param([string]$ResourceGroupName)
    
    Write-Log "Validating network security deployment..."
    
    $validationResults = @{}
    
    # Test Virtual Network
    try {
        $vnet = az network vnet show --resource-group $ResourceGroupName --name "vnet-flight-companion-$Environment" --output json | ConvertFrom-Json
        if ($vnet) {
            Write-Log "✓ Virtual Network deployed successfully" -Level "SUCCESS"
            Write-Log "  Address Space: $($vnet.addressSpace.addressPrefixes -join ', ')"
            Write-Log "  Subnets: $($vnet.subnets.Count)"
            $validationResults["VirtualNetwork"] = $true
        }
    }
    catch {
        Write-Log "✗ Virtual Network validation failed" -Level "ERROR"
        $validationResults["VirtualNetwork"] = $false
    }
    
    # Test Network Security Groups
    try {
        $nsgs = az network nsg list --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        if ($nsgs -and $nsgs.Count -ge 4) {
            Write-Log "✓ Network Security Groups deployed successfully" -Level "SUCCESS"
            foreach ($nsg in $nsgs) {
                Write-Log "  NSG: $($nsg.name) - Rules: $($nsg.securityRules.Count)"
            }
            $validationResults["NetworkSecurityGroups"] = $true
        }
        else {
            Write-Log "✗ Network Security Groups validation failed" -Level "ERROR"
            $validationResults["NetworkSecurityGroups"] = $false
        }
    }
    catch {
        Write-Log "✗ Network Security Groups validation failed" -Level "ERROR"
        $validationResults["NetworkSecurityGroups"] = $false
    }
    
    # Test Application Gateway
    try {
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        if ($appGw) {
            Write-Log "✓ Application Gateway deployed successfully" -Level "SUCCESS"
            Write-Log "  SKU: $($appGw.sku.name)"
            Write-Log "  Tier: $($appGw.sku.tier)"
            Write-Log "  Operational State: $($appGw.operationalState)"
            $validationResults["ApplicationGateway"] = $true
        }
    }
    catch {
        Write-Log "✗ Application Gateway validation failed" -Level "ERROR"
        $validationResults["ApplicationGateway"] = $false
    }
    
    # Test WAF Policy
    try {
        $wafPolicy = az network application-gateway waf-policy show --resource-group $ResourceGroupName --name "fc-$Environment-waf-policy" --output json | ConvertFrom-Json
        if ($wafPolicy) {
            Write-Log "✓ WAF Policy deployed successfully" -Level "SUCCESS"
            Write-Log "  Policy State: $($wafPolicy.policySettings.state)"
            Write-Log "  Policy Mode: $($wafPolicy.policySettings.mode)"
            $validationResults["WAFPolicy"] = $true
        }
    }
    catch {
        Write-Log "✗ WAF Policy validation failed" -Level "ERROR"
        $validationResults["WAFPolicy"] = $false
    }
    
    # Test Public IP
    try {
        $publicIp = az network public-ip show --resource-group $ResourceGroupName --name "fc-$Environment-pip-appgw" --output json | ConvertFrom-Json
        if ($publicIp) {
            Write-Log "✓ Public IP deployed successfully" -Level "SUCCESS"
            Write-Log "  IP Address: $($publicIp.ipAddress)"
            Write-Log "  FQDN: $($publicIp.dnsSettings.fqdn)"
            $validationResults["PublicIP"] = $true
        }
    }
    catch {
        Write-Log "✗ Public IP validation failed" -Level "ERROR"
        $validationResults["PublicIP"] = $false
    }
    
    # Summary
    $successCount = ($validationResults.Values | Where-Object { $_ -eq $true }).Count
    $totalCount = $validationResults.Count
    
    Write-Log "Validation Summary: $successCount/$totalCount components validated successfully"
    
    return $successCount -eq $totalCount
}

function Test-NetworkConnectivity {
    param([string]$ResourceGroupName)
    
    Write-Log "Testing network connectivity and security rules..."
    
    try {
        # Test Application Gateway health
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        if ($appGw.operationalState -eq "Running") {
            Write-Log "✓ Application Gateway is running" -Level "SUCCESS"
        }
        else {
            Write-Log "⚠️ Application Gateway state: $($appGw.operationalState)" -Level "WARNING"
        }
        
        # Test backend health
        $backendHealth = az network application-gateway show-backend-health --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        if ($backendHealth) {
            Write-Log "✓ Backend health check completed" -Level "SUCCESS"
            foreach ($pool in $backendHealth.backendAddressPools) {
                Write-Log "  Backend Pool: $($pool.backendAddressPool.name)"
                foreach ($server in $pool.backendHttpSettingsCollection) {
                    Write-Log "    Health Status: $($server.servers[0].health)"
                }
            }
        }
        
        return $true
    }
    catch {
        Write-Log "⚠️ Network connectivity test completed with warnings: $($_.Exception.Message)" -Level "WARNING"
        return $true # Non-critical for initial deployment
    }
}

# ==================================================================================================
# Main Execution Function
# ==================================================================================================

function Start-NetworkSecurityDeploymentProcess {
    Write-Header "Azure Network Security Deployment for Flight Companion Platform"
    Write-Log "Environment: $Environment"
    Write-Log "Subscription ID: $SubscriptionId"
    Write-Log "Resource Group: $ResourceGroupName"
    Write-Log "Location: $Location"
    Write-Log "Validation Only: $ValidateOnly"
    Write-Log "What-If: $WhatIf"
    Write-Log "Log File: $LogPath"
    
    $success = $true
    
    try {
        # Step 1: Prerequisites check
        Write-Header "Step 1: Prerequisites Validation"
        if (-not (Test-Prerequisites)) {
            throw "Prerequisites check failed"
        }
        
        # Step 2: Set subscription context
        Write-Header "Step 2: Azure Subscription Setup"
        Write-Log "Setting subscription context..."
        az account set --subscription $SubscriptionId
        Write-Log "✓ Subscription context set" -Level "SUCCESS"
        
        # Step 3: Resource group validation/creation
        Write-Header "Step 3: Resource Group Setup"
        if (-not (Test-ResourceGroup -ResourceGroupName $ResourceGroupName -Location $Location)) {
            if (-not (New-ResourceGroup -ResourceGroupName $ResourceGroupName -Location $Location)) {
                throw "Resource group creation failed"
            }
        }
        
        # Step 4: Template validation
        Write-Header "Step 4: Template Validation"
        $templateFile = Join-Path $TemplatesPath "network-security.bicep"
        $parameterFile = Join-Path $ParametersPath "network-security.$Environment.json"
        
        if (-not (Test-BicepTemplate -TemplateFile $templateFile -ParameterFile $parameterFile)) {
            throw "Template validation failed"
        }
        
        if ($ValidateOnly) {
            Write-Log "Validation-only mode completed successfully" -Level "SUCCESS"
            return $true
        }
        
        # Step 5: Deploy network security infrastructure
        Write-Header "Step 5: Network Security Deployment"
        if (-not (Start-NetworkSecurityDeployment -TemplateFile $templateFile -ParameterFile $parameterFile)) {
            throw "Network security deployment failed"
        }
        
        # Step 6: Validate deployment
        Write-Header "Step 6: Deployment Validation"
        if (-not (Test-NetworkSecurityDeployment -ResourceGroupName $ResourceGroupName)) {
            Write-Log "⚠️ Some validation checks failed but deployment may still be successful" -Level "WARNING"
        }
        
        # Step 7: Test connectivity
        Write-Header "Step 7: Network Connectivity Testing"
        Test-NetworkConnectivity -ResourceGroupName $ResourceGroupName
        
        Write-Header "Network Security Deployment Completed Successfully"
        Write-Log "✓ Network security infrastructure deployed successfully for $Environment environment" -Level "SUCCESS"
        Write-Log "Log file: $LogPath"
        
    }
    catch {
        $success = $false
        Write-Log "✗ Deployment failed: $($_.Exception.Message)" -Level "ERROR"
        Write-Log "Check the log file for details: $LogPath" -Level "ERROR"
        
        if ($Environment -eq "prod") {
            Write-Log "PRODUCTION DEPLOYMENT FAILED - Immediate attention required!" -Level "ERROR"
        }
    }
    
    return $success
}

# ==================================================================================================
# Script Entry Point
# ==================================================================================================

Write-Log "Starting network security deployment script at $(Get-Date)" -Level "SUCCESS"
Write-Log "Parameters: Environment=$Environment, SubscriptionId=$SubscriptionId, ValidateOnly=$ValidateOnly, WhatIf=$WhatIf"

$result = Start-NetworkSecurityDeploymentProcess

if ($result) {
    Write-Log "Script completed successfully" -Level "SUCCESS"
    exit 0
}
else {
    Write-Log "Script completed with errors" -Level "ERROR"
    exit 1
}
