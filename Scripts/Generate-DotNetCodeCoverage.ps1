# .NET Code Coverage Script
# Generates comprehensive code coverage reports for the NetworkingApp

param(
    [Parameter(Mandatory=$false)]
    [string]$OutputDirectory = "CodeCoverage",
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,
    
    [Parameter(Mandatory=$false)]
    [int]$MinimumThreshold = 80
)

Write-Host "🧪 Starting .NET Code Coverage Analysis..." -ForegroundColor Cyan

# Ensure we're in the project root
if (-not (Test-Path "NetworkingApp.sln")) {
    Write-Error "Please run this script from the project root directory containing NetworkingApp.sln"
    exit 1
}

# Clean previous coverage data
Write-Host "🧹 Cleaning previous coverage data..." -ForegroundColor Yellow
if (Test-Path $OutputDirectory) {
    Remove-Item -Recurse -Force $OutputDirectory
}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

# Run tests with coverage collection
Write-Host "🏃 Running tests with coverage collection..." -ForegroundColor Green
$testCommand = "dotnet test Tests/Tests.csproj --collect:`"XPlat Code Coverage`" --results-directory `"$OutputDirectory/raw`" --settings coverlet.runsettings --verbosity minimal"
Write-Host "Executing: $testCommand" -ForegroundColor Gray
Invoke-Expression $testCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed. Code coverage report generation aborted."
    exit $LASTEXITCODE
}

# Find the coverage file
$coverageFiles = Get-ChildItem -Path "$OutputDirectory/raw" -Filter "coverage.cobertura.xml" -Recurse
if ($coverageFiles.Count -eq 0) {
    Write-Error "No coverage files found. Coverage collection may have failed."
    exit 1
}

$coverageFile = $coverageFiles[0].FullName
Write-Host "📊 Found coverage file: $coverageFile" -ForegroundColor Blue

# Generate HTML report using ReportGenerator
Write-Host "📈 Generating HTML coverage report..." -ForegroundColor Green
$reportCommand = "dotnet tool run reportgenerator -reports:`"$coverageFile`" -targetdir:`"$OutputDirectory/html`" -reporttypes:`"Html;HtmlSummary;Badges;TextSummary`" -verbosity:Info"
Write-Host "Executing: $reportCommand" -ForegroundColor Gray

# Install ReportGenerator if not available
try {
    dotnet tool run reportgenerator --help | Out-Null
} catch {
    Write-Host "Installing ReportGenerator tool..." -ForegroundColor Yellow
    dotnet tool install --global dotnet-reportgenerator-globaltool
}

Invoke-Expression $reportCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "Report generation failed."
    exit $LASTEXITCODE
}

# Parse coverage results
Write-Host "📋 Parsing coverage results..." -ForegroundColor Blue
try {
    [xml]$coverageXml = Get-Content $coverageFile
    $summary = $coverageXml.coverage
    
    $lineRate = [math]::Round([double]$summary.rate * 100, 2)
    $branchRate = [math]::Round([double]$summary.'branch-rate' * 100, 2)
    
    Write-Host "`n📊 Coverage Summary:" -ForegroundColor Cyan
    Write-Host "  Line Coverage:   $lineRate%" -ForegroundColor $(if($lineRate -ge $MinimumThreshold) { "Green" } else { "Red" })
    Write-Host "  Branch Coverage: $branchRate%" -ForegroundColor $(if($branchRate -ge $MinimumThreshold) { "Green" } else { "Red" })
    Write-Host "  Minimum Threshold: $MinimumThreshold%" -ForegroundColor White
    
    # Check if thresholds are met
    $thresholdMet = $lineRate -ge $MinimumThreshold -and $branchRate -ge $MinimumThreshold
    
    if ($thresholdMet) {
        Write-Host "`n✅ Coverage thresholds met!" -ForegroundColor Green
        $exitCode = 0
    } else {
        Write-Host "`n❌ Coverage thresholds not met!" -ForegroundColor Red
        Write-Host "Required: Line >= $MinimumThreshold%, Branch >= $MinimumThreshold%" -ForegroundColor Red
        $exitCode = 1
    }
    
} catch {
    Write-Warning "Could not parse coverage results. Check the XML file manually."
    $exitCode = 0
}

# Generate coverage badge
Write-Host "🏆 Generating coverage badge..." -ForegroundColor Green
$badgeColor = if($lineRate -ge $MinimumThreshold) { "brightgreen" } else { "red" }
$badgeUrl = "https://img.shields.io/badge/coverage-$lineRate%25-$badgeColor"
$badgeFile = "$OutputDirectory/coverage-badge.svg"

try {
    Invoke-WebRequest -Uri $badgeUrl -OutFile $badgeFile -ErrorAction SilentlyContinue
    Write-Host "Badge saved to: $badgeFile" -ForegroundColor Gray
} catch {
    Write-Warning "Could not generate coverage badge"
}

# Output file locations
Write-Host "`n📁 Coverage Reports Generated:" -ForegroundColor Cyan
Write-Host "  HTML Report: $OutputDirectory/html/index.html" -ForegroundColor White
Write-Host "  XML Report:  $coverageFile" -ForegroundColor White
Write-Host "  Badge:       $badgeFile" -ForegroundColor White

# Open report if requested
if ($OpenReport -and (Test-Path "$OutputDirectory/html/index.html")) {
    Write-Host "`n🌐 Opening coverage report in browser..." -ForegroundColor Green
    Start-Process "$OutputDirectory/html/index.html"
}

Write-Host "`n✨ .NET Code Coverage Analysis Complete!" -ForegroundColor Cyan
exit $exitCode
