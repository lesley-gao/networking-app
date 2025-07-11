# =========================================================================================================
# Deploy NetworkingApp to Azure using Azure Developer CLI
# =========================================================================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "australiaeast",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory = $false)]
    [switch]$Force,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipNetworkSecurity,
    
    [Parameter(Mandatory = $false)]
    [switch]$NetworkSecurityOnly,
    
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Color functions for better output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info { Write-ColorOutput Cyan $args }
function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }

# Banner
Write-Info "========================================="
Write-Info "  NetworkingApp Azure Deployment"
Write-Info "  Environment: $Environment"
Write-Info "  Location: $Location"
if ($NetworkSecurityOnly) {
    Write-Info "  Mode: Network Security Only"
}
Write-Info "========================================="

try {
    # Check prerequisites
    Write-Info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
        throw "Azure CLI is not installed. Please install Azure CLI first."
    }
    
    # Check if Azure Developer CLI is installed
    if (-not (Get-Command "azd" -ErrorAction SilentlyContinue)) {
        throw "Azure Developer CLI is not installed. Please install azd first."
    }
    
    # Check if .NET 8 SDK is installed
    $dotnetVersion = dotnet --version 2>$null
    if (-not $dotnetVersion -or $dotnetVersion -notmatch "^8\.") {
        throw ".NET 8 SDK is not installed. Please install .NET 8 SDK first."
    }
    
    Write-Success "Prerequisites check passed"
    
    # Set the environment
    Write-Info "Setting azd environment to: $Environment"
    azd env select $Environment
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Environment '$Environment' doesn't exist. Creating it..."
        azd env new $Environment
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create azd environment"
        }
    }
    
    # Load environment variables
    Write-Info "Loading environment configuration..."
    if (Test-Path ".env.$Environment") {
        Get-Content ".env.$Environment" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
                azd env set $name $value
            }
        }
    }
    
    # Build the application (unless skipped)
    if (-not $SkipBuild) {
        Write-Info "Building the application..."
        
        # Restore packages
        Write-Info "Restoring NuGet packages..."
        dotnet restore
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to restore NuGet packages"
        }
        
        # Build the solution
        Write-Info "Building the solution..."
        dotnet build --no-restore -c Release
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build the solution"
        }
        
        Write-Success "Application built successfully"
    }
    
    # Run tests (unless skipped)
    if (-not $SkipTests) {
        Write-Info "Running tests..."
        dotnet test --no-build -c Release --verbosity minimal
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Some tests failed, but continuing with deployment"
        }
        else {
            Write-Success "All tests passed"
        }
    }
    
    # Build frontend
    Write-Info "Building React frontend..."
    Push-Location "ClientApp"
    try {
        if (Test-Path "package.json") {
            npm ci
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install npm packages"
            }
            
            npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to build React application"
            }
            Write-Success "Frontend built successfully"
        }
    }
    finally {
        Pop-Location
    }
    
    # Get subscription ID if not provided
    if (-not $SubscriptionId) {
        Write-Info "Getting current subscription..."
        $currentSubscription = az account show --output json | ConvertFrom-Json
        $SubscriptionId = $currentSubscription.id
        Write-Info "Using subscription: $($currentSubscription.name)"
    }
    
    # Deploy infrastructure and application
    Write-Info "Deploying to Azure..."
    
    # Deploy network security infrastructure first (if not skipped)
    if (-not $SkipNetworkSecurity) {
        Write-Info "Deploying network security infrastructure..."
        
        $networkSecurityScript = Join-Path $PSScriptRoot "Deploy-NetworkSecurity.ps1"
        if (Test-Path $networkSecurityScript) {
            try {
                & $networkSecurityScript -Environment $Environment -SubscriptionId $SubscriptionId
                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "Network security deployment encountered issues but continuing..."
                }
                else {
                    Write-Success "Network security infrastructure deployed successfully"
                }
            }
            catch {
                Write-Warning "Network security deployment failed: $($_.Exception.Message)"
                Write-Warning "Continuing with main deployment..."
            }
        }
        else {
            Write-Warning "Network security deployment script not found at: $networkSecurityScript"
        }
    }
    
    # If network security only mode, exit here
    if ($NetworkSecurityOnly) {
        Write-Success "Network security deployment completed!"
        return
    }
    
    $deployArgs = @("up", "--environment", $Environment)
    if ($Force) {
        $deployArgs += "--force"
    }

    azd @deployArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to deploy to Azure"
    }

    Write-Success "Deployment completed successfully!"
    
    # Validate network security deployment
    if (-not $SkipNetworkSecurity) {
        Write-Info "Validating network security configuration..."
        
        $networkTestScript = Join-Path $PSScriptRoot "Test-NetworkSecurity.ps1"
        if (Test-Path $networkTestScript) {
            try {
                & $networkTestScript -Environment $Environment -SubscriptionId $SubscriptionId
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Network security validation passed"
                }
                else {
                    Write-Warning "Network security validation completed with warnings"
                }
            }
            catch {
                Write-Warning "Network security validation failed: $($_.Exception.Message)"
            }
        }
    }
    
    # Get deployment outputs
    Write-Info "Retrieving deployment information..."
    $outputs = azd env get-values --output json | ConvertFrom-Json
    
    Write-Info "Deployment Summary:"
    Write-Info "==================="
    if ($outputs.APP_SERVICE_URL) {
        Write-Info "Application URL: $($outputs.APP_SERVICE_URL)"
    }
    if ($outputs.AZURE_RESOURCE_GROUP_NAME) {
        Write-Info "Resource Group: $($outputs.AZURE_RESOURCE_GROUP_NAME)"
    }
    if ($outputs.APPLICATION_INSIGHTS_NAME) {
        Write-Info "Application Insights: $($outputs.APPLICATION_INSIGHTS_NAME)"
    }
    
    Write-Success "Deployment completed successfully!"
    
}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
}
finally {
    # Cleanup
    Write-Info "Deployment script completed"
}
