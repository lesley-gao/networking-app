# 🌐 Custom Domain & SSL Certificate Configuration Guide

## TASK-091: Configure custom domain with SSL certificate and Azure App Service authentication

This guide provides comprehensive instructions for configuring a custom domain with SSL certificate and Azure App Service authentication for the Flight Companion Platform.

## 📋 Overview

The custom domain configuration includes:
- **Custom Domain Binding**: Configure your own domain (e.g., flightcompanion.com)
- **SSL Certificate Management**: Automatic SSL certificate provisioning and renewal
- **Azure App Service Authentication**: Optional integration with Azure Active Directory
- **DNS Zone Management**: Optional Azure DNS zone creation and management
- **Security Headers**: Enhanced security configuration with HTTPS enforcement

## 🏗️ Architecture Components

### Infrastructure Components
- **Azure DNS Zone** (Optional): Manages DNS records for your domain
- **App Service Managed Certificate**: Free SSL certificate with auto-renewal
- **Custom Domain Binding**: Links your domain to the App Service
- **Azure AD Authentication** (Optional): Enterprise authentication integration

### Security Features
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirection
- **TLS 1.2 Minimum**: Modern encryption standards
- **Security Headers**: HSTS, XSS protection, content type options
- **Content Security Policy**: Protection against XSS attacks

## 🚀 Quick Start

### 1. Basic Custom Domain Setup (Production)

```powershell
# Navigate to the scripts directory
cd "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp\Scripts"

# Run the custom domain setup script
.\Setup-CustomDomain.ps1 -ResourceGroupName "rg-netapp-prod" -AppServiceName "app-netapp-prod-aue" -CustomDomainName "flightcompanion.com" -Environment "prod"
```

### 2. Advanced Setup with Authentication

```powershell
.\Setup-CustomDomain.ps1 `
  -ResourceGroupName "rg-netapp-prod" `
  -AppServiceName "app-netapp-prod-aue" `
  -CustomDomainName "flightcompanion.com" `
  -Environment "prod" `
  -EnableAuthentication $true `
  -AzureAdTenantId "your-tenant-id" `
  -AzureAdClientId "your-client-id"
```

### 3. Deploy with Bicep Templates

```powershell
# Deploy with custom domain enabled
az deployment group create `
  --resource-group "rg-netapp-prod" `
  --template-file "infra/bicep/main.bicep" `
  --parameters "infra/bicep/parameters/main.prod.json" `
  --parameters customDomainName="flightcompanion.com" enableCustomDomain=true
```

## 📚 Detailed Configuration Guide

### Prerequisites

#### 1. Domain Requirements
- **Domain Ownership**: You must own the domain you want to configure
- **DNS Access**: Ability to modify DNS records for your domain
- **Domain Registrar**: Access to your domain registrar's control panel

#### 2. Azure Requirements
- **Azure Subscription**: Active Azure subscription with appropriate permissions
- **App Service**: Existing App Service (created by previous tasks)
- **Resource Group**: Resource group containing your App Service

#### 3. Azure AD Requirements (Optional)
- **Azure AD Tenant**: For authentication integration
- **App Registration**: Azure AD application registration
- **Client Credentials**: Client ID and Client Secret

### Step-by-Step Configuration

#### Step 1: DNS Configuration

Before configuring the custom domain in Azure, you need to set up DNS records:

##### Required DNS Records

1. **CNAME Record** (for subdomains):
   ```
   Name: www (or your subdomain)
   Type: CNAME
   Value: app-netapp-prod-aue.azurewebsites.net
   TTL: 3600
   ```

2. **TXT Record** (for domain verification):
   ```
   Name: asuid.www (or asuid.your-subdomain)
   Type: TXT
   Value: [Domain Verification ID from App Service]
   TTL: 3600
   ```

3. **A Record** (for root domain - optional):
   ```
   Name: @
   Type: A
   Value: [App Service IP Address]
   TTL: 3600
   ```

##### DNS Propagation

DNS changes can take 15 minutes to 48 hours to propagate globally. You can check propagation status using:

```powershell
# Check CNAME record
nslookup -type=CNAME your-domain.com

# Check TXT record
nslookup -type=TXT asuid.your-domain.com
```

#### Step 2: Azure Configuration

##### Using PowerShell Script

The provided PowerShell script automates most of the configuration:

```powershell
# Basic configuration
.\Setup-CustomDomain.ps1 `
  -ResourceGroupName "rg-netapp-prod" `
  -AppServiceName "app-netapp-prod-aue" `
  -CustomDomainName "flightcompanion.com" `
  -Environment "prod"

# With DNS zone creation
.\Setup-CustomDomain.ps1 `
  -ResourceGroupName "rg-netapp-prod" `
  -AppServiceName "app-netapp-prod-aue" `
  -CustomDomainName "flightcompanion.com" `
  -Environment "prod" `
  -CreateDnsZone $true
```

##### Using Azure CLI Commands

Manual configuration using Azure CLI:

```bash
# Get domain verification ID
VERIFICATION_ID=$(az webapp show --name "app-netapp-prod-aue" --resource-group "rg-netapp-prod" --query "customDomainVerificationId" -o tsv)

# Add custom domain
az webapp config hostname add \
  --hostname "flightcompanion.com" \
  --webapp-name "app-netapp-prod-aue" \
  --resource-group "rg-netapp-prod"

# Create and bind SSL certificate
az webapp config ssl bind \
  --certificate-type SSLCert \
  --name "app-netapp-prod-aue" \
  --resource-group "rg-netapp-prod" \
  --ssl-type SNI \
  --hostname "flightcompanion.com"

# Enable HTTPS redirect
az webapp update \
  --name "app-netapp-prod-aue" \
  --resource-group "rg-netapp-prod" \
  --https-only true
```

##### Using Bicep Templates

Deploy using the infrastructure as code approach:

```json
// Update parameters file
{
  "customDomainName": {
    "value": "flightcompanion.com"
  },
  "enableCustomDomain": {
    "value": true
  },
  "enableAuthentication": {
    "value": true
  },
  "azureAdTenantId": {
    "value": "your-tenant-id"
  },
  "azureAdClientId": {
    "value": "your-client-id"
  }
}
```

#### Step 3: SSL Certificate Configuration

##### App Service Managed Certificate (Recommended)

App Service Managed Certificates are free and automatically renewed:

- **Cost**: Free
- **Validation**: Domain validation (DV)
- **Renewal**: Automatic
- **Limitations**: Only for App Service, no wildcard support

##### Custom Certificate Upload

For advanced scenarios, you can upload your own certificate:

```bash
# Upload certificate
az webapp config ssl upload \
  --certificate-file "path/to/certificate.pfx" \
  --certificate-password "certificate-password" \
  --name "app-netapp-prod-aue" \
  --resource-group "rg-netapp-prod"

# Bind certificate
az webapp config ssl bind \
  --certificate-thumbprint "certificate-thumbprint" \
  --ssl-type SNI \
  --name "app-netapp-prod-aue" \
  --resource-group "rg-netapp-prod" \
  --hostname "flightcompanion.com"
```

#### Step 4: Azure AD Authentication Setup

##### Azure AD App Registration

1. **Create App Registration**:
   ```bash
   # Create app registration
   az ad app create \
     --display-name "Flight Companion Platform" \
     --homepage "https://flightcompanion.com" \
     --reply-urls "https://flightcompanion.com/.auth/login/aad/callback"
   ```

2. **Configure Authentication**:
   - Set redirect URIs
   - Configure token configuration
   - Set up API permissions

##### App Service Authentication Configuration

Authentication can be configured through:

1. **Azure Portal**: App Service → Authentication
2. **ARM Template**: Using the custom-domain.bicep module
3. **Azure CLI**: Limited support for AuthV2

Example configuration in Azure Portal:
- **Identity Provider**: Microsoft
- **Tenant Type**: Workforce
- **Client ID**: From Azure AD app registration
- **Client Secret**: From Azure AD app registration
- **Allowed Audience**: Your application's Client ID

### Environment-Specific Configuration

#### Development Environment
```json
{
  "customDomainName": "",
  "enableCustomDomain": false,
  "enableAuthentication": false
}
```

#### Test Environment
```json
{
  "customDomainName": "test.flightcompanion.com",
  "enableCustomDomain": true,
  "enableAuthentication": false
}
```

#### Production Environment
```json
{
  "customDomainName": "flightcompanion.com",
  "enableCustomDomain": true,
  "enableAuthentication": true,
  "azureAdTenantId": "production-tenant-id",
  "azureAdClientId": "production-client-id"
}
```

## 🔧 Configuration Examples

### Complete Bicep Deployment

```bash
# Deploy main infrastructure with custom domain
az deployment group create \
  --resource-group "rg-netapp-prod" \
  --template-file "infra/bicep/main.bicep" \
  --parameters @infra/bicep/parameters/main.prod.json \
  --parameters \
    customDomainName="flightcompanion.com" \
    enableCustomDomain=true \
    enableAuthentication=true \
    azureAdTenantId="your-tenant-id" \
    azureAdClientId="your-client-id" \
    azureAdClientSecret="your-client-secret"
```

### PowerShell Deployment Script

```powershell
# Complete setup script
param(
    [string]$Environment = "prod",
    [string]$DomainName = "flightcompanion.com"
)

# Set variables
$ResourceGroupName = "rg-netapp-$Environment"
$AppServiceName = "app-netapp-$Environment-aue"

# Deploy infrastructure
az deployment group create `
  --resource-group $ResourceGroupName `
  --template-file "infra/bicep/main.bicep" `
  --parameters "infra/bicep/parameters/main.$Environment.json" `
  --parameters customDomainName=$DomainName enableCustomDomain=true

# Configure custom domain
.\Scripts\Setup-CustomDomain.ps1 `
  -ResourceGroupName $ResourceGroupName `
  -AppServiceName $AppServiceName `
  -CustomDomainName $DomainName `
  -Environment $Environment
```

## 🔍 Verification and Testing

### Domain Configuration Verification

```powershell
# Check domain binding
az webapp config hostname list \
  --webapp-name "app-netapp-prod-aue" \
  --resource-group "rg-netapp-prod"

# Check SSL certificate
az webapp config ssl list \
  --resource-group "rg-netapp-prod"

# Test HTTPS connectivity
curl -I https://flightcompanion.com/health
```

### DNS Verification

```powershell
# Verify CNAME record
nslookup -type=CNAME flightcompanion.com

# Verify TXT record
nslookup -type=TXT asuid.flightcompanion.com

# Check SSL certificate
openssl s_client -connect flightcompanion.com:443 -servername flightcompanion.com
```

### Security Testing

```powershell
# Test HTTPS redirect
curl -I http://flightcompanion.com

# Test security headers
curl -I https://flightcompanion.com

# SSL Labs test (external)
# Visit: https://www.ssllabs.com/ssltest/
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### DNS Issues

**Problem**: Domain verification fails
```
Error: The custom domain cannot be verified
```

**Solution**:
1. Verify DNS records are correctly configured
2. Check DNS propagation status
3. Wait for full DNS propagation (up to 48 hours)
4. Verify the domain verification ID is correct

#### SSL Certificate Issues

**Problem**: SSL certificate creation fails
```
Error: Unable to create managed certificate
```

**Solution**:
1. Ensure domain is properly validated
2. Check that CNAME record points to App Service
3. Verify App Service is running and accessible
4. Try manual certificate creation

#### Authentication Issues

**Problem**: Azure AD authentication not working
```
Error: AADSTS50011: The reply URL specified in the request does not match
```

**Solution**:
1. Verify redirect URLs in Azure AD app registration
2. Check that the custom domain is included in allowed URLs
3. Ensure App Service authentication is properly configured
4. Verify client ID and tenant ID are correct

### Debug Commands

```powershell
# Get App Service configuration
az webapp config show --name "app-netapp-prod-aue" --resource-group "rg-netapp-prod"

# Get authentication settings
az webapp auth show --name "app-netapp-prod-aue" --resource-group "rg-netapp-prod"

# Check App Service logs
az webapp log tail --name "app-netapp-prod-aue" --resource-group "rg-netapp-prod"

# Get custom domain verification ID
az webapp show --name "app-netapp-prod-aue" --resource-group "rg-netapp-prod" --query "customDomainVerificationId"
```

## 📊 Monitoring and Maintenance

### SSL Certificate Monitoring

Azure App Service Managed Certificates automatically renew, but you should monitor:

```bash
# Check certificate expiration
az webapp config ssl list \
  --resource-group "rg-netapp-prod" \
  --query "[].{name:subjectName,expiration:expirationDate,thumbprint:thumbprint}"
```

### Domain Health Monitoring

```bash
# Create Application Insights availability test
az monitor app-insights web-test create \
  --resource-group "rg-netapp-prod" \
  --application-insights "ai-netapp-prod-aue" \
  --name "custom-domain-availability" \
  --location "australiaeast" \
  --web-test-url "https://flightcompanion.com/health"
```

### Automated Renewal Verification

Set up alerts for certificate expiration:

```bash
# Create alert rule for certificate expiration
az monitor metrics alert create \
  --name "ssl-certificate-expiration" \
  --resource-group "rg-netapp-prod" \
  --scopes "/subscriptions/{subscription-id}/resourceGroups/rg-netapp-prod/providers/Microsoft.Web/sites/app-netapp-prod-aue" \
  --condition "count < 30" \
  --description "SSL certificate expires in less than 30 days"
```

## 🔄 CI/CD Integration

### GitHub Actions Updates

Update your CI/CD pipeline to use the custom domain:

```yaml
# Update deployment validation
- name: Validate Custom Domain
  run: |
    curl -f https://flightcompanion.com/health
    
# Update smoke tests
- name: Run Smoke Tests
  run: |
    npm test -- --testMatch="**/smoke/**/*.test.ts"
  env:
    API_BASE_URL: https://flightcompanion.com
```

### Application Configuration Updates

Update application settings to use custom domain:

```json
{
  "BaseUrl": "https://flightcompanion.com",
  "AllowedOrigins": ["https://flightcompanion.com"],
  "CorsOrigins": ["https://flightcompanion.com"]
}
```

## 🎯 Best Practices

### Security Best Practices

1. **Always Use HTTPS**: Enable HTTPS-only mode
2. **Strong TLS Version**: Use TLS 1.2 or higher
3. **Security Headers**: Implement HSTS, CSP, and other security headers
4. **Certificate Monitoring**: Monitor certificate expiration
5. **Access Control**: Use Azure AD for authentication when appropriate

### Performance Best Practices

1. **CDN Integration**: Configure CDN with custom domain
2. **Caching Headers**: Set appropriate caching headers
3. **Compression**: Enable gzip compression
4. **HTTP/2**: Enable HTTP/2 support
5. **Connection Limits**: Configure appropriate connection limits

### Operational Best Practices

1. **DNS Redundancy**: Use multiple DNS providers if critical
2. **Certificate Backup**: Keep certificate backups for custom certificates
3. **Monitoring**: Implement comprehensive monitoring and alerting
4. **Documentation**: Keep DNS and certificate documentation up to date
5. **Testing**: Regular testing of failover scenarios

## 📈 Cost Optimization

### Certificate Costs

- **App Service Managed Certificate**: Free
- **Custom Certificate**: $99/year for standard certificates
- **Wildcard Certificate**: $299+/year

### DNS Costs

- **Azure DNS**: ~$0.50 per million queries
- **Third-party DNS**: Varies by provider

### Recommendations

1. Use App Service Managed Certificates for single domains
2. Consider wildcard certificates for multiple subdomains
3. Use Azure DNS for tight Azure integration
4. Monitor DNS query costs for high-traffic applications

## 🚀 Next Steps

After completing TASK-091, you should:

1. **Test Custom Domain**: Verify all functionality works with custom domain
2. **Update Documentation**: Update all documentation with new URLs
3. **Configure Monitoring**: Set up monitoring for the custom domain
4. **Update CI/CD**: Modify deployment pipelines to use custom domain
5. **Proceed to TASK-092**: Set up Azure Monitor alerts

## 📚 Additional Resources

- [Azure App Service Custom Domains](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain)
- [App Service Managed Certificates](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-certificate)
- [Azure DNS Documentation](https://docs.microsoft.com/en-us/azure/dns/)
- [App Service Authentication](https://docs.microsoft.com/en-us/azure/app-service/overview-authentication-authorization)
- [SSL Best Practices](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-bindings)

---

**Configuration Status**: Ready for deployment and testing  
**Estimated Setup Time**: 2-4 hours (including DNS propagation wait time)  
**Security Level**: Enterprise-grade with HTTPS enforcement and optional Azure AD integration
