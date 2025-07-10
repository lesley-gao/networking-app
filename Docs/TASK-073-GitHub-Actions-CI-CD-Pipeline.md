# GitHub Actions CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline implemented for the NetworkingApp platform. The pipeline provides automated testing, security scanning, quality gates, and deployment to multiple Azure environments.

## Pipeline Architecture

### Workflow Files
- **`.github/workflows/ci-cd-pipeline.yml`** - Main CI/CD pipeline
- **`.github/workflows/azure-deploy.yml`** - Legacy deployment workflow (deprecated)

### Pipeline Stages

#### 1. Quality Gates & Static Analysis
- **ESLint** - Frontend code linting
- **TypeScript** type checking
- **Prettier** code formatting validation
- **npm audit** - Security vulnerability scanning
- **.NET security scan** - Package vulnerability assessment

#### 2. Backend Testing (.NET 8)
- **Unit Tests** - Controller and service layer testing with MSTest
- **Integration Tests** - API endpoint testing with TestServer
- **Performance Tests** - Load testing for matching algorithms
- **Code Coverage** - Minimum 80% threshold enforcement

#### 3. Frontend Testing (React/TypeScript)
- **Unit Tests** - Component testing with React Testing Library
- **Storybook Tests** - Component interaction testing
- **End-to-End Tests** - Full workflow testing with Playwright
- **Code Coverage** - Minimum 80% threshold enforcement

#### 4. Security & Vulnerability Scanning
- **Trivy Scanner** - Filesystem vulnerability scanning
- **CodeQL Analysis** - Static application security testing (SAST)
- **SARIF Upload** - Security findings integration with GitHub Security

#### 5. Build & Package
- **Version Generation** - Automated semantic versioning
- **.NET Build** - Release configuration compilation
- **React Build** - Production bundle generation
- **Artifact Upload** - Build artifacts for deployment

#### 6. Deployment Environments
- **Development** - Auto-deploy from `develop` branch
- **Test** - Auto-deploy from `main` branch
- **Production** - Manual deployment with approval gates

## Trigger Conditions

### Automatic Triggers
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
```

### Manual Triggers
```yaml
workflow_dispatch:
  inputs:
    environment: # dev, test, prod
    skip_tests: # Emergency deployment option
```

## Environment Configuration

### Development Environment
- **URL**: `https://networkingapp-dev.azurewebsites.net`
- **Trigger**: Push to `develop` branch
- **Auto-deployment**: Yes
- **Health checks**: Basic API availability

### Test Environment
- **URL**: `https://networkingapp-test.azurewebsites.net`
- **Trigger**: Push to `main` branch
- **Auto-deployment**: Yes
- **Prerequisites**: Development deployment success

### Production Environment
- **URL**: `https://networkingapp.azurewebsites.net`
- **Trigger**: Manual workflow dispatch only
- **Auto-deployment**: No (requires approval)
- **Prerequisites**: Test deployment success
- **Smoke tests**: Comprehensive post-deployment validation

## Testing Strategy

### Backend Testing Matrix
```yaml
strategy:
  matrix:
    test-type: [unit, integration, performance]
```

#### Unit Tests
- **Framework**: MSTest + Moq
- **Coverage**: Minimum 80% line and branch coverage
- **Location**: `Tests/Controllers/`, `Tests/Services/`
- **Command**: `dotnet test --filter "Category!=Integration&Category!=Performance"`

#### Integration Tests
- **Framework**: TestServer + InMemory database
- **Scope**: API endpoints and database interactions
- **Command**: `dotnet test --filter "Category=Integration"`

#### Performance Tests
- **Framework**: Custom performance testing
- **Scope**: Matching algorithms and database queries
- **Command**: `dotnet test --filter "Category=Performance"`

### Frontend Testing Matrix
```yaml
strategy:
  matrix:
    test-type: [unit, storybook, e2e]
```

#### Unit Tests
- **Framework**: Jest + React Testing Library
- **Coverage**: Minimum 80% across all metrics
- **Command**: `npm test -- --coverage --watchAll=false`

#### Storybook Tests
- **Framework**: Storybook Test Runner
- **Scope**: Component interaction testing
- **Command**: `npm run test-storybook:ci`

#### End-to-End Tests
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Command**: `npx playwright test`

## Code Coverage Requirements

### Backend Coverage (.NET)
- **Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 80%
- **Method Coverage**: ≥ 80%
- **Tool**: Coverlet + ReportGenerator
- **Format**: Cobertura XML, HTML, JSON

### Frontend Coverage (React)
- **Lines**: ≥ 80%
- **Branches**: ≥ 80%
- **Functions**: ≥ 80%
- **Statements**: ≥ 80%
- **Tool**: Jest + Istanbul
- **Format**: LCOV, HTML, JSON

## Security Scanning

### Trivy Vulnerability Scanner
- **Scope**: Filesystem and dependencies
- **Output**: SARIF format
- **Integration**: GitHub Security tab
- **Frequency**: Every pipeline run

### CodeQL Static Analysis
- **Languages**: C#, JavaScript/TypeScript
- **Queries**: Security-extended + Quality
- **Integration**: GitHub Security tab
- **Frequency**: Every pipeline run

## Artifact Management

### Build Artifacts
- **Backend**: Published .NET application
- **Frontend**: React production build
- **Retention**: 30 days
- **Naming**: `application-build-{version}`

### Test Results
- **Coverage Reports**: HTML and JSON formats
- **Test Results**: TRX and JUnit formats
- **Playwright Reports**: HTML with traces
- **Retention**: 30 days

## Deployment Process

### Azure Developer CLI Integration
```bash
azd auth login --client-id "$CLIENT_ID" --client-secret "$CLIENT_SECRET" --tenant-id "$TENANT_ID"
azd env select {environment} || azd env new {environment}
azd deploy --no-prompt
```

### Health Check Validation
```bash
# Basic health check
curl -f -s https://{app-url}/health

# API availability check  
curl -f -s https://{app-url}/api/test
```

### Post-Deployment Testing
- **Development**: Basic health checks
- **Test**: API availability validation
- **Production**: Comprehensive smoke tests

## Monitoring & Notifications

### Pipeline Status Reporting
- **GitHub Actions Summary**: Automated pipeline status
- **Job Results Matrix**: Success/failure tracking
- **Artifact Links**: Direct access to reports

### Environment Status
- **Deployment URLs**: Environment-specific links
- **Health Status**: Real-time application health
- **Version Tracking**: Deployed version information

## Secrets Configuration

### Required GitHub Secrets
```yaml
AZURE_CLIENT_ID          # Service principal client ID
AZURE_CLIENT_SECRET      # Service principal secret
AZURE_TENANT_ID          # Azure tenant ID
AZURE_SUBSCRIPTION_ID    # Azure subscription ID
```

### Environment Variables
```yaml
DOTNET_VERSION: '8.0.x'
NODE_VERSION: '18.x'
AZURE_LOCATION: 'australiaeast'
```

## Pipeline Optimization

### Parallelization
- Quality gates and testing stages run in parallel
- Test types within each platform run as matrix jobs
- Independent deployment environments

### Caching Strategy
- **Node.js**: npm cache based on package-lock.json
- **.NET**: NuGet package restoration cache
- **Dependencies**: Automatic GitHub Actions caching

### Conditional Execution
- **Skip Tests**: Emergency deployment option
- **Environment Targeting**: Branch-based deployment logic
- **Approval Gates**: Production deployment protection

## Troubleshooting

### Common Issues

#### Test Failures
1. Check test result artifacts
2. Review coverage threshold violations
3. Validate test environment setup

#### Build Failures
1. Verify dependency versions
2. Check compilation errors
3. Review package compatibility

#### Deployment Failures
1. Validate Azure credentials
2. Check resource availability
3. Review deployment logs

#### Coverage Threshold Violations
1. Identify uncovered code areas
2. Add missing test cases
3. Update coverage exclusions if needed

### Debug Commands

#### Local Testing
```bash
# Backend coverage
.\Scripts\Generate-CodeCoverage.ps1 -BackendOnly

# Frontend coverage  
.\Scripts\Generate-CodeCoverage.ps1 -FrontendOnly

# Full coverage analysis
.\Scripts\Generate-CodeCoverage.ps1 -OpenReports
```

#### Pipeline Debugging
- Enable debug logging: `ACTIONS_STEP_DEBUG=true`
- Download pipeline artifacts for detailed analysis
- Review GitHub Actions logs for specific error messages

## Best Practices

### Code Quality
- Maintain consistent code formatting
- Follow TypeScript strict mode
- Implement comprehensive error handling
- Use meaningful test descriptions

### Security
- Regular dependency updates
- Security vulnerability monitoring
- Secure secret management
- Regular security scan reviews

### Performance
- Optimize test execution time
- Minimize pipeline duration
- Efficient artifact management
- Strategic caching implementation

### Maintenance
- Regular pipeline updates
- Dependency version management
- Documentation updates
- Performance monitoring

## Pipeline Metrics

### Success Criteria
- **Build Success Rate**: > 95%
- **Test Pass Rate**: 100%
- **Coverage Compliance**: 100%
- **Security Scan**: No high/critical issues
- **Deployment Success**: > 99%

### Performance Targets
- **Total Pipeline Time**: < 30 minutes
- **Build Time**: < 10 minutes
- **Test Execution**: < 15 minutes
- **Deployment Time**: < 5 minutes

## Future Enhancements

### Planned Improvements
- Container-based deployments
- Blue-green deployment strategy
- Advanced monitoring integration
- Automated rollback capabilities
- Multi-region deployment support

### Monitoring Integration
- Application Insights telemetry
- Azure Monitor alerts
- Performance dashboard
- Error tracking and reporting
