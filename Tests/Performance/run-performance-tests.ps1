# Performance Test Runner Script
# Tests/Performance/run-performance-tests.ps1

param(
    [string]$TestType = "all"
)

Write-Host "NetworkingApp Performance Test Runner" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent (Split-Path -Parent $projectPath)

Set-Location $rootPath

switch ($TestType.ToLower()) {
    "unit" {
        Write-Host "Running Unit Performance Tests..." -ForegroundColor Yellow
        dotnet test Tests --filter "Category=Performance&Category!=LoadTest" --logger "console;verbosity=normal"
    }
    "load" {
        Write-Host "Running Load Tests..." -ForegroundColor Yellow
        dotnet test Tests --filter Category=LoadTest --logger "console;verbosity=normal"
    }
    "benchmark" {
        Write-Host "Running Benchmark Tests..." -ForegroundColor Yellow
        dotnet run --project Tests --configuration Release -- benchmark
    }
    "all" {
        Write-Host "Running All Performance Tests..." -ForegroundColor Yellow
        
        Write-Host "`n1. Unit Performance Tests" -ForegroundColor Cyan
        dotnet test Tests --filter "Category=Performance&Category!=LoadTest" --logger "console;verbosity=normal"
        
        Write-Host "`n2. Load Tests" -ForegroundColor Cyan
        dotnet test Tests --filter Category=LoadTest --logger "console;verbosity=normal"
        
        Write-Host "`n3. Benchmark Tests" -ForegroundColor Cyan
        dotnet run --project Tests --configuration Release -- benchmark
    }
    default {
        Write-Host "Invalid test type. Available options:" -ForegroundColor Red
        Write-Host "  unit      - Run unit performance tests"
        Write-Host "  load      - Run load tests"
        Write-Host "  benchmark - Run benchmark tests"
        Write-Host "  all       - Run all performance tests"
    }
}

Write-Host "`nPerformance tests completed!" -ForegroundColor Green
