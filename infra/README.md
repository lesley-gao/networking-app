# WingCompanion - Azure Infrastructure

This directory contains the Infrastructure as Code (IaC) templates for deploying WingCompanion to Azure using Azure Developer CLI (azd) and Bicep templates.

## Architecture Overview

The solution deploys a secure, scalable architecture following Azure Well-Architected Framework principles:

- **App Service** - Hosts the .NET 8 web application with staging slots
- **Azure SQL Database** - Relational database with private endpoints
- **Key Vault** - Secure storage for application secrets
- **Application Insights** - Application monitoring and logging
- **Virtual Network** - Network isolation and security
- **Auto-scaling** - Automatic scaling based on CPU and memory metrics

## Prerequisites

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Developer CLI** - [Install Azure Developer CLI](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)
3. **.NET 8 SDK** - [Install .NET 8](https://dotnet.microsoft.com/download/dotnet/8.0)
4. **Node.js 18+** - [Install Node.js](https://nodejs.org/)
5. **PowerShell 7+** - [Install PowerShell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell)

## Quick Start

### 1. Initialize the project

```bash
# Clone or navigate to the project directory
cd WingCompanion

# Initialize azd (if not already done)
azd init

# Login to Azure
azd auth login
```

### 2. Deploy to Development

```bash
# Deploy to development environment
azd up --environment dev
```

### 3. Deploy to Production

```bash
# Deploy to production environment  
azd up --environment prod
```

## Manual Deployment Steps

### Using PowerShell Script

```powershell
# Deploy to development
.\scripts\Deploy-ToAzure.ps1 -Environment dev

# Deploy to test with custom location
.\scripts\Deploy-ToAzure.ps1 -Environment test -Location "australiaeast"

# Deploy to production (skip tests)
.\scripts\Deploy-ToAzure.ps1 -Environment prod -SkipTests
```

### Using Azure Developer CLI

```bash
# Set environment variables
azd env set AZURE_LOCATION australiaeast
azd env set WORKLOAD_NAME netapp

# Deploy infrastructure and application
azd up
```

## Environment Configuration

### Development (dev)
- **SKU**: Basic App Service Plan, Basic SQL Database
- **Features**: Staging slots, development logging
- **Security**: Relaxed for development productivity

### Test (test)  
- **SKU**: Standard App Service Plan, Standard SQL Database
- **Features**: Production-like configuration for testing
- **Security**: Enhanced security policies

### Production (prod)
- **SKU**: Premium App Service Plan, Premium SQL Database  
- **Features**: Auto-scaling, high availability, monitoring
- **Security**: Full security hardening, private endpoints

## Directory Structure

```
infra/
├── bicep/
│   ├── main.bicep                 # Main orchestration template
│   ├── modules/
│   │   ├── app-service.bicep      # App Service and Service Plan
│   │   ├── database.bicep         # Azure SQL Database
│   │   ├── monitoring.bicep       # Application Insights & Log Analytics
│   │   ├── networking.bicep       # Virtual Network and subnets
│   │   └── security.bicep         # Key Vault and security config
│   └── parameters/
│       ├── main.dev.json          # Development parameters
│       ├── main.test.json         # Test parameters
│       └── main.prod.json         # Production parameters
```

## Key Features

### Security
- **Azure Key Vault** for secrets management
- **Managed Identity** for secure Azure service access
- **Private endpoints** for database connectivity
- **Network Security Groups** for traffic filtering
- **TLS 1.2+** enforcement across all services

### Monitoring
- **Application Insights** for application telemetry
- **Log Analytics** for centralized logging
- **Custom dashboards** for monitoring key metrics
- **Automated alerts** for critical issues

### Scalability
- **Auto-scaling** based on CPU and memory usage
- **Application Insights** adaptive sampling
- **Azure SQL Database** DTU scaling
- **CDN integration** for static assets

### High Availability
- **Multi-zone deployment** options
- **Automated backups** with point-in-time recovery
- **Health checks** and automatic failover
- **Staging slots** for zero-downtime deployments

## Resource Naming Convention

Resources follow Azure naming conventions with the pattern:
`{resource-type}-{workload-name}-{environment}-{region}`

Examples:
- `app-netapp-dev-aue` (App Service)
- `sql-netapp-prod-aue` (SQL Server)
- `kv-netapp-test-aue` (Key Vault)

## Cost Optimization

### Development Environment
- Basic SKUs for cost savings
- Shared resources where possible
- Automated cleanup of unused resources

### Production Environment
- Reserved instances for predictable workloads
- Auto-scaling to optimize for demand
- Resource tagging for cost allocation

## Security Considerations

### Network Security
- Virtual Network isolation
- Private endpoints for data services
- Network Security Groups with least privilege
- Application Gateway for web application firewall

### Identity and Access
- Managed Identity for service-to-service authentication
- Azure Active Directory integration
- Role-based access control (RBAC)
- Just-in-time access for administrative tasks

### Data Protection
- Encryption at rest and in transit
- Key management through Azure Key Vault
- SQL Database Transparent Data Encryption
- Regular security assessments and compliance checks

## Troubleshooting

### Common Issues

1. **Deployment fails with authentication error**
   ```bash
   azd auth login
   az login
   ```

2. **Resource naming conflicts**
   - Check if resources with same names exist
   - Modify `workloadName` parameter

3. **Insufficient permissions**
   - Ensure account has Contributor role on subscription
   - Check Azure AD permissions for Key Vault

### Debug Commands

```bash
# Check deployment status
azd show

# View deployment logs
azd logs

# Get environment values
azd env get-values

# Validate Bicep templates
az deployment group validate --resource-group rg-name --template-file main.bicep
```

## Additional Resources

- [Azure Developer CLI Documentation](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)

## Support

For issues with the infrastructure deployment:
1. Check the troubleshooting section above
2. Review Azure portal for detailed error messages
3. Consult Azure documentation for specific services
4. Contact the platform team for assistance
