# Azure Infrastructure Setup Guide

This guide covers **TASK-083**: Create Azure Resource Group and configure service principal for GitHub Actions deployment.

## Prerequisites

Before running the setup script, ensure you have:

1. **Azure CLI installed and authenticated**
   ```powershell
   # Install Azure CLI (if not already installed)
   winget install Microsoft.AzureCLI
   
   # Login to Azure
   az login
   
   # List available subscriptions
   az account list --output table
   ```

2. **Appropriate Azure permissions**
   - Subscription Contributor or Owner role
   - Azure Active Directory permissions to create service principals

3. **PowerShell 7+ (recommended)**
   ```powershell
   # Check PowerShell version
   $PSVersionTable.PSVersion
   ```

## Quick Setup

### Step 1: Run the Setup Script

```powershell
# Navigate to the Scripts directory
cd "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp\Scripts"

# Run the setup script (replace with your actual values)
.\Setup-AzureInfrastructure.ps1 `
    -SubscriptionId "your-subscription-id" `
    -ResourceGroupName "rg-networkingapp-dev-aue" `
    -Location "australiaeast" `
    -ServicePrincipalName "sp-networkingapp-github-actions" `
    -Environment "dev"
```

### Step 2: Copy Service Principal Credentials

The script will output service principal credentials. **Copy these immediately** as the client secret cannot be retrieved later.

### Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CLIENT_ID` | Service Principal App ID |
| `AZURE_CLIENT_SECRET` | Service Principal Password |
| `AZURE_TENANT_ID` | Azure Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID |
| `AZURE_RESOURCE_GROUP` | Resource Group Name |
| `AZURE_ENV_NAME` | Environment Name (dev/test/prod) |
| `AZURE_LOCATION` | Azure Region |

## Detailed Configuration

### Resource Naming Convention

The script follows Azure naming conventions:

- **Resource Group**: `rg-networkingapp-{env}-{region}`
  - Example: `rg-networkingapp-dev-aue` (Australia East)
- **Service Principal**: `sp-networkingapp-github-actions`

### Azure Permissions

The service principal is automatically configured with these roles:

1. **Contributor** - Deploy and manage Azure resources
2. **Key Vault Contributor** - Manage secrets and certificates
3. **Web Plan Contributor** - Manage App Service plans
4. **Website Contributor** - Deploy applications

### Security Best Practices

1. **Scope Limitation**: Service principal is scoped to the specific resource group only
2. **Principle of Least Privilege**: Only necessary permissions are granted
3. **Environment Separation**: Use different service principals for different environments

## Verification

### Verify Resource Group Creation

```powershell
az group show --name "rg-networkingapp-dev-aue" --output table
```

### Verify Service Principal

```powershell
az ad sp list --display-name "sp-networkingapp-github-actions" --output table
```

### Test Service Principal Authentication

```powershell
# Test login with service principal
az login --service-principal `
    --username "your-app-id" `
    --password "your-client-secret" `
    --tenant "your-tenant-id"

# Verify access to resource group
az group show --name "rg-networkingapp-dev-aue"
```

## Azure Developer CLI Integration

The setup is designed to work with Azure Developer CLI (azd):

### Initialize AZD Environment

```powershell
# Navigate to project root
cd "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"

# Initialize azd environment
azd init

# Set environment variables
azd env set AZURE_LOCATION "australiaeast"
azd env set AZURE_SUBSCRIPTION_ID "your-subscription-id"
```

### Deploy Infrastructure

```powershell
# Provision Azure resources using Bicep templates
azd provision

# Deploy application
azd deploy
```

## Troubleshooting

### Common Issues

1. **Insufficient Permissions**
   ```
   Error: (AuthorizationFailed) The client does not have authorization to perform action
   ```
   **Solution**: Ensure you have Contributor or Owner role on the subscription

2. **Service Principal Already Exists**
   ```
   Error: Another object with the same value for property displayName already exists
   ```
   **Solution**: The script handles this automatically and will use the existing service principal

3. **Invalid Subscription ID**
   ```
   Error: The subscription was not found
   ```
   **Solution**: Verify subscription ID with `az account list`

### Cleanup (if needed)

```powershell
# Delete service principal
az ad sp delete --id "your-app-id"

# Delete resource group (WARNING: This deletes all resources)
az group delete --name "rg-networkingapp-dev-aue" --yes
```

## Next Steps

After completing TASK-083:

1. **TASK-084**: Set up Azure App Service with .NET 8 runtime
2. **TASK-085**: Configure Azure SQL Database
3. **TASK-086**: Set up Azure Key Vault
4. **TASK-090**: Implement GitHub Actions CI/CD pipeline

## Related Resources

- [Azure Developer CLI Documentation](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Azure Service Principal Best Practices](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)
- [GitHub Actions Azure Integration](https://docs.github.com/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure)
