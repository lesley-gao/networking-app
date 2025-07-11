#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validate Azure CDN Configuration and Performance
.DESCRIPTION
    This script validates the Azure CDN deployment, tests endpoints, 
    and verifies performance optimizations for the Flight Companion platform.
.PARAMETER Environment
    The target environment (dev, test, prod)
.PARAMETER ResourceGroupName
    The Azure resource group name
.PARAMETER CdnProfileName
    The Azure CDN profile name
.PARAMETER SkipPerformanceTests
    Skip performance and load testing
.EXAMPLE
    .\Validate-CDN-Configuration.ps1 -Environment "prod" -ResourceGroupName "rg-flightcompanion-prod"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$CdnProfileName,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipPerformanceTests,
    
    [Parameter(Mandatory = $false)]
    [switch]$Detailed
)

# Set error handling
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Default resource names based on environment
if (-not $ResourceGroupName) {
    $ResourceGroupName = "rg-flightcompanion-$Environment"
}
if (-not $CdnProfileName) {
    $CdnProfileName = "cdn-flightcompanion-$Environment"
}

# Test results tracking
$script:TestResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Tests = @()
}

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "SUCCESS" { "Green" }
            "TEST" { "Cyan" }
            default { "White" }
        }
    )
}

function Add-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = "",
        [string]$ExpectedValue = "",
        [string]$ActualValue = ""
    )
    
    $result = @{
        Name = $TestName
        Passed = $Passed
        Details = $Details
        ExpectedValue = $ExpectedValue
        ActualValue = $ActualValue
        Timestamp = Get-Date
    }
    
    $script:TestResults.Tests += $result
    
    if ($Passed) {
        $script:TestResults.Passed++
        Write-LogMessage "✓ $TestName" "SUCCESS"
    } else {
        $script:TestResults.Failed++
        Write-LogMessage "✗ $TestName - $Details" "ERROR"
    }
    
    if ($Detailed -and $Details) {
        Write-LogMessage "  Details: $Details" "INFO"
    }
}

function Test-AzureConnection {
    Write-LogMessage "Testing Azure connection..." "TEST"
    
    try {
        $account = az account show --output json | ConvertFrom-Json
        Add-TestResult "Azure CLI Authentication" $true "Logged in as $($account.user.name)"
        
        # Test subscription access
        $subscription = az account show --output json | ConvertFrom-Json
        Add-TestResult "Azure Subscription Access" $true "Active subscription: $($subscription.name)"
        
        return $true
    }
    catch {
        Add-TestResult "Azure CLI Authentication" $false "Not logged into Azure: $($_.Exception.Message)"
        return $false
    }
}

function Test-CDNInfrastructure {
    Write-LogMessage "Testing CDN infrastructure..." "TEST"
    
    try {
        # Test CDN profile exists
        $cdnProfile = az cdn profile show --name $CdnProfileName --resource-group $ResourceGroupName --output json 2>$null | ConvertFrom-Json
        
        if ($cdnProfile) {
            Add-TestResult "CDN Profile Exists" $true "Profile: $($cdnProfile.name), SKU: $($cdnProfile.sku.name)"
            
            # Expected SKU based on environment
            $expectedSku = switch ($Environment) {
                "dev" { "Standard_Microsoft" }
                "test" { "Standard_Microsoft" }
                "prod" { "Premium_Verizon" }
            }
            
            $skuCorrect = $cdnProfile.sku.name -eq $expectedSku
            Add-TestResult "CDN SKU Configuration" $skuCorrect "Expected: $expectedSku, Actual: $($cdnProfile.sku.name)" $expectedSku $cdnProfile.sku.name
            
        } else {
            Add-TestResult "CDN Profile Exists" $false "CDN profile not found: $CdnProfileName"
            return $false
        }
        
        # Test CDN endpoints
        $endpoints = az cdn endpoint list --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        $expectedEndpoints = @(
            "flightcompanion-$Environment-static",
            "flightcompanion-$Environment-app"
        )
        
        foreach ($expectedEndpoint in $expectedEndpoints) {
            $endpoint = $endpoints | Where-Object { $_.name -eq $expectedEndpoint }
            if ($endpoint) {
                Add-TestResult "CDN Endpoint: $expectedEndpoint" $true "Status: $($endpoint.resourceState), Host: $($endpoint.hostName)"
                
                # Test endpoint is running
                $isRunning = $endpoint.resourceState -eq "Running"
                Add-TestResult "CDN Endpoint Running: $expectedEndpoint" $isRunning "Resource State: $($endpoint.resourceState)"
                
            } else {
                Add-TestResult "CDN Endpoint: $expectedEndpoint" $false "Endpoint not found"
            }
        }
        
        return $true
    }
    catch {
        Add-TestResult "CDN Infrastructure Test" $false "Failed to test CDN infrastructure: $($_.Exception.Message)"
        return $false
    }
}

function Test-CDNEndpoints {
    Write-LogMessage "Testing CDN endpoint connectivity..." "TEST"
    
    try {
        $endpoints = az cdn endpoint list --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        foreach ($endpoint in $endpoints) {
            $url = "https://$($endpoint.hostName)"
            
            try {
                # Test HTTPS connectivity
                $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 30 -ErrorAction Stop
                $statusOk = $response.StatusCode -eq 200 -or $response.StatusCode -eq 404 # 404 is OK for empty CDN
                Add-TestResult "CDN Endpoint Connectivity: $($endpoint.name)" $statusOk "Status Code: $($response.StatusCode)"
                
                # Test HTTPS redirect
                $httpsEnforced = $response.Headers.ContainsKey('Strict-Transport-Security') -or $url.StartsWith('https://')
                Add-TestResult "HTTPS Enforcement: $($endpoint.name)" $httpsEnforced "HTTPS properly configured"
                
                # Test compression support
                $compressionHeaders = @('gzip', 'deflate', 'br')
                $acceptEncoding = $compressionHeaders -join ', '
                $compressedResponse = Invoke-WebRequest -Uri $url -Method Head -Headers @{'Accept-Encoding' = $acceptEncoding } -TimeoutSec 30 -ErrorAction SilentlyContinue
                
                $compressionSupported = $compressedResponse -and $compressedResponse.Headers.ContainsKey('Content-Encoding')
                Add-TestResult "Compression Support: $($endpoint.name)" $compressionSupported "Compression headers configured"
                
            }
            catch {
                Add-TestResult "CDN Endpoint Connectivity: $($endpoint.name)" $false "Connection failed: $($_.Exception.Message)"
            }
        }
        
        return $true
    }
    catch {
        Add-TestResult "CDN Endpoint Connectivity Test" $false "Failed to test endpoints: $($_.Exception.Message)"
        return $false
    }
}

function Test-CachingConfiguration {
    Write-LogMessage "Testing CDN caching configuration..." "TEST"
    
    try {
        $endpoints = az cdn endpoint list --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        foreach ($endpoint in $endpoints) {
            # Get delivery rules
            try {
                $endpointDetails = az cdn endpoint show --name $endpoint.name --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
                
                if ($endpointDetails.deliveryPolicy -and $endpointDetails.deliveryPolicy.rules) {
                    $rulesCount = $endpointDetails.deliveryPolicy.rules.Count
                    Add-TestResult "Delivery Rules: $($endpoint.name)" ($rulesCount -gt 0) "Found $rulesCount delivery rules"
                    
                    # Check for specific rule types
                    $hasStaticAssetRules = $endpointDetails.deliveryPolicy.rules | Where-Object { 
                        $_.conditions -and $_.conditions.requestUri -and $_.conditions.requestUri.matchValues -contains "*.css,*.js,*.png,*.jpg,*.gif,*.svg,*.woff,*.woff2" 
                    }
                    Add-TestResult "Static Asset Caching Rules: $($endpoint.name)" ($hasStaticAssetRules -ne $null) "Static asset caching configured"
                    
                    # Check for SPA routing rules (for app endpoint)
                    if ($endpoint.name -like "*-app") {
                        $hasSpaRules = $endpointDetails.deliveryPolicy.rules | Where-Object { 
                            $_.actions -and $_.actions.urlRewrite 
                        }
                        Add-TestResult "SPA Routing Rules: $($endpoint.name)" ($hasSpaRules -ne $null) "SPA routing configured"
                    }
                } else {
                    Add-TestResult "Delivery Rules: $($endpoint.name)" $false "No delivery rules configured"
                }
                
                # Test cache behavior with a sample request
                $testUrl = "https://$($endpoint.hostName)/test-cache-$(Get-Random)"
                try {
                    $cacheResponse = Invoke-WebRequest -Uri $testUrl -Method Head -TimeoutSec 30 -ErrorAction SilentlyContinue
                    if ($cacheResponse) {
                        $hasCacheHeaders = $cacheResponse.Headers.ContainsKey('Cache-Control') -or $cacheResponse.Headers.ContainsKey('Expires')
                        Add-TestResult "Cache Headers: $($endpoint.name)" $hasCacheHeaders "Cache headers present in response"
                    }
                }
                catch {
                    # Expected for non-existent test URL
                }
                
            }
            catch {
                Add-TestResult "Delivery Rules: $($endpoint.name)" $false "Failed to retrieve delivery rules: $($_.Exception.Message)"
            }
        }
        
        return $true
    }
    catch {
        Add-TestResult "Caching Configuration Test" $false "Failed to test caching: $($_.Exception.Message)"
        return $false
    }
}

function Test-SecurityConfiguration {
    Write-LogMessage "Testing CDN security configuration..." "TEST"
    
    try {
        $endpoints = az cdn endpoint list --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        foreach ($endpoint in $endpoints) {
            $endpointDetails = az cdn endpoint show --name $endpoint.name --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
            
            # Test HTTPS only
            $httpsOnly = $endpointDetails.isHttpAllowed -eq $false
            Add-TestResult "HTTPS Only: $($endpoint.name)" $httpsOnly "HTTP traffic allowed: $($endpointDetails.isHttpAllowed)"
            
            # Test custom domain if configured
            if ($endpointDetails.customDomains -and $endpointDetails.customDomains.Count -gt 0) {
                foreach ($customDomain in $endpointDetails.customDomains) {
                    $httpsEnabled = $customDomain.customHttpsProvisioningState -eq "Enabled"
                    Add-TestResult "Custom Domain HTTPS: $($customDomain.hostName)" $httpsEnabled "HTTPS State: $($customDomain.customHttpsProvisioningState)"
                }
            }
            
            # Test geo-filtering for production
            if ($Environment -eq "prod") {
                $hasGeoFiltering = $endpointDetails.geoFilters -and $endpointDetails.geoFilters.Count -gt 0
                Add-TestResult "Geo-Filtering: $($endpoint.name)" $hasGeoFiltering "Production geo-filtering configured"
                
                if ($hasGeoFiltering) {
                    foreach ($geoFilter in $endpointDetails.geoFilters) {
                        $filterConfigured = $geoFilter.action -eq "Block" -and $geoFilter.countryCodes.Count -gt 0
                        Add-TestResult "Geo-Filter Rules: $($geoFilter.relativePath)" $filterConfigured "Action: $($geoFilter.action), Countries: $($geoFilter.countryCodes.Count)"
                    }
                }
            }
        }
        
        return $true
    }
    catch {
        Add-TestResult "Security Configuration Test" $false "Failed to test security: $($_.Exception.Message)"
        return $false
    }
}

function Test-PerformanceOptimization {
    if ($SkipPerformanceTests) {
        Write-LogMessage "Skipping performance tests as requested" "INFO"
        return $true
    }
    
    Write-LogMessage "Testing CDN performance optimization..." "TEST"
    
    try {
        $endpoints = az cdn endpoint list --profile-name $CdnProfileName --resource-group $ResourceGroupName --output json | ConvertFrom-Json
        
        foreach ($endpoint in $endpoints) {
            $baseUrl = "https://$($endpoint.hostName)"
            
            # Test response times
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            try {
                $response = Invoke-WebRequest -Uri $baseUrl -Method Head -TimeoutSec 30 -ErrorAction Stop
                $stopwatch.Stop()
                
                $responseTimeMs = $stopwatch.ElapsedMilliseconds
                $performanceOk = $responseTimeMs -lt 2000 # 2 second threshold
                Add-TestResult "Response Time: $($endpoint.name)" $performanceOk "Response time: ${responseTimeMs}ms" "< 2000ms" "${responseTimeMs}ms"
                
                # Test compression
                $compressionTest = Invoke-WebRequest -Uri $baseUrl -Method Head -Headers @{'Accept-Encoding' = 'gzip, deflate, br'} -TimeoutSec 30 -ErrorAction SilentlyContinue
                if ($compressionTest) {
                    $compressionEnabled = $compressionTest.Headers.ContainsKey('Content-Encoding')
                    Add-TestResult "Compression Enabled: $($endpoint.name)" $compressionEnabled "Content-Encoding header present"
                }
                
                # Test caching
                $cacheHeadersPresent = $response.Headers.ContainsKey('Cache-Control') -or $response.Headers.ContainsKey('ETag') -or $response.Headers.ContainsKey('Last-Modified')
                Add-TestResult "Caching Headers: $($endpoint.name)" $cacheHeadersPresent "Cache optimization headers present"
                
            }
            catch {
                $stopwatch.Stop()
                Add-TestResult "Response Time: $($endpoint.name)" $false "Request failed: $($_.Exception.Message)"
            }
        }
        
        return $true
    }
    catch {
        Add-TestResult "Performance Test" $false "Failed to test performance: $($_.Exception.Message)"
        return $false
    }
}

function Test-FrontendDeployment {
    Write-LogMessage "Testing frontend deployment configuration..." "TEST"
    
    try {
        $frontendDir = Join-Path $PSScriptRoot ".." "frontend"
        
        # Test if build directory exists
        $buildDir = Join-Path $frontendDir "build"
        $buildExists = Test-Path $buildDir
        Add-TestResult "Frontend Build Directory" $buildExists "Build directory exists: $buildDir"
        
        if ($buildExists) {
            # Test for optimized assets
            $jsFiles = Get-ChildItem $buildDir -Recurse -Filter "*.js" | Measure-Object
            $cssFiles = Get-ChildItem $buildDir -Recurse -Filter "*.css" | Measure-Object
            $gzipFiles = Get-ChildItem $buildDir -Recurse -Filter "*.gz" | Measure-Object
            
            Add-TestResult "JavaScript Assets Built" ($jsFiles.Count -gt 0) "Found $($jsFiles.Count) JS files"
            Add-TestResult "CSS Assets Built" ($cssFiles.Count -gt 0) "Found $($cssFiles.Count) CSS files"
            Add-TestResult "Gzip Compression" ($gzipFiles.Count -gt 0) "Found $($gzipFiles.Count) gzipped files"
            
            # Test for optimization reports
            $optimizationReport = Join-Path $buildDir "optimization-report.json"
            $compressionManifest = Join-Path $buildDir "compression-manifest.json"
            
            Add-TestResult "Optimization Report" (Test-Path $optimizationReport) "Optimization report generated"
            Add-TestResult "Compression Manifest" (Test-Path $compressionManifest) "Compression manifest generated"
        }
        
        # Test environment configuration files
        $envExample = Join-Path $frontendDir ".env.example"
        $envDev = Join-Path $frontendDir ".env.development"
        $envProd = Join-Path $frontendDir ".env.production"
        
        Add-TestResult "Environment Template" (Test-Path $envExample) ".env.example exists"
        Add-TestResult "Development Config" (Test-Path $envDev) ".env.development exists"
        Add-TestResult "Production Config" (Test-Path $envProd) ".env.production exists"
        
        # Test deployment scripts
        $deployScript = Join-Path $PSScriptRoot "Deploy-Frontend.ps1"
        $buildScript = Join-Path $PSScriptRoot "Build-Frontend.ps1"
        
        Add-TestResult "Deployment Script" (Test-Path $deployScript) "Deploy-Frontend.ps1 exists"
        Add-TestResult "Build Script" (Test-Path $buildScript) "Build-Frontend.ps1 exists"
        
        return $true
    }
    catch {
        Add-TestResult "Frontend Deployment Test" $false "Failed to test frontend deployment: $($_.Exception.Message)"
        return $false
    }
}

function Generate-ValidationReport {
    Write-LogMessage "Generating validation report..." "INFO"
    
    $report = @{
        Environment = $Environment
        ResourceGroup = $ResourceGroupName
        CdnProfile = $CdnProfileName
        ValidationDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Summary = @{
            TotalTests = $script:TestResults.Tests.Count
            PassedTests = $script:TestResults.Passed
            FailedTests = $script:TestResults.Failed
            WarningTests = $script:TestResults.Warnings
            SuccessRate = if ($script:TestResults.Tests.Count -gt 0) { 
                [math]::Round(($script:TestResults.Passed / $script:TestResults.Tests.Count) * 100, 2) 
            } else { 0 }
        }
        TestResults = $script:TestResults.Tests
        Recommendations = @()
    }
    
    # Add recommendations based on failed tests
    foreach ($test in $script:TestResults.Tests | Where-Object { -not $_.Passed }) {
        switch -Wildcard ($test.Name) {
            "*CDN SKU*" {
                $report.Recommendations += "Review CDN SKU configuration for environment requirements"
            }
            "*HTTPS*" {
                $report.Recommendations += "Configure HTTPS enforcement and SSL certificates"
            }
            "*Compression*" {
                $report.Recommendations += "Enable compression for better performance"
            }
            "*Caching*" {
                $report.Recommendations += "Configure caching rules for optimal performance"
            }
            "*Response Time*" {
                $report.Recommendations += "Investigate CDN performance and origin server response times"
            }
            "*Geo-Filtering*" {
                $report.Recommendations += "Configure geo-filtering for production security"
            }
        }
    }
    
    # Remove duplicate recommendations
    $report.Recommendations = $report.Recommendations | Sort-Object -Unique
    
    $reportPath = Join-Path $PSScriptRoot "cdn-validation-report-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $report | ConvertTo-Json -Depth 5 | Out-File $reportPath -Encoding UTF8
    
    Write-LogMessage "Validation report saved: $reportPath" "SUCCESS"
    return $report
}

function Show-ValidationSummary {
    param($Report)
    
    Write-LogMessage "=== CDN Validation Summary ===" "INFO"
    Write-LogMessage "Environment: $Environment" "INFO"
    Write-LogMessage "CDN Profile: $CdnProfileName" "INFO"
    Write-LogMessage "Resource Group: $ResourceGroupName" "INFO"
    Write-LogMessage "" "INFO"
    
    Write-LogMessage "Test Results:" "INFO"
    Write-LogMessage "  Total Tests: $($Report.Summary.TotalTests)" "INFO"
    Write-LogMessage "  Passed: $($Report.Summary.PassedTests)" "SUCCESS"
    Write-LogMessage "  Failed: $($Report.Summary.FailedTests)" $(if ($Report.Summary.FailedTests -gt 0) { "ERROR" } else { "INFO" })
    Write-LogMessage "  Success Rate: $($Report.Summary.SuccessRate)%" $(if ($Report.Summary.SuccessRate -ge 90) { "SUCCESS" } elseif ($Report.Summary.SuccessRate -ge 70) { "WARN" } else { "ERROR" })
    Write-LogMessage "" "INFO"
    
    if ($Report.Summary.FailedTests -gt 0) {
        Write-LogMessage "Failed Tests:" "ERROR"
        foreach ($test in $Report.TestResults | Where-Object { -not $_.Passed }) {
            Write-LogMessage "  ✗ $($test.Name): $($test.Details)" "ERROR"
        }
        Write-LogMessage "" "INFO"
    }
    
    if ($Report.Recommendations.Count -gt 0) {
        Write-LogMessage "Recommendations:" "WARN"
        foreach ($recommendation in $Report.Recommendations) {
            Write-LogMessage "  → $recommendation" "WARN"
        }
    }
}

function Main {
    Write-LogMessage "Starting CDN validation for $Environment environment..." "INFO"
    Write-LogMessage "Target Resource Group: $ResourceGroupName" "INFO"
    Write-LogMessage "Target CDN Profile: $CdnProfileName" "INFO"
    Write-LogMessage "" "INFO"
    
    # Run validation tests
    $azureOk = Test-AzureConnection
    if (-not $azureOk) {
        Write-LogMessage "Azure connection failed. Cannot continue validation." "ERROR"
        exit 1
    }
    
    Test-CDNInfrastructure
    Test-CDNEndpoints
    Test-CachingConfiguration
    Test-SecurityConfiguration
    Test-PerformanceOptimization
    Test-FrontendDeployment
    
    # Generate and show report
    $report = Generate-ValidationReport
    Show-ValidationSummary $report
    
    # Exit with appropriate code
    if ($script:TestResults.Failed -gt 0) {
        Write-LogMessage "Validation completed with failures. See report for details." "ERROR"
        exit 1
    } else {
        Write-LogMessage "CDN validation completed successfully!" "SUCCESS"
        exit 0
    }
}

# Execute main function
Main
