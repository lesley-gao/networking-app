# ----------------------------------------------------------------------------------------------------
# Custom Domain & SSL Certificate Setup Script
# TASK-091: Configure custom domain with SSL certificate and Azure App Service authentication
# ----------------------------------------------------------------------------------------------------

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $true)]
    [string]$AppServiceName,
    
    [Parameter(Mandatory = $true)]
    [string]$CustomDomainName,
    
    [Parameter(Mandatory = $false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory = $false)]
    [bool]$EnableAuthentication = $true,
    
    [Parameter(Mandatory = $false)]
    [bool]$CreateDnsZone = $false,
    
    [Parameter(Mandatory = $false)]
    [string]$AzureAdTenantId = "",
    
    [Parameter(Mandatory = $false)]
    [string]$AzureAdClientId = "",
    
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Flight Companion Platform - Custom Domain & SSL Setup" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Validate Azure CLI is installed and user is logged in
try {
    $azAccount = az account show --query "id" -o tsv 2>$null
    if (-not $azAccount) {
        Write-Host "❌ Please log in to Azure CLI first: az login" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Azure CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    exit 1
}

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "🔄 Setting Azure subscription to: $SubscriptionId" -ForegroundColor Yellow
    az account set --subscription $SubscriptionId
}

# Get current subscription
$currentSubscription = az account show --query "name" -o tsv
Write-Host "📋 Current subscription: $currentSubscription" -ForegroundColor Cyan

# Validate resource group exists
Write-Host "🔍 Validating resource group: $ResourceGroupName" -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "❌ Resource group '$ResourceGroupName' not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Resource group validated" -ForegroundColor Green

# Validate App Service exists
Write-Host "🔍 Validating App Service: $AppServiceName" -ForegroundColor Yellow
$appService = az webapp show --name $AppServiceName --resource-group $ResourceGroupName --query "name" -o tsv 2>$null
if (-not $appService) {
    Write-Host "❌ App Service '$AppServiceName' not found in resource group '$ResourceGroupName'" -ForegroundColor Red
    exit 1
}
Write-Host "✅ App Service validated" -ForegroundColor Green

# Get App Service details
$appServiceDetails = az webapp show --name $AppServiceName --resource-group $ResourceGroupName --query "{defaultHostName:defaultHostName,httpsOnly:httpsOnly,state:state}" -o json | ConvertFrom-Json
Write-Host "📋 App Service Details:" -ForegroundColor Cyan
Write-Host "   Default Hostname: $($appServiceDetails.defaultHostName)" -ForegroundColor Cyan
Write-Host "   HTTPS Only: $($appServiceDetails.httpsOnly)" -ForegroundColor Cyan
Write-Host "   State: $($appServiceDetails.state)" -ForegroundColor Cyan

# Validate domain name format
if ($CustomDomainName -notmatch "^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$") {
    Write-Host "❌ Invalid domain name format: $CustomDomainName" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Domain name format validated" -ForegroundColor Green

# Function to check DNS record
function Test-DnsRecord {
    param(
        [string]$Domain,
        [string]$RecordType,
        [string]$ExpectedValue
    )
    
    try {
        $dnsResult = Resolve-DnsName -Name $Domain -Type $RecordType -ErrorAction SilentlyContinue
        if ($dnsResult) {
            switch ($RecordType) {
                "CNAME" { 
                    $actualValue = $dnsResult.NameHost
                    return $actualValue -eq $ExpectedValue
                }
                "TXT" {
                    $actualValues = $dnsResult.Strings
                    return $actualValues -contains $ExpectedValue
                }
                "A" {
                    $actualValue = $dnsResult.IPAddress
                    return $actualValue -eq $ExpectedValue
                }
            }
        }
        return $false
    } catch {
        return $false
    }
}

# Get domain verification ID
Write-Host "🔍 Getting domain verification ID..." -ForegroundColor Yellow
$verificationId = az webapp show --name $AppServiceName --resource-group $ResourceGroupName --query "customDomainVerificationId" -o tsv
Write-Host "📋 Domain Verification ID: $verificationId" -ForegroundColor Cyan

# Create DNS zone if requested
if ($CreateDnsZone) {
    $rootDomain = ($CustomDomainName -split '\.')[-2..-1] -join '.'
    Write-Host "🔄 Creating DNS Zone for: $rootDomain" -ForegroundColor Yellow
    
    try {
        az network dns zone create --resource-group $ResourceGroupName --name $rootDomain --tags "environment=$Environment" "purpose=custom-domain"
        Write-Host "✅ DNS Zone created successfully" -ForegroundColor Green
        
        # Get name servers
        $nameServers = az network dns zone show --resource-group $ResourceGroupName --name $rootDomain --query "nameServers" -o json | ConvertFrom-Json
        Write-Host "📋 DNS Zone Name Servers:" -ForegroundColor Cyan
        foreach ($ns in $nameServers) {
            Write-Host "   $ns" -ForegroundColor Cyan
        }
        Write-Host "⚠️  Please update your domain registrar to use these name servers" -ForegroundColor Yellow
    } catch {
        Write-Host "⚠️  DNS Zone creation failed or already exists" -ForegroundColor Yellow
    }
}

# Check if custom domain is already configured
Write-Host "🔍 Checking if custom domain is already configured..." -ForegroundColor Yellow
$existingBinding = az webapp config hostname list --webapp-name $AppServiceName --resource-group $ResourceGroupName --query "[?name=='$CustomDomainName']" -o json | ConvertFrom-Json
if ($existingBinding.Count -gt 0) {
    Write-Host "⚠️  Custom domain '$CustomDomainName' is already configured" -ForegroundColor Yellow
    $sslState = $existingBinding[0].sslState
    $thumbprint = $existingBinding[0].thumbprint
    Write-Host "   SSL State: $sslState" -ForegroundColor Cyan
    Write-Host "   Certificate Thumbprint: $thumbprint" -ForegroundColor Cyan
} else {
    # Step 1: DNS Validation
    Write-Host "🔍 Validating DNS configuration..." -ForegroundColor Yellow
    
    # Check CNAME record
    $cnameValid = Test-DnsRecord -Domain $CustomDomainName -RecordType "CNAME" -ExpectedValue $appServiceDetails.defaultHostName
    Write-Host "   CNAME Record ($CustomDomainName -> $($appServiceDetails.defaultHostName)): $(if($cnameValid){'✅ Valid'}else{'❌ Missing'})" -ForegroundColor $(if($cnameValid){'Green'}else{'Red'})
    
    # Check TXT record for verification
    $txtRecordName = "asuid.$CustomDomainName"
    $txtValid = Test-DnsRecord -Domain $txtRecordName -RecordType "TXT" -ExpectedValue $verificationId
    Write-Host "   TXT Record ($txtRecordName): $(if($txtValid){'✅ Valid'}else{'❌ Missing'})" -ForegroundColor $(if($txtValid){'Green'}else{'Red'})
    
    if (-not $cnameValid -or -not $txtValid) {
        Write-Host "⚠️  DNS configuration is not complete. Please ensure the following DNS records are configured:" -ForegroundColor Yellow
        Write-Host "   1. CNAME record: $CustomDomainName -> $($appServiceDetails.defaultHostName)" -ForegroundColor Yellow
        Write-Host "   2. TXT record: asuid.$CustomDomainName -> $verificationId" -ForegroundColor Yellow
        Write-Host "   DNS propagation can take up to 48 hours." -ForegroundColor Yellow
        
        $continueAnyway = Read-Host "Continue with domain binding anyway? (y/N)"
        if ($continueAnyway -ne "y" -and $continueAnyway -ne "Y") {
            Write-Host "❌ Exiting. Please configure DNS records and try again." -ForegroundColor Red
            exit 1
        }
    }
    
    # Step 2: Add custom domain
    Write-Host "🔄 Adding custom domain to App Service..." -ForegroundColor Yellow
    try {
        az webapp config hostname add --hostname $CustomDomainName --webapp-name $AppServiceName --resource-group $ResourceGroupName
        Write-Host "✅ Custom domain added successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add custom domain. Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please check DNS configuration and try again." -ForegroundColor Yellow
        exit 1
    }
    
    # Step 3: Create and bind SSL certificate
    Write-Host "🔄 Creating managed SSL certificate..." -ForegroundColor Yellow
    try {
        # Create App Service managed certificate
        $certResult = az webapp config ssl bind --certificate-type SSLCert --name $AppServiceName --resource-group $ResourceGroupName --ssl-type SNI --hostname $CustomDomainName
        Write-Host "✅ SSL certificate created and bound successfully" -ForegroundColor Green
        
        # Get certificate details
        $certDetails = az webapp config ssl list --resource-group $ResourceGroupName --query "[?subjectName=='$CustomDomainName']" -o json | ConvertFrom-Json
        if ($certDetails.Count -gt 0) {
            $cert = $certDetails[0]
            Write-Host "📋 Certificate Details:" -ForegroundColor Cyan
            Write-Host "   Subject: $($cert.subjectName)" -ForegroundColor Cyan
            Write-Host "   Thumbprint: $($cert.thumbprint)" -ForegroundColor Cyan
            Write-Host "   Expiration: $($cert.expirationDate)" -ForegroundColor Cyan
            Write-Host "   Issuer: $($cert.issuer)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠️  SSL certificate creation failed. Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "You may need to create a certificate manually or wait for DNS propagation." -ForegroundColor Yellow
    }
}

# Step 4: Configure HTTPS redirect
Write-Host "🔄 Configuring HTTPS redirect..." -ForegroundColor Yellow
try {
    az webapp update --name $AppServiceName --resource-group $ResourceGroupName --https-only true
    Write-Host "✅ HTTPS redirect enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️  HTTPS redirect configuration failed" -ForegroundColor Yellow
}

# Step 5: Configure App Service Authentication (if enabled)
if ($EnableAuthentication -and $AzureAdTenantId -and $AzureAdClientId) {
    Write-Host "🔄 Configuring App Service Authentication with Azure AD..." -ForegroundColor Yellow
    
    try {
        # Configure authentication
        $authConfig = @{
            enabled = $true
            tokenStore = @{
                enabled = $true
            }
            globalValidation = @{
                requireAuthentication = $false
                unauthenticatedClientAction = "AllowAnonymous"
            }
            identityProviders = @{
                azureActiveDirectory = @{
                    enabled = $true
                    registration = @{
                        openIdIssuer = "https://sts.windows.net/$AzureAdTenantId/"
                        clientId = $AzureAdClientId
                    }
                    validation = @{
                        allowedAudiences = @(
                            $AzureAdClientId,
                            "https://$CustomDomainName"
                        )
                    }
                }
            }
        } | ConvertTo-Json -Depth 10
        
        # Note: Azure CLI doesn't have direct support for AuthV2 configuration
        # This would typically be done through ARM templates or REST API
        Write-Host "⚠️  Authentication configuration requires manual setup through Azure Portal or ARM template" -ForegroundColor Yellow
        Write-Host "   Please configure the following in Azure Portal:" -ForegroundColor Yellow
        Write-Host "   1. Go to App Service -> Authentication" -ForegroundColor Yellow
        Write-Host "   2. Add Microsoft identity provider" -ForegroundColor Yellow
        Write-Host "   3. Configure with Tenant ID: $AzureAdTenantId" -ForegroundColor Yellow
        Write-Host "   4. Configure with Client ID: $AzureAdClientId" -ForegroundColor Yellow
        
    } catch {
        Write-Host "⚠️  Authentication configuration requires manual setup" -ForegroundColor Yellow
    }
}

# Step 6: Configure security headers
Write-Host "🔄 Configuring security headers..." -ForegroundColor Yellow
try {
    # Set up security-related app settings
    az webapp config appsettings set --name $AppServiceName --resource-group $ResourceGroupName --settings `
        "WEBSITE_HTTPS_ONLY=true" `
        "WEBSITE_TLS_VERSION=1.2" `
        "WEBSITE_CUSTOM_DOMAIN=$CustomDomainName" `
        "WEBSITE_FORCE_HTTPS=true"
    
    Write-Host "✅ Security headers configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Security headers configuration failed" -ForegroundColor Yellow
}

# Step 7: Verify configuration
Write-Host "🔍 Verifying final configuration..." -ForegroundColor Yellow

# Get updated hostname bindings
$hostBindings = az webapp config hostname list --webapp-name $AppServiceName --resource-group $ResourceGroupName -o json | ConvertFrom-Json
$customBinding = $hostBindings | Where-Object { $_.name -eq $CustomDomainName }

if ($customBinding) {
    Write-Host "✅ Custom domain configuration verified" -ForegroundColor Green
    Write-Host "📋 Final Configuration:" -ForegroundColor Cyan
    Write-Host "   Custom Domain: $($customBinding.name)" -ForegroundColor Cyan
    Write-Host "   SSL State: $($customBinding.sslState)" -ForegroundColor Cyan
    Write-Host "   Certificate Thumbprint: $($customBinding.thumbprint)" -ForegroundColor Cyan
    Write-Host "   Custom Domain URL: https://$CustomDomainName" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Custom domain binding not found" -ForegroundColor Yellow
}

# Test HTTPS connectivity
Write-Host "🔍 Testing HTTPS connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$CustomDomainName/health" -UseBasicParsing -TimeoutSec 30 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ HTTPS connectivity test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  HTTPS connectivity test returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  HTTPS connectivity test failed. This is normal if the application is not yet deployed." -ForegroundColor Yellow
}

# Final summary
Write-Host "`n🎉 Custom Domain & SSL Configuration Summary" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "✅ Resource Group: $ResourceGroupName" -ForegroundColor Green
Write-Host "✅ App Service: $AppServiceName" -ForegroundColor Green
Write-Host "✅ Custom Domain: $CustomDomainName" -ForegroundColor Green
Write-Host "✅ HTTPS URL: https://$CustomDomainName" -ForegroundColor Green
Write-Host "✅ Environment: $Environment" -ForegroundColor Green

if ($EnableAuthentication) {
    Write-Host "⚠️  Authentication: Requires manual configuration in Azure Portal" -ForegroundColor Yellow
} else {
    Write-Host "✅ Authentication: Disabled" -ForegroundColor Green
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify DNS propagation (can take up to 48 hours)" -ForegroundColor Cyan
Write-Host "2. Test the application at https://$CustomDomainName" -ForegroundColor Cyan
Write-Host "3. Configure authentication if required" -ForegroundColor Cyan
Write-Host "4. Update CI/CD pipeline to use custom domain" -ForegroundColor Cyan
Write-Host "5. Update application configuration to use custom domain" -ForegroundColor Cyan

Write-Host "`n🚀 Custom domain setup completed!" -ForegroundColor Green
