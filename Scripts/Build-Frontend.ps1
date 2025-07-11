#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build and optimize React frontend for CDN deployment
.DESCRIPTION
    This script builds the React frontend with CDN-specific optimizations,
    including asset bundling, compression, and cache optimization.
.PARAMETER Environment
    The target environment (dev, test, prod)
.PARAMETER CdnBaseUrl
    The base CDN URL for the application
.PARAMETER StaticAssetsUrl
    The CDN URL for static assets
.PARAMETER ApiBaseUrl
    The base URL for the API
.PARAMETER OutputDir
    Custom output directory (default: build)
.EXAMPLE
    .\Build-Frontend.ps1 -Environment "prod" -CdnBaseUrl "https://mycdn.azureedge.net/app/"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$CdnBaseUrl,
    
    [Parameter(Mandatory = $false)]
    [string]$StaticAssetsUrl,
    
    [Parameter(Mandatory = $false)]
    [string]$ApiBaseUrl,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "build",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipInstall,
    
    [Parameter(Mandatory = $false)]
    [switch]$Analyze,
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport
)

# Set error handling
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Script configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir ".." "frontend"
$BuildOutputDir = Join-Path $FrontendDir $OutputDir

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "SUCCESS" { "Green" }
            default { "White" }
        }
    )
}

function Test-Prerequisites {
    Write-LogMessage "Checking prerequisites..."
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-LogMessage "Node.js version: $nodeVersion" "SUCCESS"
        
        # Check if version meets minimum requirements (16.x or higher)
        $version = [Version]($nodeVersion -replace 'v', '')
        if ($version.Major -lt 16) {
            Write-LogMessage "Node.js version 16 or higher is required" "ERROR"
            exit 1
        }
    }
    catch {
        Write-LogMessage "Node.js is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version
        Write-LogMessage "npm version: $npmVersion" "SUCCESS"
    }
    catch {
        Write-LogMessage "npm is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    # Check if frontend directory exists
    if (-not (Test-Path $FrontendDir)) {
        Write-LogMessage "Frontend directory not found: $FrontendDir" "ERROR"
        exit 1
    }
    
    # Check if package.json exists
    $packageJsonPath = Join-Path $FrontendDir "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-LogMessage "package.json not found in frontend directory" "ERROR"
        exit 1
    }
}

function Install-Dependencies {
    if ($SkipInstall) {
        Write-LogMessage "Skipping dependency installation as requested"
        return
    }
    
    Write-LogMessage "Installing npm dependencies..."
    
    Push-Location $FrontendDir
    try {
        # Check if node_modules exists and is recent
        $nodeModulesPath = Join-Path $FrontendDir "node_modules"
        $packageLockPath = Join-Path $FrontendDir "package-lock.json"
        
        $shouldInstall = $true
        if ((Test-Path $nodeModulesPath) -and (Test-Path $packageLockPath)) {
            $nodeModulesTime = (Get-Item $nodeModulesPath).LastWriteTime
            $packageLockTime = (Get-Item $packageLockPath).LastWriteTime
            
            if ($nodeModulesTime -gt $packageLockTime) {
                Write-LogMessage "Dependencies are up to date, skipping installation"
                $shouldInstall = $false
            }
        }
        
        if ($shouldInstall) {
            npm ci --silent
            Write-LogMessage "Dependencies installed successfully" "SUCCESS"
        }
    }
    catch {
        Write-LogMessage "Failed to install dependencies: $($_.Exception.Message)" "ERROR"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Set-EnvironmentConfiguration {
    Write-LogMessage "Configuring environment for $Environment..."
    
    # Set default URLs if not provided
    if (-not $CdnBaseUrl) {
        $CdnBaseUrl = switch ($Environment) {
            "dev" { "/" }
            "test" { "https://flightcompanion-test-cdn.azureedge.net/app/" }
            "prod" { "https://flightcompanion-prod-cdn.azureedge.net/app/" }
        }
    }
    
    if (-not $StaticAssetsUrl) {
        $StaticAssetsUrl = switch ($Environment) {
            "dev" { "/" }
            "test" { "https://flightcompanion-test-cdn.azureedge.net/static/" }
            "prod" { "https://flightcompanion-prod-cdn.azureedge.net/static/" }
        }
    }
    
    if (-not $ApiBaseUrl) {
        $ApiBaseUrl = switch ($Environment) {
            "dev" { "http://localhost:5000" }
            "test" { "https://flightcompanion-test-app.azurewebsites.net" }
            "prod" { "https://flightcompanion-prod-app.azurewebsites.net" }
        }
    }
    
    # Create environment configuration
    $envContent = @"
# CDN Configuration
VITE_CDN_BASE_URL=$CdnBaseUrl
VITE_CDN_STATIC_ASSETS_URL=$StaticAssetsUrl
VITE_CDN_APP_URL=$CdnBaseUrl

# API Configuration
VITE_API_BASE_URL=$ApiBaseUrl

# Environment
VITE_ENVIRONMENT=$Environment

# Feature Flags
VITE_ENABLE_ANALYTICS=$($Environment -eq 'prod' ? 'true' : 'false')
VITE_ENABLE_DEBUG=$($Environment -ne 'prod' ? 'true' : 'false')
VITE_ENABLE_MOCK_DATA=$($Environment -eq 'dev' ? 'true' : 'false')

# Performance
VITE_ENABLE_SW=$($Environment -eq 'prod' ? 'true' : 'false')
VITE_ENABLE_COMPRESSION=true

# Build Information
VITE_BUILD_VERSION=$((Get-Date).ToString('yyyyMMdd.HHmmss'))
VITE_BUILD_ENVIRONMENT=$Environment
VITE_BUILD_TIMESTAMP=$((Get-Date).ToString('yyyy-MM-ddTHH:mm:ssZ'))
"@
    
    $envPath = Join-Path $FrontendDir ".env.local"
    $envContent | Out-File $envPath -Encoding UTF8
    
    Write-LogMessage "Environment configuration created:" "SUCCESS"
    Write-LogMessage "  CDN Base URL: $CdnBaseUrl" "INFO"
    Write-LogMessage "  Static Assets URL: $StaticAssetsUrl" "INFO"
    Write-LogMessage "  API Base URL: $ApiBaseUrl" "INFO"
}

function Build-Application {
    Write-LogMessage "Building React application for $Environment..."
    
    Push-Location $FrontendDir
    try {
        # Set Node.js environment
        $env:NODE_ENV = "production"
        $env:GENERATE_SOURCEMAP = if ($Environment -eq "dev") { "true" } else { "false" }
        
        # Clean previous build
        if (Test-Path $BuildOutputDir) {
            Remove-Item $BuildOutputDir -Recurse -Force
            Write-LogMessage "Cleaned previous build directory"
        }
        
        # Run build
        Write-LogMessage "Running Vite build..."
        npm run build
        
        if (-not (Test-Path $BuildOutputDir)) {
            Write-LogMessage "Build failed - output directory not created" "ERROR"
            exit 1
        }
        
        Write-LogMessage "Build completed successfully" "SUCCESS"
        
        # Generate build report
        if ($GenerateReport) {
            Generate-BuildReport
        }
        
        # Run bundle analyzer if requested
        if ($Analyze) {
            Write-LogMessage "Running bundle analysis..."
            npm run analyze 2>$null
        }
    }
    catch {
        Write-LogMessage "Build failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Generate-BuildReport {
    Write-LogMessage "Generating build report..."
    
    try {
        # Get build directory size
        $buildSize = (Get-ChildItem $BuildOutputDir -Recurse | Measure-Object -Property Length -Sum).Sum
        $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
        
        # Get asset information
        $jsFiles = Get-ChildItem $BuildOutputDir -Recurse -Filter "*.js" | Measure-Object -Property Length -Sum
        $cssFiles = Get-ChildItem $BuildOutputDir -Recurse -Filter "*.css" | Measure-Object -Property Length -Sum
        $htmlFiles = Get-ChildItem $BuildOutputDir -Recurse -Filter "*.html" | Measure-Object -Property Length -Sum
        $imageFiles = Get-ChildItem $BuildOutputDir -Recurse -Include "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico", "*.webp" | Measure-Object -Property Length -Sum
        
        # Create build report
        $report = @"
# Build Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Environment: $Environment

## Build Statistics
- **Total Size**: $buildSizeMB MB
- **JavaScript**: $([math]::Round($jsFiles.Sum / 1KB, 2)) KB ($($jsFiles.Count) files)
- **CSS**: $([math]::Round($cssFiles.Sum / 1KB, 2)) KB ($($cssFiles.Count) files)
- **HTML**: $([math]::Round($htmlFiles.Sum / 1KB, 2)) KB ($($htmlFiles.Count) files)
- **Images**: $([math]::Round($imageFiles.Sum / 1KB, 2)) KB ($($imageFiles.Count) files)

## Configuration
- CDN Base URL: $CdnBaseUrl
- Static Assets URL: $StaticAssetsUrl
- API Base URL: $ApiBaseUrl

## Generated Files
### JavaScript Chunks
$(Get-ChildItem $BuildOutputDir -Recurse -Filter "*.js" | ForEach-Object { "- $($_.Name): $([math]::Round($_.Length / 1KB, 2)) KB" } | Out-String)

### CSS Files
$(Get-ChildItem $BuildOutputDir -Recurse -Filter "*.css" | ForEach-Object { "- $($_.Name): $([math]::Round($_.Length / 1KB, 2)) KB" } | Out-String)

---
Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Build Environment: $Environment
"@
        
        $reportPath = Join-Path $BuildOutputDir "build-report.md"
        $report | Out-File $reportPath -Encoding UTF8
        
        Write-LogMessage "Build report saved to: $reportPath" "SUCCESS"
        Write-LogMessage "Total build size: $buildSizeMB MB" "INFO"
    }
    catch {
        Write-LogMessage "Failed to generate build report: $($_.Exception.Message)" "WARN"
    }
}

function Optimize-Assets {
    Write-LogMessage "Optimizing assets for CDN delivery..."
    
    try {
        # Compress HTML files
        $htmlFiles = Get-ChildItem $BuildOutputDir -Recurse -Filter "*.html"
        foreach ($file in $htmlFiles) {
            $content = Get-Content $file.FullName -Raw
            # Minify HTML by removing extra whitespace
            $content = $content -replace '\s+', ' ' -replace '>\s+<', '><'
            $content | Out-File $file.FullName -Encoding UTF8 -NoNewline
        }
        
        Write-LogMessage "Optimized $($htmlFiles.Count) HTML files" "SUCCESS"
        
        # Create gzipped versions for better CDN performance
        $compressibleFiles = Get-ChildItem $BuildOutputDir -Recurse -Include "*.js", "*.css", "*.html", "*.json", "*.xml", "*.svg"
        
        $compressed = 0
        foreach ($file in $compressibleFiles) {
            $gzipPath = "$($file.FullName).gz"
            
            # Use .NET compression for better control
            $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
            $compressedBytes = [System.IO.Compression.GZipStream]::new([System.IO.MemoryStream]::new(), [System.IO.Compression.CompressionMode]::Compress)
            $compressedBytes.Write($bytes, 0, $bytes.Length)
            $compressedBytes.Close()
            
            # Only keep gzip if it's smaller
            $originalSize = $file.Length
            $compressedSize = $compressedBytes.BaseStream.Length
            
            if ($compressedSize -lt $originalSize) {
                [System.IO.File]::WriteAllBytes($gzipPath, $compressedBytes.BaseStream.ToArray())
                $compressed++
            }
            
            $compressedBytes.Dispose()
        }
        
        Write-LogMessage "Created $compressed gzipped files for CDN optimization" "SUCCESS"
    }
    catch {
        Write-LogMessage "Asset optimization failed: $($_.Exception.Message)" "WARN"
    }
}

function Main {
    Write-LogMessage "Starting frontend build for $Environment environment..."
    
    Test-Prerequisites
    Install-Dependencies
    Set-EnvironmentConfiguration
    Build-Application
    Optimize-Assets
    
    Write-LogMessage "Frontend build completed successfully!" "SUCCESS"
    Write-LogMessage "Build output: $BuildOutputDir" "INFO"
    
    if (Test-Path (Join-Path $BuildOutputDir "build-report.md")) {
        Write-LogMessage "Build report available at: $(Join-Path $BuildOutputDir 'build-report.md')" "INFO"
    }
}

# Execute main function
Main
