# Azure Key Vault Setup and Configuration

## Overview

The NetworkingApp uses Azure Key Vault to securely store and manage application secrets, connection strings, and API keys. This document provides comprehensive guidance for setting up, configuring, and using the Key Vault infrastructure.

## Architecture

### Key Vault Components

1. **Azure Key Vault**: Centralized secret management with RBAC-based access control
2. **Managed Identity**: Secure authentication between App Service and Key Vault
3. **Environment-specific Configuration**: Different security tiers and retention policies per environment
4. **Application Integration**: Seamless secret retrieval using Key Vault references

### Security Features

- **RBAC Authorization**: Role-based access control for fine-grained permissions
- **Network Restrictions**: Optional private endpoints and network ACLs
- **Audit Logging**: Comprehensive logging through Azure Monitor
- **Soft Delete Protection**: Configurable retention periods for deleted secrets
- **Purge Protection**: Additional protection for production environments

## Environment Configuration

### Development Environment
- **SKU**: Standard
- **Soft Delete Retention**: 7 days
- **Purge Protection**: Disabled
- **Network Access**: Public with selected networks
- **Purpose**: Development and testing with relaxed security policies

### Test Environment
- **SKU**: Standard
- **Soft Delete Retention**: 30 days
- **Purge Protection**: Disabled
- **Network Access**: Public with selected networks
- **Purpose**: Integration testing with production-like security

### Production Environment
- **SKU**: Premium
- **Soft Delete Retention**: 90 days
- **Purge Protection**: Enabled
- **Network Access**: Private endpoints recommended
- **Purpose**: Production workloads with maximum security

## Application Secrets

The following secrets are managed through Key Vault:

### Core Application Secrets
| Secret Name | Description | Environment |
|-------------|-------------|-------------|
| `JwtSecretKey` | JWT token signing key | All |
| `DefaultConnection` | Database connection string | All |
| `AppInsightsInstrumentationKey` | Application Insights key | All |

### Payment Integration (Stripe)
| Secret Name | Description | Environment |
|-------------|-------------|-------------|
| `StripeSecretKey` | Stripe API secret key | All |
| `StripePublishableKey` | Stripe publishable key | All |
| `StripeWebhookSecret` | Stripe webhook signature secret | All |

### Email Configuration
| Secret Name | Description | Environment |
|-------------|-------------|-------------|
| `EmailSmtpPassword` | SMTP server password | All |

## Deployment Instructions

### Prerequisites

1. **Azure CLI or PowerShell**: Latest version with Azure modules
2. **Bicep CLI**: For infrastructure as code deployment
3. **Azure Permissions**: Contributor and Key Vault Administrator roles
4. **Azure Developer CLI (azd)**: Optional but recommended

### Option 1: Using PowerShell Script (Recommended)

```powershell
# Deploy Key Vault infrastructure
.\Scripts\Manage-KeyVault.ps1 -Action Deploy -Environment dev

# Set application secrets interactively
.\Scripts\Manage-KeyVault.ps1 -Action SetSecrets -Environment dev

# Validate Key Vault access
.\Scripts\Manage-KeyVault.ps1 -Action ValidateAccess -Environment dev
```

### Option 2: Using Azure Developer CLI

```bash
# Set environment
azd env set AZURE_ENV_NAME dev

# Deploy all infrastructure including Key Vault
azd up
```

### Option 3: Manual Bicep Deployment

```powershell
# Deploy to subscription scope
az deployment sub create \
  --location australiaeast \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/parameters/main.dev.json
```

## Secret Management

### Setting Secrets via PowerShell Script

```powershell
# Interactive secret setting
.\Scripts\Manage-KeyVault.ps1 -Action SetSecrets -Environment prod

# Batch secret setting from file
.\Scripts\Manage-KeyVault.ps1 -Action SetSecrets -Environment prod -SecretsFile "secrets-prod.json"

# Generate new JWT secret
.\Scripts\Manage-KeyVault.ps1 -Action GenerateJwtSecret -Environment prod
```

### Setting Secrets via Azure CLI

```bash
# Set individual secrets
az keyvault secret set \
  --vault-name "kv-netapp-prod-1234" \
  --name "StripeSecretKey" \
  --value "sk_live_your_stripe_secret_key"

# Set secret from file
az keyvault secret set \
  --vault-name "kv-netapp-prod-1234" \
  --name "EmailSmtpPassword" \
  --file smtp-password.txt
```

### Secrets File Format

Create a JSON file (e.g., `secrets-prod.json`) with the following structure:

```json
{
  "StripeSecretKey": "sk_live_your_stripe_secret_key",
  "StripePublishableKey": "pk_live_your_stripe_publishable_key",
  "StripeWebhookSecret": "whsec_your_webhook_secret",
  "EmailSmtpPassword": "your_smtp_password"
}
```

**⚠️ Security Note**: Never commit secrets files to version control. Use Azure DevOps variable groups or GitHub secrets for CI/CD pipelines.

## Application Integration

### Key Vault References in App Service

The application automatically uses Key Vault references for configuration:

```json
{
  "ConnectionStrings__DefaultConnection": "@Microsoft.KeyVault(VaultName=kv-netapp-prod-1234;SecretName=DefaultConnection)",
  "JwtSettings__SecretKey": "@Microsoft.KeyVault(VaultName=kv-netapp-prod-1234;SecretName=JwtSecretKey)",
  "StripeSettings__SecretKey": "@Microsoft.KeyVault(VaultName=kv-netapp-prod-1234;SecretName=StripeSecretKey)"
}
```

### Managed Identity Configuration

The App Service uses a system-assigned managed identity to access Key Vault:

1. **Identity Assignment**: Automatically configured during deployment
2. **RBAC Permissions**: Key Vault Secrets User role assigned to the managed identity
3. **Authentication**: Seamless authentication without storing credentials

### Application Configuration

Update your `appsettings.json` to remove hardcoded secrets:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "placeholder-configured-via-keyvault"
  },
  "JwtSettings": {
    "SecretKey": "placeholder-configured-via-keyvault",
    "Issuer": "NetworkingApp",
    "Audience": "NetworkingApp-Users",
    "ExpiryInMinutes": 60
  },
  "StripeSettings": {
    "SecretKey": "placeholder-configured-via-keyvault",
    "PublishableKey": "placeholder-configured-via-keyvault",
    "WebhookSecret": "placeholder-configured-via-keyvault"
  }
}
```

## Monitoring and Troubleshooting

### Key Vault Monitoring

1. **Azure Monitor Integration**: All Key Vault operations are logged
2. **Diagnostic Settings**: Configured to send logs to Log Analytics workspace
3. **Metrics**: Access patterns, request counts, and error rates
4. **Alerts**: Configured for failed access attempts and quota limits

### Common Issues and Solutions

#### 1. Access Denied Errors

**Symptoms**: HTTP 403 errors when accessing secrets
**Solutions**:
- Verify managed identity is assigned to App Service
- Check RBAC permissions in Key Vault
- Ensure Key Vault access policies are correctly configured

```powershell
# Check App Service identity
az webapp identity show --name "app-netapp-prod" --resource-group "rg-netapp-prod"

# Verify Key Vault permissions
az keyvault show --name "kv-netapp-prod-1234" --query "properties.accessPolicies"
```

#### 2. Secret Not Found Errors

**Symptoms**: Application errors indicating missing configuration
**Solutions**:
- Verify secret names match exactly (case-sensitive)
- Check if secrets exist in the correct Key Vault
- Validate Key Vault reference syntax

```powershell
# List all secrets
.\Scripts\Manage-KeyVault.ps1 -Action ListSecrets -Environment prod

# Get specific secret value
az keyvault secret show --vault-name "kv-netapp-prod-1234" --name "JwtSecretKey"
```

#### 3. Network Connectivity Issues

**Symptoms**: Timeouts or network errors accessing Key Vault
**Solutions**:
- Check network security group rules
- Verify private endpoint configuration
- Test connectivity from App Service

```bash
# Test Key Vault connectivity
az webapp deployment source config --name "app-netapp-prod" --resource-group "rg-netapp-prod" --repo-url "https://github.com/test"
```

### Diagnostic Commands

```powershell
# Validate overall Key Vault health
.\Scripts\Manage-KeyVault.ps1 -Action ValidateAccess -Environment prod

# Check Key Vault access logs
az monitor activity-log list --resource-group "rg-netapp-prod" --resource-type "Microsoft.KeyVault/vaults"

# Test managed identity authentication
az account get-access-token --resource "https://vault.azure.net"
```

## Best Practices

### Secret Management
1. **Regular Rotation**: Implement periodic secret rotation for production
2. **Principle of Least Privilege**: Grant minimal required permissions
3. **Environment Separation**: Use separate Key Vaults for different environments
4. **Audit Regularly**: Review access logs and permissions quarterly

### Development Workflow
1. **Local Development**: Use user secrets or environment variables locally
2. **CI/CD Integration**: Use service principals with limited Key Vault access
3. **Secret Naming**: Use consistent, descriptive names for all secrets
4. **Version Control**: Never commit secrets to source control

### Security Considerations
1. **Network Isolation**: Use private endpoints for production environments
2. **Backup Strategy**: Implement regular Key Vault backups
3. **Disaster Recovery**: Plan for Key Vault restoration procedures
4. **Compliance**: Ensure Key Vault configuration meets regulatory requirements

## Automation Scripts

The following PowerShell scripts are available for Key Vault management:

### Primary Script: `Manage-KeyVault.ps1`

```powershell
# Deploy infrastructure
.\Scripts\Manage-KeyVault.ps1 -Action Deploy -Environment dev

# Set secrets interactively
.\Scripts\Manage-KeyVault.ps1 -Action SetSecrets -Environment prod

# List all secrets
.\Scripts\Manage-KeyVault.ps1 -Action ListSecrets -Environment test

# Validate access
.\Scripts\Manage-KeyVault.ps1 -Action ValidateAccess -Environment prod

# Generate new JWT secret
.\Scripts\Manage-KeyVault.ps1 -Action GenerateJwtSecret -Environment dev
```

### Additional Utilities

```powershell
# Backup secrets to encrypted file
.\Scripts\Backup-KeyVaultSecrets.ps1 -Environment prod -OutputPath "backup-prod.json"

# Migrate secrets between environments
.\Scripts\Migrate-KeyVaultSecrets.ps1 -SourceEnv test -TargetEnv prod

# Rotate all secrets
.\Scripts\Rotate-KeyVaultSecrets.ps1 -Environment prod -NotificationEmail "admin@company.com"
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monthly**: Review access logs and audit permissions
2. **Quarterly**: Rotate non-critical secrets and review access policies
3. **Annually**: Complete security review and update documentation

### Support Contacts

- **Development Team**: dev-team@wingcompanion.com
- **Infrastructure Team**: infra-team@wingcompanion.com
- **Security Team**: security-team@wingcompanion.com

### Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Managed Identity Documentation](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/)
- [Azure RBAC Documentation](https://docs.microsoft.com/en-us/azure/role-based-access-control/)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-01-15  
**Maintained By**: NetworkingApp Development Team
