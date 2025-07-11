# ==================================================================================================
# Network Security Validation and Testing Script
# Comprehensive testing of Azure Network Security Groups and Application Gateway
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
    [switch]$IncludeSecurityTests,

    [Parameter(Mandatory = $false)]
    [switch]$IncludePerformanceTests,

    [Parameter(Mandatory = $false)]
    [string]$TestResultsPath = ".\network-security-test-results-$Environment.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ==================================================================================================
# Configuration and Variables
# ==================================================================================================

$LogPath = ".\network-security-validation-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Test results collection
$TestResults = @{
    Environment = $Environment
    Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Tests = @{}
    Summary = @{
        Total = 0
        Passed = 0
        Failed = 0
        Warnings = 0
    }
}

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

function Write-TestHeader {
    param([string]$TestName)
    
    $separator = "-" * 60
    Write-Log $separator
    Write-Log "Testing: $TestName"
    Write-Log $separator
}

function Add-TestResult {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message,
        [hashtable]$Details = @{}
    )
    
    $TestResults.Tests[$TestName] = @{
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $TestResults.Summary.Total++
    
    switch ($Status) {
        "PASS" { 
            $TestResults.Summary.Passed++
            Write-Log "✓ $TestName - $Message" -Level "SUCCESS"
        }
        "FAIL" { 
            $TestResults.Summary.Failed++
            Write-Log "✗ $TestName - $Message" -Level "ERROR"
        }
        "WARNING" { 
            $TestResults.Summary.Warnings++
            Write-Log "⚠️ $TestName - $Message" -Level "WARNING"
        }
    }
}

# ==================================================================================================
# Core Validation Functions
# ==================================================================================================

function Test-VirtualNetworkConfiguration {
    Write-TestHeader "Virtual Network Configuration"
    
    try {
        $vnet = az network vnet show --resource-group $ResourceGroupName --name "vnet-flight-companion-$Environment" --output json | ConvertFrom-Json
        
        if (-not $vnet) {
            Add-TestResult -TestName "VirtualNetwork" -Status "FAIL" -Message "Virtual Network not found"
            return
        }
        
        # Check address space
        $expectedAddressSpace = switch ($Environment) {
            "dev" { "10.0.0.0/16" }
            "test" { "10.1.0.0/16" }
            "prod" { "10.2.0.0/16" }
        }
        
        if ($vnet.addressSpace.addressPrefixes -contains $expectedAddressSpace) {
            Add-TestResult -TestName "VNetAddressSpace" -Status "PASS" -Message "Address space configured correctly" -Details @{
                AddressSpace = $vnet.addressSpace.addressPrefixes
            }
        }
        else {
            Add-TestResult -TestName "VNetAddressSpace" -Status "FAIL" -Message "Incorrect address space configuration" -Details @{
                Expected = $expectedAddressSpace
                Actual = $vnet.addressSpace.addressPrefixes
            }
        }
        
        # Check required subnets
        $requiredSubnets = @("GatewaySubnet", "fc-$Environment-subnet-appgw", "fc-$Environment-subnet-app", "fc-$Environment-subnet-data")
        $existingSubnets = $vnet.subnets | ForEach-Object { $_.name }
        
        $missingSubnets = $requiredSubnets | Where-Object { $_ -notin $existingSubnets }
        
        if ($missingSubnets.Count -eq 0) {
            Add-TestResult -TestName "VNetSubnets" -Status "PASS" -Message "All required subnets present" -Details @{
                Subnets = $existingSubnets
            }
        }
        else {
            Add-TestResult -TestName "VNetSubnets" -Status "FAIL" -Message "Missing required subnets" -Details @{
                Missing = $missingSubnets
                Existing = $existingSubnets
            }
        }
        
        # Check DDoS protection for production
        if ($Environment -eq "prod") {
            if ($vnet.ddosProtectionPlan) {
                Add-TestResult -TestName "VNetDDoSProtection" -Status "PASS" -Message "DDoS protection enabled"
            }
            else {
                Add-TestResult -TestName "VNetDDoSProtection" -Status "WARNING" -Message "DDoS protection not configured for production"
            }
        }
        
    }
    catch {
        Add-TestResult -TestName "VirtualNetwork" -Status "FAIL" -Message "Failed to validate Virtual Network: $($_.Exception.Message)"
    }
}

function Test-NetworkSecurityGroups {
    Write-TestHeader "Network Security Groups"
    
    try {
        $nsgs = az network nsg list --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        $expectedNSGs = @(
            "fc-$Environment-nsg-appgw",
            "fc-$Environment-nsg-app",
            "fc-$Environment-nsg-data",
            "fc-$Environment-nsg-mgmt"
        )
        
        $existingNSGs = $nsgs | ForEach-Object { $_.name }
        $missingNSGs = $expectedNSGs | Where-Object { $_ -notin $existingNSGs }
        
        if ($missingNSGs.Count -eq 0) {
            Add-TestResult -TestName "NSGPresence" -Status "PASS" -Message "All required NSGs present" -Details @{
                NSGs = $existingNSGs
            }
        }
        else {
            Add-TestResult -TestName "NSGPresence" -Status "FAIL" -Message "Missing required NSGs" -Details @{
                Missing = $missingNSGs
                Existing = $existingNSGs
            }
        }
        
        # Test critical security rules
        foreach ($nsg in $nsgs) {
            Test-NSGSecurityRules -NSG $nsg
        }
        
    }
    catch {
        Add-TestResult -TestName "NetworkSecurityGroups" -Status "FAIL" -Message "Failed to validate NSGs: $($_.Exception.Message)"
    }
}

function Test-NSGSecurityRules {
    param($NSG)
    
    $nsgName = $NSG.name
    $rules = $NSG.securityRules
    
    # Check for deny all default rule
    $denyAllRule = $rules | Where-Object { $_.name -eq "DenyAllInbound" -and $_.direction -eq "Inbound" -and $_.access -eq "Deny" }
    
    if ($denyAllRule) {
        Add-TestResult -TestName "NSGDenyAllRule_$nsgName" -Status "PASS" -Message "Deny all inbound rule present"
    }
    else {
        Add-TestResult -TestName "NSGDenyAllRule_$nsgName" -Status "WARNING" -Message "No explicit deny all inbound rule found"
    }
    
    # Check for appropriate allow rules based on NSG type
    if ($nsgName -like "*appgw*") {
        Test-ApplicationGatewayNSGRules -NSG $NSG
    }
    elseif ($nsgName -like "*app*") {
        Test-AppServiceNSGRules -NSG $NSG
    }
    elseif ($nsgName -like "*data*") {
        Test-DatabaseNSGRules -NSG $NSG
    }
    elseif ($nsgName -like "*mgmt*") {
        Test-ManagementNSGRules -NSG $NSG
    }
}

function Test-ApplicationGatewayNSGRules {
    param($NSG)
    
    $rules = $NSG.securityRules
    
    # Check for HTTP/HTTPS rules
    $httpRule = $rules | Where-Object { $_.destinationPortRange -eq "80" -and $_.access -eq "Allow" }
    $httpsRule = $rules | Where-Object { $_.destinationPortRange -eq "443" -and $_.access -eq "Allow" }
    
    if ($httpRule -and $httpsRule) {
        Add-TestResult -TestName "AppGwHTTPRules_$($NSG.name)" -Status "PASS" -Message "HTTP/HTTPS rules configured"
    }
    else {
        Add-TestResult -TestName "AppGwHTTPRules_$($NSG.name)" -Status "FAIL" -Message "Missing HTTP/HTTPS rules"
    }
    
    # Check for Azure infrastructure rules
    $azureInfraRule = $rules | Where-Object { $_.destinationPortRange -eq "65200-65535" -and $_.access -eq "Allow" }
    
    if ($azureInfraRule) {
        Add-TestResult -TestName "AppGwAzureInfraRules_$($NSG.name)" -Status "PASS" -Message "Azure infrastructure rules configured"
    }
    else {
        Add-TestResult -TestName "AppGwAzureInfraRules_$($NSG.name)" -Status "WARNING" -Message "Azure infrastructure rules may be missing"
    }
}

function Test-AppServiceNSGRules {
    param($NSG)
    
    $rules = $NSG.securityRules
    
    # Check for HTTP rule from Application Gateway
    $httpFromAppGwRule = $rules | Where-Object { 
        $_.destinationPortRange -eq "80" -and 
        $_.access -eq "Allow" -and
        $_.sourceAddressPrefix -like "*appgw*"
    }
    
    if ($httpFromAppGwRule) {
        Add-TestResult -TestName "AppServiceHTTPRule_$($NSG.name)" -Status "PASS" -Message "HTTP from Application Gateway rule configured"
    }
    else {
        Add-TestResult -TestName "AppServiceHTTPRule_$($NSG.name)" -Status "WARNING" -Message "HTTP from Application Gateway rule may be missing"
    }
}

function Test-DatabaseNSGRules {
    param($NSG)
    
    $rules = $NSG.securityRules
    
    # Check for SQL Server rule from App Service
    $sqlRule = $rules | Where-Object { 
        $_.destinationPortRange -eq "1433" -and 
        $_.access -eq "Allow"
    }
    
    if ($sqlRule) {
        Add-TestResult -TestName "DatabaseSQLRule_$($NSG.name)" -Status "PASS" -Message "SQL Server rule configured"
    }
    else {
        Add-TestResult -TestName "DatabaseSQLRule_$($NSG.name)" -Status "WARNING" -Message "SQL Server rule may be missing"
    }
    
    # Check that no direct internet access is allowed
    $internetAccessRule = $rules | Where-Object { 
        $_.sourceAddressPrefix -eq "*" -and 
        $_.access -eq "Allow" -and
        $_.direction -eq "Inbound"
    }
    
    if (-not $internetAccessRule) {
        Add-TestResult -TestName "DatabaseInternetAccess_$($NSG.name)" -Status "PASS" -Message "No direct internet access allowed"
    }
    else {
        Add-TestResult -TestName "DatabaseInternetAccess_$($NSG.name)" -Status "FAIL" -Message "Direct internet access may be allowed"
    }
}

function Test-ManagementNSGRules {
    param($NSG)
    
    $rules = $NSG.securityRules
    
    # Check for SSH/RDP rules with restricted source
    $sshRule = $rules | Where-Object { $_.destinationPortRange -eq "22" -and $_.access -eq "Allow" }
    $rdpRule = $rules | Where-Object { $_.destinationPortRange -eq "3389" -and $_.access -eq "Allow" }
    
    if ($sshRule -or $rdpRule) {
        # Check if source is restricted (not from internet)
        $restrictedSource = ($sshRule -and $sshRule.sourceAddressPrefix -ne "*") -or ($rdpRule -and $rdpRule.sourceAddressPrefix -ne "*")
        
        if ($restrictedSource) {
            Add-TestResult -TestName "MgmtRemoteAccessRule_$($NSG.name)" -Status "PASS" -Message "Remote access rules with restricted source"
        }
        else {
            Add-TestResult -TestName "MgmtRemoteAccessRule_$($NSG.name)" -Status "FAIL" -Message "Remote access rules allow unrestricted access"
        }
    }
    else {
        Add-TestResult -TestName "MgmtRemoteAccessRule_$($NSG.name)" -Status "WARNING" -Message "No remote access rules found"
    }
}

function Test-ApplicationGateway {
    Write-TestHeader "Application Gateway Configuration"
    
    try {
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        if (-not $appGw) {
            Add-TestResult -TestName "ApplicationGateway" -Status "FAIL" -Message "Application Gateway not found"
            return
        }
        
        # Check operational state
        if ($appGw.operationalState -eq "Running") {
            Add-TestResult -TestName "AppGwOperationalState" -Status "PASS" -Message "Application Gateway is running"
        }
        else {
            Add-TestResult -TestName "AppGwOperationalState" -Status "FAIL" -Message "Application Gateway is not running: $($appGw.operationalState)"
        }
        
        # Check SKU configuration
        $expectedSKU = switch ($Environment) {
            "dev" { "Standard_v2" }
            "test" { "WAF_v2" }
            "prod" { "WAF_v2" }
        }
        
        if ($appGw.sku.name -eq $expectedSKU) {
            Add-TestResult -TestName "AppGwSKU" -Status "PASS" -Message "Correct SKU configured: $($appGw.sku.name)"
        }
        else {
            Add-TestResult -TestName "AppGwSKU" -Status "WARNING" -Message "Unexpected SKU: $($appGw.sku.name), expected: $expectedSKU"
        }
        
        # Check SSL certificates
        if ($appGw.sslCertificates -and $appGw.sslCertificates.Count -gt 0) {
            Add-TestResult -TestName "AppGwSSLCertificates" -Status "PASS" -Message "SSL certificates configured"
        }
        else {
            Add-TestResult -TestName "AppGwSSLCertificates" -Status "WARNING" -Message "No SSL certificates found"
        }
        
        # Check listeners
        $httpListener = $appGw.httpListeners | Where-Object { $_.protocol -eq "Http" }
        $httpsListener = $appGw.httpListeners | Where-Object { $_.protocol -eq "Https" }
        
        if ($httpsListener) {
            Add-TestResult -TestName "AppGwHTTPSListener" -Status "PASS" -Message "HTTPS listener configured"
        }
        else {
            Add-TestResult -TestName "AppGwHTTPSListener" -Status "WARNING" -Message "No HTTPS listener found"
        }
        
        # Check backend pools
        if ($appGw.backendAddressPools -and $appGw.backendAddressPools.Count -gt 0) {
            Add-TestResult -TestName "AppGwBackendPools" -Status "PASS" -Message "Backend pools configured"
        }
        else {
            Add-TestResult -TestName "AppGwBackendPools" -Status "WARNING" -Message "No backend pools found"
        }
        
    }
    catch {
        Add-TestResult -TestName "ApplicationGateway" -Status "FAIL" -Message "Failed to validate Application Gateway: $($_.Exception.Message)"
    }
}

function Test-WAFPolicy {
    Write-TestHeader "WAF Policy Configuration"
    
    try {
        $wafPolicy = az network application-gateway waf-policy show --resource-group $ResourceGroupName --name "fc-$Environment-waf-policy" --output json | ConvertFrom-Json
        
        if (-not $wafPolicy) {
            Add-TestResult -TestName "WAFPolicy" -Status "FAIL" -Message "WAF Policy not found"
            return
        }
        
        # Check policy state
        if ($wafPolicy.policySettings.state -eq "Enabled") {
            Add-TestResult -TestName "WAFPolicyState" -Status "PASS" -Message "WAF Policy is enabled"
        }
        else {
            Add-TestResult -TestName "WAFPolicyState" -Status "FAIL" -Message "WAF Policy is disabled"
        }
        
        # Check policy mode for production
        $expectedMode = switch ($Environment) {
            "dev" { "Detection" }
            "test" { "Detection" }
            "prod" { "Prevention" }
        }
        
        if ($wafPolicy.policySettings.mode -eq $expectedMode) {
            Add-TestResult -TestName "WAFPolicyMode" -Status "PASS" -Message "Correct WAF mode: $($wafPolicy.policySettings.mode)"
        }
        else {
            Add-TestResult -TestName "WAFPolicyMode" -Status "WARNING" -Message "WAF mode is $($wafPolicy.policySettings.mode), expected $expectedMode"
        }
        
        # Check managed rules
        if ($wafPolicy.managedRules -and $wafPolicy.managedRules.managedRuleSets) {
            $owaspRuleSet = $wafPolicy.managedRules.managedRuleSets | Where-Object { $_.ruleSetType -eq "OWASP" }
            
            if ($owaspRuleSet) {
                Add-TestResult -TestName "WAFOWASPRules" -Status "PASS" -Message "OWASP rule set configured: $($owaspRuleSet.ruleSetVersion)"
            }
            else {
                Add-TestResult -TestName "WAFOWASPRules" -Status "WARNING" -Message "OWASP rule set not found"
            }
        }
        else {
            Add-TestResult -TestName "WAFManagedRules" -Status "WARNING" -Message "No managed rules configured"
        }
        
        # Check custom rules
        if ($wafPolicy.customRules -and $wafPolicy.customRules.Count -gt 0) {
            Add-TestResult -TestName "WAFCustomRules" -Status "PASS" -Message "Custom rules configured: $($wafPolicy.customRules.Count) rules"
        }
        else {
            Add-TestResult -TestName "WAFCustomRules" -Status "WARNING" -Message "No custom rules found"
        }
        
    }
    catch {
        Add-TestResult -TestName "WAFPolicy" -Status "FAIL" -Message "Failed to validate WAF Policy: $($_.Exception.Message)"
    }
}

function Test-PublicIPConfiguration {
    Write-TestHeader "Public IP Configuration"
    
    try {
        $publicIp = az network public-ip show --resource-group $ResourceGroupName --name "fc-$Environment-pip-appgw" --output json | ConvertFrom-Json
        
        if (-not $publicIp) {
            Add-TestResult -TestName "PublicIP" -Status "FAIL" -Message "Public IP not found"
            return
        }
        
        # Check allocation method
        if ($publicIp.publicIPAllocationMethod -eq "Static") {
            Add-TestResult -TestName "PublicIPAllocation" -Status "PASS" -Message "Static IP allocation configured"
        }
        else {
            Add-TestResult -TestName "PublicIPAllocation" -Status "WARNING" -Message "Dynamic IP allocation: $($publicIp.publicIPAllocationMethod)"
        }
        
        # Check SKU
        if ($publicIp.sku.name -eq "Standard") {
            Add-TestResult -TestName "PublicIPSKU" -Status "PASS" -Message "Standard SKU configured"
        }
        else {
            Add-TestResult -TestName "PublicIPSKU" -Status "WARNING" -Message "Non-standard SKU: $($publicIp.sku.name)"
        }
        
        # Check DNS name
        if ($publicIp.dnsSettings -and $publicIp.dnsSettings.fqdn) {
            Add-TestResult -TestName "PublicIPDNS" -Status "PASS" -Message "DNS name configured: $($publicIp.dnsSettings.fqdn)" -Details @{
                FQDN = $publicIp.dnsSettings.fqdn
                IPAddress = $publicIp.ipAddress
            }
        }
        else {
            Add-TestResult -TestName "PublicIPDNS" -Status "WARNING" -Message "No DNS name configured"
        }
        
    }
    catch {
        Add-TestResult -TestName "PublicIP" -Status "FAIL" -Message "Failed to validate Public IP: $($_.Exception.Message)"
    }
}

# ==================================================================================================
# Security Testing Functions
# ==================================================================================================

function Test-SecurityCompliance {
    if (-not $IncludeSecurityTests) {
        return
    }
    
    Write-TestHeader "Security Compliance Testing"
    
    # Test for common security misconfigurations
    Test-UnencryptedTraffic
    Test-WeakSSLConfiguration
    Test-OpenManagementPorts
    Test-MissingNetworkSegmentation
}

function Test-UnencryptedTraffic {
    try {
        # Check if HTTP is redirected to HTTPS
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        $httpListener = $appGw.httpListeners | Where-Object { $_.protocol -eq "Http" }
        $httpsListener = $appGw.httpListeners | Where-Object { $_.protocol -eq "Https" }
        
        if ($httpsListener -and -not $httpListener) {
            Add-TestResult -TestName "HTTPSOnly" -Status "PASS" -Message "HTTPS-only configuration"
        }
        elseif ($httpsListener -and $httpListener) {
            # Check for redirect rules
            $redirectRule = $appGw.redirectConfigurations | Where-Object { $_.redirectType -eq "Permanent" }
            if ($redirectRule) {
                Add-TestResult -TestName "HTTPRedirect" -Status "PASS" -Message "HTTP to HTTPS redirect configured"
            }
            else {
                Add-TestResult -TestName "HTTPRedirect" -Status "FAIL" -Message "HTTP traffic not redirected to HTTPS"
            }
        }
        else {
            Add-TestResult -TestName "HTTPSConfiguration" -Status "FAIL" -Message "HTTPS not properly configured"
        }
    }
    catch {
        Add-TestResult -TestName "TrafficEncryption" -Status "FAIL" -Message "Failed to test traffic encryption: $($_.Exception.Message)"
    }
}

function Test-WeakSSLConfiguration {
    try {
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        # Check SSL policy
        if ($appGw.sslPolicy) {
            $policy = $appGw.sslPolicy
            
            # Check for strong SSL policy
            if ($policy.policyType -eq "Predefined" -and $policy.policyName -like "*AppGwSslPolicy*2022*") {
                Add-TestResult -TestName "SSLPolicy" -Status "PASS" -Message "Strong SSL policy configured: $($policy.policyName)"
            }
            else {
                Add-TestResult -TestName "SSLPolicy" -Status "WARNING" -Message "SSL policy may not be optimal: $($policy.policyName)"
            }
        }
        else {
            Add-TestResult -TestName "SSLPolicy" -Status "WARNING" -Message "No explicit SSL policy configured"
        }
    }
    catch {
        Add-TestResult -TestName "SSLConfiguration" -Status "FAIL" -Message "Failed to test SSL configuration: $($_.Exception.Message)"
    }
}

function Test-OpenManagementPorts {
    try {
        $nsgs = az network nsg list --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        $riskyPorts = @("22", "3389", "1433", "3306", "5432")
        $openManagementPorts = @()
        
        foreach ($nsg in $nsgs) {
            foreach ($rule in $nsg.securityRules) {
                if ($rule.access -eq "Allow" -and $rule.direction -eq "Inbound" -and $rule.sourceAddressPrefix -eq "*") {
                    foreach ($port in $riskyPorts) {
                        if ($rule.destinationPortRange -eq $port -or 
                            ($rule.destinationPortRanges -and $rule.destinationPortRanges -contains $port)) {
                            $openManagementPorts += "$($nsg.name):$port"
                        }
                    }
                }
            }
        }
        
        if ($openManagementPorts.Count -eq 0) {
            Add-TestResult -TestName "OpenManagementPorts" -Status "PASS" -Message "No open management ports from internet"
        }
        else {
            Add-TestResult -TestName "OpenManagementPorts" -Status "FAIL" -Message "Open management ports detected" -Details @{
                OpenPorts = $openManagementPorts
            }
        }
    }
    catch {
        Add-TestResult -TestName "ManagementPorts" -Status "FAIL" -Message "Failed to test management ports: $($_.Exception.Message)"
    }
}

function Test-MissingNetworkSegmentation {
    try {
        $vnet = az network vnet show --resource-group $ResourceGroupName --name "vnet-flight-companion-$Environment" --output json | ConvertFrom-Json
        
        # Check if subnets have associated NSGs
        $subnetsWithoutNSG = @()
        
        foreach ($subnet in $vnet.subnets) {
            if (-not $subnet.networkSecurityGroup) {
                $subnetsWithoutNSG += $subnet.name
            }
        }
        
        if ($subnetsWithoutNSG.Count -eq 0) {
            Add-TestResult -TestName "NetworkSegmentation" -Status "PASS" -Message "All subnets have associated NSGs"
        }
        else {
            Add-TestResult -TestName "NetworkSegmentation" -Status "WARNING" -Message "Some subnets without NSGs" -Details @{
                SubnetsWithoutNSG = $subnetsWithoutNSG
            }
        }
    }
    catch {
        Add-TestResult -TestName "NetworkSegmentation" -Status "FAIL" -Message "Failed to test network segmentation: $($_.Exception.Message)"
    }
}

# ==================================================================================================
# Performance Testing Functions
# ==================================================================================================

function Test-PerformanceConfiguration {
    if (-not $IncludePerformanceTests) {
        return
    }
    
    Write-TestHeader "Performance Configuration Testing"
    
    Test-ApplicationGatewayCapacity
    Test-AutoScalingConfiguration
    Test-ConnectionDraining
}

function Test-ApplicationGatewayCapacity {
    try {
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        $expectedMinCapacity = switch ($Environment) {
            "dev" { 1 }
            "test" { 2 }
            "prod" { 3 }
        }
        
        if ($appGw.autoscaleConfiguration) {
            $minCapacity = $appGw.autoscaleConfiguration.minCapacity
            $maxCapacity = $appGw.autoscaleConfiguration.maxCapacity
            
            if ($minCapacity -ge $expectedMinCapacity) {
                Add-TestResult -TestName "AppGwCapacity" -Status "PASS" -Message "Appropriate capacity configured: $minCapacity-$maxCapacity"
            }
            else {
                Add-TestResult -TestName "AppGwCapacity" -Status "WARNING" -Message "Low minimum capacity: $minCapacity"
            }
        }
        else {
            Add-TestResult -TestName "AppGwAutoScale" -Status "WARNING" -Message "Auto-scaling not configured"
        }
    }
    catch {
        Add-TestResult -TestName "PerformanceCapacity" -Status "FAIL" -Message "Failed to test performance configuration: $($_.Exception.Message)"
    }
}

function Test-AutoScalingConfiguration {
    try {
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        if ($appGw.autoscaleConfiguration) {
            $autoScale = $appGw.autoscaleConfiguration
            
            if ($autoScale.maxCapacity -gt $autoScale.minCapacity) {
                Add-TestResult -TestName "AutoScaling" -Status "PASS" -Message "Auto-scaling properly configured"
            }
            else {
                Add-TestResult -TestName "AutoScaling" -Status "WARNING" -Message "Auto-scaling range too narrow"
            }
        }
        else {
            Add-TestResult -TestName "AutoScaling" -Status "WARNING" -Message "Auto-scaling not enabled"
        }
    }
    catch {
        Add-TestResult -TestName "AutoScaling" -Status "FAIL" -Message "Failed to test auto-scaling: $($_.Exception.Message)"
    }
}

function Test-ConnectionDraining {
    try {
        $appGw = az network application-gateway show --resource-group $ResourceGroupName --name "fc-$Environment-appgw" --output json | ConvertFrom-Json
        
        $connectionDrainingEnabled = $false
        
        foreach ($httpSetting in $appGw.backendHttpSettingsCollection) {
            if ($httpSetting.connectionDraining -and $httpSetting.connectionDraining.enabled) {
                $connectionDrainingEnabled = $true
                break
            }
        }
        
        if ($connectionDrainingEnabled) {
            Add-TestResult -TestName "ConnectionDraining" -Status "PASS" -Message "Connection draining enabled"
        }
        else {
            Add-TestResult -TestName "ConnectionDraining" -Status "WARNING" -Message "Connection draining not configured"
        }
    }
    catch {
        Add-TestResult -TestName "ConnectionDraining" -Status "FAIL" -Message "Failed to test connection draining: $($_.Exception.Message)"
    }
}

# ==================================================================================================
# Main Execution Function
# ==================================================================================================

function Start-NetworkSecurityValidation {
    Write-Log "=" * 80
    Write-Log "Network Security Validation for Flight Companion Platform"
    Write-Log "Environment: $Environment"
    Write-Log "Resource Group: $ResourceGroupName"
    Write-Log "=" * 80
    
    try {
        # Set subscription context
        az account set --subscription $SubscriptionId
        
        # Core infrastructure tests
        Test-VirtualNetworkConfiguration
        Test-NetworkSecurityGroups
        Test-ApplicationGateway
        Test-WAFPolicy
        Test-PublicIPConfiguration
        
        # Security tests (optional)
        Test-SecurityCompliance
        
        # Performance tests (optional)
        Test-PerformanceConfiguration
        
        # Generate summary
        Write-Log "=" * 80
        Write-Log "VALIDATION SUMMARY"
        Write-Log "=" * 80
        Write-Log "Total Tests: $($TestResults.Summary.Total)"
        Write-Log "Passed: $($TestResults.Summary.Passed)" -Level "SUCCESS"
        Write-Log "Failed: $($TestResults.Summary.Failed)" -Level "ERROR"
        Write-Log "Warnings: $($TestResults.Summary.Warnings)" -Level "WARNING"
        
        $successRate = if ($TestResults.Summary.Total -gt 0) { 
            [math]::Round(($TestResults.Summary.Passed / $TestResults.Summary.Total) * 100, 2) 
        } else { 0 }
        
        Write-Log "Success Rate: $successRate%"
        
        # Save results to file
        $TestResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $TestResultsPath -Encoding UTF8
        Write-Log "Test results saved to: $TestResultsPath"
        
        # Return success if no failures
        return $TestResults.Summary.Failed -eq 0
        
    }
    catch {
        Write-Log "Validation failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# ==================================================================================================
# Script Entry Point
# ==================================================================================================

Write-Log "Starting network security validation at $(Get-Date)" -Level "SUCCESS"

$result = Start-NetworkSecurityValidation

if ($result) {
    Write-Log "Network security validation completed successfully" -Level "SUCCESS"
    exit 0
}
else {
    Write-Log "Network security validation completed with failures" -Level "ERROR"
    exit 1
}
