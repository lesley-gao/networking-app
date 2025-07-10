# React/TypeScript Code Coverage Script
# Generates comprehensive code coverage reports for the React frontend

param(
    [Parameter(Mandatory=$false)]
    [switch]$OpenReport,
    
    [Parameter(Mandatory=$false)]
    [int]$MinimumThreshold = 80,
    
    [Parameter(Mandatory=$false)]
    [switch]$CI
)

Write-Host "⚛️ Starting React Code Coverage Analysis..." -ForegroundColor Cyan

# Ensure we're in the ClientApp directory
$originalLocation = Get-Location
try {
    if (-not (Test-Path "ClientApp")) {
        Write-Error "ClientApp directory not found. Please run this script from the project root."
        exit 1
    }
    
    Set-Location "ClientApp"
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found in ClientApp directory."
        exit 1
    }
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm install failed"
            exit $LASTEXITCODE
        }
    }
    
    # Clean previous coverage data
    Write-Host "🧹 Cleaning previous coverage data..." -ForegroundColor Yellow
    if (Test-Path "coverage") {
        Remove-Item -Recurse -Force "coverage"
    }
    
    # Run tests with coverage
    Write-Host "🏃 Running React tests with coverage..." -ForegroundColor Green
    
    if ($CI) {
        $testCommand = "npm run test:coverage:ci"
    } else {
        $testCommand = "npm run test:coverage"
    }
    
    Write-Host "Executing: $testCommand" -ForegroundColor Gray
    Invoke-Expression $testCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Some tests may have failed, but continuing with coverage analysis..."
    }
    
    # Check if coverage was generated
    if (-not (Test-Path "coverage")) {
        Write-Error "Coverage directory not found. Test execution may have failed."
        exit 1
    }
    
    # Parse coverage results from coverage-summary.json
    Write-Host "📋 Parsing coverage results..." -ForegroundColor Blue
    
    $coverageSummaryPath = "coverage/coverage-summary.json"
    if (Test-Path $coverageSummaryPath) {
        try {
            $coverageData = Get-Content $coverageSummaryPath | ConvertFrom-Json
            $total = $coverageData.total
            
            $linesCoverage = [math]::Round($total.lines.pct, 2)
            $functionsCoverage = [math]::Round($total.functions.pct, 2)
            $branchesCoverage = [math]::Round($total.branches.pct, 2)
            $statementsCoverage = [math]::Round($total.statements.pct, 2)
            
            Write-Host "`n📊 Coverage Summary:" -ForegroundColor Cyan
            Write-Host "  Lines:      $linesCoverage%" -ForegroundColor $(if($linesCoverage -ge $MinimumThreshold) { "Green" } else { "Red" })
            Write-Host "  Functions:  $functionsCoverage%" -ForegroundColor $(if($functionsCoverage -ge $MinimumThreshold) { "Green" } else { "Red" })
            Write-Host "  Branches:   $branchesCoverage%" -ForegroundColor $(if($branchesCoverage -ge $MinimumThreshold) { "Green" } else { "Red" })
            Write-Host "  Statements: $statementsCoverage%" -ForegroundColor $(if($statementsCoverage -ge $MinimumThreshold) { "Green" } else { "Red" })
            Write-Host "  Minimum Threshold: $MinimumThreshold%" -ForegroundColor White
            
            # Check if all thresholds are met
            $allThresholdsMet = $linesCoverage -ge $MinimumThreshold -and 
                               $functionsCoverage -ge $MinimumThreshold -and 
                               $branchesCoverage -ge $MinimumThreshold -and 
                               $statementsCoverage -ge $MinimumThreshold
            
            if ($allThresholdsMet) {
                Write-Host "`n✅ All coverage thresholds met!" -ForegroundColor Green
                $exitCode = 0
            } else {
                Write-Host "`n❌ Some coverage thresholds not met!" -ForegroundColor Red
                Write-Host "Required: All metrics >= $MinimumThreshold%" -ForegroundColor Red
                $exitCode = 1
            }
            
            # Generate coverage badge
            Write-Host "🏆 Generating coverage badge..." -ForegroundColor Green
            $averageCoverage = [math]::Round(($linesCoverage + $functionsCoverage + $branchesCoverage + $statementsCoverage) / 4, 2)
            $badgeColor = if($averageCoverage -ge $MinimumThreshold) { "brightgreen" } else { "red" }
            $badgeUrl = "https://img.shields.io/badge/frontend_coverage-$averageCoverage%25-$badgeColor"
            $badgeFile = "coverage/frontend-coverage-badge.svg"
            
            try {
                Invoke-WebRequest -Uri $badgeUrl -OutFile $badgeFile -ErrorAction SilentlyContinue
                Write-Host "Badge saved to: $badgeFile" -ForegroundColor Gray
            } catch {
                Write-Warning "Could not generate coverage badge"
            }
            
        } catch {
            Write-Warning "Could not parse coverage summary. Check the JSON file manually."
            $exitCode = 0
        }
    } else {
        Write-Warning "Coverage summary not found at $coverageSummaryPath"
        $exitCode = 0
    }
    
    # Output file locations
    Write-Host "`n📁 Coverage Reports Generated:" -ForegroundColor Cyan
    Write-Host "  HTML Report: coverage/lcov-report/index.html" -ForegroundColor White
    Write-Host "  LCOV Report: coverage/lcov.info" -ForegroundColor White
    Write-Host "  JSON Report: coverage/coverage-final.json" -ForegroundColor White
    
    # Open report if requested
    if ($OpenReport -and (Test-Path "coverage/lcov-report/index.html")) {
        Write-Host "`n🌐 Opening coverage report in browser..." -ForegroundColor Green
        Start-Process "coverage/lcov-report/index.html"
    }
    
    Write-Host "`n✨ React Code Coverage Analysis Complete!" -ForegroundColor Cyan
    
} finally {
    Set-Location $originalLocation
}

exit $exitCode
