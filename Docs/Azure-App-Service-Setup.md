# Azure App Service Configuration Guide

This guide covers **TASK-084**: Set up Azure App Service with .NET 8 runtime and configure deployment slots for staging/production.

## 🎯 Overview

This implementation provides a comprehensive Azure App Service setup with:

- ✅ .NET 8.0 runtime configuration
- ✅ Multi-environment support (dev/test/prod)
- ✅ Deployment slots for staging and testing
- ✅ Auto-scaling configuration
- ✅ Security best practices
- ✅ Automated deployment scripts

## 📋 Prerequisites

- Azure CLI installed and authenticated
- .NET 8 SDK installed
- Node.js 18+ (for frontend builds)
- PowerShell 7+ (recommended)
- Completed TASK-083 (Resource Group and Service Principal)

## 🚀 Quick Start

### Step 1: Deploy App Service Infrastructure

```powershell
# Navigate to Scripts directory
cd "Scripts"

# Deploy App Service for development environment
.\Deploy-AppService.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-dev-aue" `
    -Environment "dev" `
    -EnableDeploymentSlots

# Deploy for production environment
.\Deploy-AppService.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-prod-aue" `
    -Environment "prod" `
    -EnableDeploymentSlots
```

### Step 2: Manage Deployment Slots

```powershell
# Check current slot status
.\Manage-DeploymentSlots.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-prod-aue" `
    -AppServiceName "app-networkingapp-prod-aue" `
    -Action "status"

# Swap staging to production
.\Manage-DeploymentSlots.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-prod-aue" `
    -AppServiceName "app-networkingapp-prod-aue" `
    -Action "swap" `
    -SourceSlot "staging" `
    -TargetSlot "production"
```

## 🏗️ Architecture Details

### App Service Plan Configuration

| Environment | SKU | Tier | Capacity | Auto-scaling |
|-------------|-----|------|----------|--------------|
| **dev** | B1 | Basic | 1 | Disabled |
| **test** | S1 | Standard | 1 | Disabled |
| **prod** | P1v3 | PremiumV3 | 2 | Enabled |

### Deployment Slots

#### Development Environment
- **Production**: Main application slot
- **Staging**: Pre-production testing

#### Test Environment
- **Production**: Main application slot
- **Staging**: Integration testing
- **Testing**: Feature testing

#### Production Environment
- **Production**: Live application
- **Staging**: Pre-production validation with auto-swap

### Runtime Configuration

- **Framework**: .NET 8.0 (Linux containers)
- **Platform**: Linux (Azure App Service on Linux)
- **Always On**: Enabled for production, disabled for dev/test
- **HTTPS Only**: Enforced across all environments
- **Minimum TLS**: 1.2
- **HTTP/2**: Enabled
- **WebSockets**: Enabled for SignalR support

### Security Features

- **Managed Identity**: System-assigned for each slot
- **FTPS**: Disabled for enhanced security
- **Remote Debugging**: Disabled in production
- **IP Restrictions**: Configurable per environment
- **CORS**: Pre-configured for trusted origins

## ⚙️ Configuration Management

### Environment Variables

Each environment and slot has specific configuration:

#### Common Settings
```bash
WEBSITE_RUN_FROM_PACKAGE=1
WEBSITE_ENABLE_SYNC_UPDATE_SITE=true
WEBSITE_HTTPLOGGING_RETENTION_DAYS=30
WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
WEBSITE_HEALTHCHECK_MAXPINGFAILURES=10
SCM_DO_BUILD_DURING_DEPLOYMENT=false
WEBSITES_PORT=8080
```

#### Environment-Specific Settings
```bash
# Production
ASPNETCORE_ENVIRONMENT=Production
WEBSITE_TIME_ZONE=New Zealand Standard Time

# Staging
ASPNETCORE_ENVIRONMENT=Staging
SLOT_NAME=staging

# Testing
ASPNETCORE_ENVIRONMENT=Testing
SLOT_NAME=testing
```

### Application Insights Integration

When Application Insights is configured:
```bash
APPLICATIONINSIGHTS_CONNECTION_STRING=[connection-string]
ApplicationInsightsAgent_EXTENSION_VERSION=~3
XDT_MicrosoftApplicationInsights_Mode=Recommended
```

## 🔄 Deployment Strategies

### Blue-Green Deployment (Production)

1. **Deploy to Staging**: New version deployed to staging slot
2. **Validation**: Run tests against staging environment
3. **Swap**: Promote staging to production with zero downtime
4. **Monitoring**: Monitor production metrics post-deployment
5. **Rollback**: Quick swap back if issues detected

### Feature Branch Deployment (Test)

1. **Deploy to Testing**: Feature branches deployed to testing slot
2. **Integration Testing**: Run comprehensive test suites
3. **Promote to Staging**: Successful features moved to staging
4. **Final Validation**: User acceptance testing on staging

### Development Workflow

1. **Direct Deployment**: Deploy directly to development production slot
2. **Staging Validation**: Test integration points on staging
3. **Manual Promotion**: Manual approval to move to test environment

## 📊 Auto-scaling Configuration

### Production Auto-scaling Rules

#### Default Profile
- **Minimum Instances**: 2
- **Maximum Instances**: 10
- **Default Instances**: 2

#### Scale-Out Rules
- **CPU > 70%**: Add 1 instance (10min cooldown)
- **Memory > 80%**: Add 1 instance (10min cooldown)

#### Scale-In Rules
- **CPU < 30%**: Remove 1 instance (10min cooldown)

#### Peak Hours Profile
- **Schedule**: Monday-Friday, 6-8 AM and 5-7 PM (NZST)
- **Minimum Instances**: 3
- **Maximum Instances**: 15
- **Default Instances**: 3
- **Aggressive Scaling**: CPU > 60% → Add 2 instances (5min cooldown)

## 🏥 Health Monitoring

### Health Check Endpoint

The application exposes a health check endpoint at `/health`:

```csharp
// In Program.cs
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### Monitoring Configuration

- **Health Check Path**: `/health`
- **Max Ping Failures**: 10
- **HTTP Logging**: Enabled with 30-day retention
- **Detailed Error Logging**: Enabled for non-production

## 🔧 Management Commands

### Common Operations

```powershell
# Check deployment status
az webapp show --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"

# View application logs
az webapp log tail --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"

# Restart application
az webapp restart --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"

# Scale manually
az appservice plan update --name "asp-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue" --sku P2v3

# List deployment slots
az webapp deployment slot list --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"
```

### Slot Management

```powershell
# Create new slot
az webapp deployment slot create --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue" --slot "hotfix"

# Configure slot settings
az webapp config appsettings set --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue" --slot "hotfix" --settings "ASPNETCORE_ENVIRONMENT=Hotfix"

# Delete slot
az webapp deployment slot delete --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue" --slot "hotfix"
```

## 🐛 Troubleshooting

### Common Issues

1. **Deployment Failures**
   ```bash
   # Check deployment logs
   az webapp log deployment show --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"
   ```

2. **Application Start Issues**
   ```bash
   # Check application logs
   az webapp log tail --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"
   ```

3. **Performance Issues**
   ```bash
   # Check metrics
   az monitor metrics list --resource "/subscriptions/SUBSCRIPTION-ID/resourceGroups/rg-networkingapp-prod-aue/providers/Microsoft.Web/sites/app-networkingapp-prod-aue"
   ```

4. **Slot Swap Issues**
   ```bash
   # Check swap history
   az webapp deployment slot list --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"
   ```

### Debug Commands

```powershell
# Enable application logging
az webapp log config --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue" --application-logging filesystem

# Download logs
az webapp log download --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue" --log-file "app-logs.zip"

# Check configuration
az webapp config show --name "app-networkingapp-prod-aue" --resource-group "rg-networkingapp-prod-aue"
```

## ✅ Validation Checklist

- [ ] App Service Plan created with correct SKU
- [ ] App Service configured with .NET 8.0 runtime
- [ ] Deployment slots created and configured
- [ ] Health check endpoint responding
- [ ] HTTPS-only access enforced
- [ ] Managed identity enabled
- [ ] Auto-scaling rules configured (production)
- [ ] Application Insights connected
- [ ] Deployment automation working
- [ ] Slot swap functionality tested

## 🔄 Next Steps

After completing TASK-084:

1. **TASK-085**: Configure Azure SQL Database
2. **TASK-086**: Set up Azure Key Vault for secrets
3. **TASK-087**: Configure Application Insights monitoring
4. **TASK-090**: Implement CI/CD pipeline

## 📚 References

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Deployment Slots Documentation](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots)
- [.NET 8 on Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/configure-language-dotnetcore)
- [Auto-scaling in Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/manage-scale-up)
