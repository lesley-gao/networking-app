# 🚀 GitHub Actions CI/CD Pipeline Setup Guide

This guide will help you configure the comprehensive CI/CD pipeline for the Flight Companion Platform, including automated testing, security scanning, deployment, and release management.

## 📋 Prerequisites

Before setting up the CI/CD pipeline, ensure you have:

1. **Azure Subscription** with appropriate permissions
2. **GitHub Repository** with admin access
3. **Azure CLI** installed locally
4. **GitHub CLI** (optional, for easier setup)

## 🏗️ Azure Infrastructure Setup

### 1. Create Azure Service Principal

```powershell
# Login to Azure
az login

# Set your subscription
az account set --subscription "your-subscription-id"

# Create a service principal for GitHub Actions
az ad sp create-for-rbac `
  --name "github-actions-flightcompanion" `
  --role "Contributor" `
  --scopes "/subscriptions/your-subscription-id" `
  --sdk-auth

# Create additional role assignments for specific services
az role assignment create `
  --assignee "service-principal-object-id" `
  --role "Storage Blob Data Contributor" `
  --scope "/subscriptions/your-subscription-id"

az role assignment create `
  --assignee "service-principal-object-id" `
  --role "CDN Endpoint Contributor" `
  --scope "/subscriptions/your-subscription-id"
```

### 2. Setup Federated Identity (OIDC) - Recommended

For enhanced security, use Azure Federated Identity instead of service principal secrets:

```powershell
# Create Azure AD Application
$appId = az ad app create --display-name "github-actions-flightcompanion" --query "appId" -o tsv

# Create service principal
$spId = az ad sp create --id $appId --query "id" -o tsv

# Create federated credential for main branch
az ad app federated-credential create `
  --id $appId `
  --parameters '{
    "name": "github-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:your-username/your-repo:ref:refs/heads/main",
    "description": "GitHub Actions - Main Branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for pull requests
az ad app federated-credential create `
  --id $appId `
  --parameters '{
    "name": "github-pull-requests",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:your-username/your-repo:pull_request",
    "description": "GitHub Actions - Pull Requests",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Assign necessary roles
az role assignment create `
  --assignee $spId `
  --role "Contributor" `
  --scope "/subscriptions/your-subscription-id"
```

## 🔐 GitHub Repository Configuration

### 1. Repository Secrets

Configure the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets:
```
AZURE_CREDENTIALS          # Full JSON output from service principal creation
AZURE_SUBSCRIPTION_ID       # Your Azure subscription ID
AZURE_TENANT_ID            # Your Azure tenant ID
AZURE_CLIENT_ID            # Service principal client ID
AZURE_CLIENT_SECRET        # Service principal client secret (if not using OIDC)
```

#### Optional Secrets (for enhanced features):
```
NOTIFICATION_WEBHOOK_URL    # Slack/Teams webhook for deployment notifications
DATABASE_CONNECTION_STRING  # Production database connection (if different)
STRIPE_SECRET_KEY          # For payment processing tests
SENDGRID_API_KEY           # For email notification tests
```

### 2. Repository Variables

Configure these variables for environment-specific settings:

```
APPLICATION_NAME            # flightcompanion
AZURE_LOCATION             # australiaeast
RESOURCE_GROUP_PREFIX      # rg-flightcompanion
ENVIRONMENT_DEV            # dev
ENVIRONMENT_TEST           # test
ENVIRONMENT_PROD           # prod
```

### 3. Environment Protection Rules

Set up environment protection in GitHub (`Settings > Environments`):

#### Development Environment (`dev`)
- No protection rules
- Automatic deployment on push to `develop` branch

#### Test Environment (`test`)
- No protection rules
- Manual deployment or automatic on PR merge

#### Production Environment (`prod`)
- **Required reviewers**: Add team leads or senior developers
- **Wait timer**: 5 minutes (allows for review)
- **Deployment branches**: Only `main` branch
- **Environment secrets**: Production-specific secrets

## 🛠️ Pipeline Configuration

### 1. Workflow Files Overview

The CI/CD pipeline consists of four main workflows:

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `main-ci-cd-pipeline.yml` | Primary CI/CD pipeline | Push, PR, Manual |
| `security-scanning.yml` | Security and vulnerability scanning | Daily, PR |
| `performance-testing.yml` | Load and performance testing | Weekly, Manual |
| `release-management.yml` | Release creation and deployment | Tags, Manual |

### 2. Customizing Deployment Environments

Update the environment-specific values in each workflow:

```yaml
# In main-ci-cd-pipeline.yml
env:
  APPLICATION_NAME: 'your-app-name'        # Change this
  AZURE_LOCATION: 'your-preferred-region'  # Change this
  RESOURCE_GROUP_PREFIX: 'rg-your-app'    # Change this
```

### 3. Branch Protection Rules

Configure branch protection for `main` and `develop` branches:

```
Settings > Branches > Add rule:
- Branch name pattern: main
- Require a pull request before merging: ✓
- Require status checks to pass before merging: ✓
  - Required status checks:
    - Backend Quality Gate
    - Frontend Quality Gate
    - Infrastructure Validation
    - Security Scan
- Require branches to be up to date before merging: ✓
- Restrict pushes that create files larger than 100MB: ✓
```

## 🧪 Testing the Pipeline

### 1. Initial Pipeline Test

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/pipeline-test
   echo "# Pipeline Test" > test-file.md
   git add test-file.md
   git commit -m "Test: Initial pipeline validation"
   git push origin feature/pipeline-test
   ```

2. **Create a Pull Request** and verify:
   - ✅ Backend quality checks pass
   - ✅ Frontend quality checks pass
   - ✅ Infrastructure validation passes
   - ✅ Security scanning completes

3. **Merge to develop** and verify:
   - ✅ Development deployment succeeds
   - ✅ Health checks pass

### 2. Production Deployment Test

1. **Create a release:**
   ```bash
   # Via GitHub Actions (manual workflow dispatch)
   # Go to: Actions > Release Management > Run workflow
   # Select: release_type = patch, target_environment = prod
   ```

2. **Verify production deployment:**
   - ✅ Pre-deployment validation passes
   - ✅ Approval workflow triggers (if configured)
   - ✅ Production deployment succeeds
   - ✅ Post-deployment health checks pass
   - ✅ GitHub release created

## 📊 Monitoring and Notifications

### 1. Pipeline Status Monitoring

Monitor pipeline status through:

- **GitHub Actions tab**: Real-time workflow status
- **Repository README**: Add status badges
- **Pull Request checks**: Automatic status updates
- **Email notifications**: Configure in GitHub settings

### 2. Adding Status Badges

Add to your README.md:

```markdown
[![CI/CD Pipeline](https://github.com/your-username/your-repo/actions/workflows/main-ci-cd-pipeline.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/main-ci-cd-pipeline.yml)
[![Security Scan](https://github.com/your-username/your-repo/actions/workflows/security-scanning.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/security-scanning.yml)
```

### 3. Slack/Teams Integration

Add webhook URL to repository secrets and update notification steps:

```yaml
- name: 📢 Send Deployment Notification
  if: always()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"🚀 Deployment completed: ${{ env.APPLICATION_NAME }} v${{ env.VERSION }} to ${{ env.ENVIRONMENT }}"}' \
      ${{ secrets.NOTIFICATION_WEBHOOK_URL }}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Azure Authentication Failures

```
Error: Azure login failed
```

**Solution:**
- Verify service principal credentials in GitHub secrets
- Check subscription ID and tenant ID
- Ensure service principal has required permissions
- For OIDC: Verify federated credential configuration

#### 2. Bicep Template Validation Errors

```
Error: Template validation failed
```

**Solution:**
- Run `az bicep build --file main.bicep` locally
- Check parameter file values
- Verify Azure provider registrations
- Review resource naming conventions

#### 3. Test Failures

```
Error: Tests failed during quality gate
```

**Solution:**
- Run tests locally: `dotnet test` and `npm test`
- Check test configuration files
- Review test dependencies and setup
- Verify database connection for integration tests

#### 4. CDN Purge Failures

```
Error: CDN cache purge failed
```

**Solution:**
- Verify CDN endpoint exists and is running
- Check CDN contributor permissions
- Review CDN profile and endpoint names
- Ensure purge paths are correct

### 5. Performance Test Failures

```
Error: Performance thresholds exceeded
```

**Solution:**
- Review performance test configurations
- Adjust threshold values in workflow
- Check application performance locally
- Verify test environment resources

## 🚀 Next Steps

After successfully setting up the CI/CD pipeline:

1. **Configure monitoring alerts** in Azure Application Insights
2. **Set up custom domains** with SSL certificates
3. **Implement feature flags** for gradual rollouts
4. **Configure backup and disaster recovery**
5. **Set up log aggregation** and analysis

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Developer CLI Guide](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)

---

## 🎯 Quick Setup Checklist

- [ ] Azure service principal created with appropriate permissions
- [ ] GitHub repository secrets configured
- [ ] Environment protection rules set up
- [ ] Branch protection rules configured
- [ ] Initial pipeline test completed successfully
- [ ] Production deployment tested
- [ ] Monitoring and notifications configured
- [ ] Team members have appropriate access levels

**Estimated Setup Time:** 2-3 hours for complete configuration

**Pipeline Execution Time:** 
- Full CI/CD: ~15-20 minutes
- Security scan: ~10-15 minutes  
- Performance test: ~20-30 minutes
- Release deployment: ~25-35 minutes
