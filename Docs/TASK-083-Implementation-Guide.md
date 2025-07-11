# TASK-083 Implementation Guide

## Create Azure Resource Group and Configure Service Principal for GitHub Actions Deployment

This guide implements **TASK-083** by providing automated scripts and documentation for setting up Azure infrastructure and GitHub Actions deployment.

## 🎯 Objectives

1. ✅ Create Azure Resource Group with proper naming convention
2. ✅ Configure Service Principal with appropriate permissions
3. ✅ Set up GitHub Actions deployment pipeline
4. ✅ Validate infrastructure setup
5. ✅ Document configuration steps

## 📋 Prerequisites

Before starting, ensure you have:

- Azure CLI installed and authenticated
- GitHub repository with admin access
- Azure subscription with Contributor permissions
- PowerShell 7+ (recommended)

## 🚀 Quick Start

### Step 1: Run Setup Script

```powershell
# Navigate to Scripts directory
cd "Scripts"

# Execute setup script with your parameters
.\Setup-AzureInfrastructure.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-dev-aue" `
    -Location "australiaeast" `
    -ServicePrincipalName "sp-networkingapp-github-actions" `
    -Environment "dev"
```

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Value Source | Description |
|-------------|--------------|-------------|
| `AZURE_CLIENT_ID` | Service Principal App ID | Authentication ID |
| `AZURE_CLIENT_SECRET` | Service Principal Password | Authentication secret |
| `AZURE_TENANT_ID` | Azure Tenant ID | Directory identifier |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | Target subscription |
| `AZURE_RESOURCE_GROUP` | Resource Group Name | Target resource group |
| `AZURE_ENV_NAME` | Environment name (dev/test/prod) | Deployment environment |
| `AZURE_LOCATION` | Azure region (australiaeast) | Resource location |

### Step 3: Validate Setup

```powershell
# Run validation script
.\Validate-AzureSetup.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-dev-aue" `
    -ServicePrincipalName "sp-networkingapp-github-actions"
```

## 📁 Files Created

### Scripts
- `Setup-AzureInfrastructure.ps1` - Main setup script
- `Validate-AzureSetup.ps1` - Validation script

### Documentation
- `Azure-Infrastructure-Setup.md` - Detailed setup guide
- `TASK-083-Implementation-Guide.md` - This implementation guide

### Configuration
- Updated `azure.yaml` - Azure Developer CLI configuration
- Updated `.github/workflows/azure-deploy.yml` - GitHub Actions workflow

## 🔧 Configuration Details

### Resource Naming Convention

Following Azure naming best practices:

- **Resource Group**: `rg-networkingapp-{environment}-{region-code}`
  - Example: `rg-networkingapp-dev-aue` (Australia East)
- **Service Principal**: `sp-networkingapp-github-actions`
- **App Service**: `app-networkingapp-{environment}-{region-code}`

### Service Principal Permissions

The service principal is configured with these roles:

1. **Contributor** - Core resource management
2. **Key Vault Contributor** - Secrets management
3. **Web Plan Contributor** - App Service plans
4. **Website Contributor** - Application deployment

### Security Best Practices

- ✅ Principle of least privilege
- ✅ Resource group scoped permissions
- ✅ Environment-specific service principals
- ✅ Secure credential storage in GitHub Secrets

## 🔍 Validation

The validation script checks:

1. ✅ Azure CLI installation and authentication
2. ✅ Subscription access
3. ✅ Resource group existence
4. ✅ Service principal configuration
5. ✅ Role assignments
6. ✅ Azure Developer CLI installation
7. ✅ Bicep template syntax
8. ✅ GitHub Actions workflow files

## 🐛 Troubleshooting

### Common Issues

1. **Insufficient Azure Permissions**
   ```
   Error: AuthorizationFailed
   ```
   **Solution**: Ensure you have Contributor or Owner role

2. **Service Principal Already Exists**
   ```
   Error: Another object with the same value for property displayName already exists
   ```
   **Solution**: Script handles this automatically

3. **GitHub Secrets Not Working**
   ```
   Error: Context access might be invalid
   ```
   **Solution**: Verify all required secrets are configured in GitHub

### Debug Commands

```powershell
# Check current Azure context
az account show

# List service principals
az ad sp list --display-name "sp-networkingapp-github-actions"

# Check role assignments
az role assignment list --assignee "your-app-id" --resource-group "your-rg"

# Test service principal login
az login --service-principal --username "app-id" --password "secret" --tenant "tenant-id"
```

## ✅ Success Criteria

TASK-083 is complete when:

1. ✅ Azure Resource Group created successfully
2. ✅ Service Principal configured with proper permissions
3. ✅ GitHub Secrets configured in repository
4. ✅ Validation script passes all checks
5. ✅ GitHub Actions workflow can authenticate to Azure
6. ✅ Azure Developer CLI can provision resources

## 🔄 Next Steps

After completing TASK-083:

1. **TASK-084**: Set up Azure App Service with .NET 8 runtime
2. **TASK-085**: Configure Azure SQL Database
3. **TASK-086**: Set up Azure Key Vault
4. **TASK-090**: Implement GitHub Actions CI/CD pipeline

## 📚 References

- [Azure Service Principal Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)
- [GitHub Actions Azure Integration](https://docs.github.com/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure)
- [Azure Developer CLI Documentation](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Azure Naming Conventions](https://docs.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/naming-and-tagging)
