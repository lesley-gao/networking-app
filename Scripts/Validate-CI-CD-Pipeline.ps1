# GitHub Actions Workflow Validation Script
# Validates the CI/CD pipeline configuration and dependencies

param(
    [Parameter(Mandatory=$false)]
    [switch]$ValidateSecrets,
    
    [Parameter(Mandatory=$false)]
    [switch]$ValidateInfrastructure,
    
    [Parameter(Mandatory=$false)]
    [switch]$TestLocalBuild
)

Write-Host "🔍 GitHub Actions CI/CD Pipeline Validation" -ForegroundColor Magenta
Write-Host "="*60 -ForegroundColor Blue

$validationErrors = @()

# Validate workflow file exists
$workflowFile = ".github/workflows/ci-cd-pipeline.yml"
if (-not (Test-Path $workflowFile)) {
    $validationErrors += "❌ Main CI/CD workflow file not found: $workflowFile"
} else {
    Write-Host "✅ Main workflow file found: $workflowFile" -ForegroundColor Green
}

# Validate package.json scripts
Write-Host "`n📦 Validating Frontend Dependencies and Scripts..." -ForegroundColor Yellow

$packageJsonPath = "ClientApp/package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
    $requiredScripts = @(
        "build", "test", "lint", "format:check", "type-check", 
        "serve", "build-storybook", "test-storybook:ci"
    )
    
    foreach ($script in $requiredScripts) {
        if ($packageJson.scripts.$script) {
            Write-Host "  ✅ Script '$script' found" -ForegroundColor Green
        } else {
            $validationErrors += "❌ Missing required npm script: $script"
        }
    }
    
    # Check for required dev dependencies
    $requiredDevDeps = @(
        "@playwright/test", "@storybook/test-runner", "eslint", "prettier", "typescript"
    )
    
    foreach ($dep in $requiredDevDeps) {
        if ($packageJson.devDependencies.$dep) {
            Write-Host "  ✅ Dev dependency '$dep' found" -ForegroundColor Green
        } else {
            $validationErrors += "❌ Missing required dev dependency: $dep"
        }
    }
} else {
    $validationErrors += "❌ package.json not found at $packageJsonPath"
}

# Validate .NET project configuration
Write-Host "`n🏗️ Validating Backend Configuration..." -ForegroundColor Yellow

$projectFile = "NetworkingApp.csproj"
if (Test-Path $projectFile) {
    Write-Host "  ✅ .NET project file found: $projectFile" -ForegroundColor Green
    
    # Check for test project
    if (Test-Path "Tests/Tests.csproj") {
        Write-Host "  ✅ Test project found: Tests/Tests.csproj" -ForegroundColor Green
    } else {
        $validationErrors += "❌ Test project not found: Tests/Tests.csproj"
    }
    
    # Check for coverlet.runsettings
    if (Test-Path "coverlet.runsettings") {
        Write-Host "  ✅ Code coverage configuration found: coverlet.runsettings" -ForegroundColor Green
    } else {
        $validationErrors += "❌ Code coverage configuration not found: coverlet.runsettings"
    }
} else {
    $validationErrors += "❌ .NET project file not found: $projectFile"
}

# Validate Azure configuration
Write-Host "`n☁️ Validating Azure Configuration..." -ForegroundColor Yellow

if (Test-Path "azure.yaml") {
    Write-Host "  ✅ Azure Developer CLI configuration found: azure.yaml" -ForegroundColor Green
} else {
    $validationErrors += "❌ Azure Developer CLI configuration not found: azure.yaml"
}

if ($ValidateInfrastructure) {
    if (Test-Path "infra/bicep/main.bicep") {
        Write-Host "  ✅ Bicep infrastructure template found" -ForegroundColor Green
    } else {
        $validationErrors += "❌ Bicep infrastructure template not found"
    }
}

# Validate required controllers and health endpoints
Write-Host "`n🩺 Validating Health Check Configuration..." -ForegroundColor Yellow

if (Test-Path "Controllers/HealthController.cs") {
    Write-Host "  ✅ Health controller found: Controllers/HealthController.cs" -ForegroundColor Green
} else {
    $validationErrors += "❌ Health controller not found: Controllers/HealthController.cs"
}

if (Test-Path "Controllers/TestController.cs") {
    Write-Host "  ✅ Test controller found: Controllers/TestController.cs" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Test controller not found (optional): Controllers/TestController.cs" -ForegroundColor Yellow
}

# Validate secret requirements (if requested)
if ($ValidateSecrets) {
    Write-Host "`n🔐 Validating GitHub Secrets Configuration..." -ForegroundColor Yellow
    
    $requiredSecrets = @(
        "AZURE_CLIENT_ID",
        "AZURE_CLIENT_SECRET", 
        "AZURE_TENANT_ID",
        "AZURE_SUBSCRIPTION_ID"
    )
    
    Write-Host "  ⚠️ Please ensure the following secrets are configured in GitHub:" -ForegroundColor Yellow
    foreach ($secret in $requiredSecrets) {
        Write-Host "    - $secret" -ForegroundColor White
    }
}

# Test local build capability (if requested)
if ($TestLocalBuild) {
    Write-Host "`n🏗️ Testing Local Build Capability..." -ForegroundColor Yellow
    
    try {
        Write-Host "  Testing .NET build..." -ForegroundColor White
        dotnet build --configuration Release --verbosity quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ .NET build successful" -ForegroundColor Green
        } else {
            $validationErrors += "❌ .NET build failed"
        }
    } catch {
        $validationErrors += "❌ .NET build test failed: $($_.Exception.Message)"
    }
    
    try {
        Write-Host "  Testing frontend build..." -ForegroundColor White
        Set-Location "ClientApp"
        npm ci --silent
        npm run build
        Set-Location ".."
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Frontend build successful" -ForegroundColor Green
        } else {
            $validationErrors += "❌ Frontend build failed"
        }
    } catch {
        $validationErrors += "❌ Frontend build test failed: $($_.Exception.Message)"
        Set-Location ".."
    }
}

# Validate code coverage scripts
Write-Host "`n📊 Validating Code Coverage Scripts..." -ForegroundColor Yellow

$coverageScripts = @(
    "Scripts/Generate-CodeCoverage.ps1",
    "Scripts/Generate-DotNetCodeCoverage.ps1", 
    "Scripts/Generate-ReactCodeCoverage.ps1"
)

foreach ($script in $coverageScripts) {
    if (Test-Path $script) {
        Write-Host "  ✅ Coverage script found: $script" -ForegroundColor Green
    } else {
        $validationErrors += "❌ Coverage script not found: $script"
    }
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Blue
Write-Host "📋 Validation Summary" -ForegroundColor Magenta

if ($validationErrors.Count -eq 0) {
    Write-Host "`n🎉 All validations passed! The CI/CD pipeline is ready for use." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "1. Configure GitHub secrets (if not already done)" -ForegroundColor White
    Write-Host "2. Push changes to trigger the pipeline" -ForegroundColor White
    Write-Host "3. Monitor the pipeline execution in GitHub Actions" -ForegroundColor White
    
    # Additional recommendations
    Write-Host "`nRecommendations:" -ForegroundColor Cyan
    Write-Host "  - Run validation with -TestLocalBuild to verify builds work locally" -ForegroundColor White
    Write-Host "  - Use -ValidateSecrets to see required GitHub secret configuration" -ForegroundColor White
    Write-Host "  - Use -ValidateInfrastructure to check Bicep templates" -ForegroundColor White
    Write-Host "  - Regularly update dependencies to maintain security" -ForegroundColor White
    Write-Host "  - Monitor pipeline performance and optimize as needed" -ForegroundColor White
    
    exit 0
} else {
    Write-Host "`n❌ Validation failed with the following issues:" -ForegroundColor Red
    foreach ($error in $validationErrors) {
        Write-Host "  $error" -ForegroundColor Red
    }
    Write-Host "`nPlease fix these issues before using the CI/CD pipeline." -ForegroundColor Yellow
    exit 1
}
