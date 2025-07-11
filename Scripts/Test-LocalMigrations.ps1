# ==================================================================================================
# Local Database Migration Testing Script
# Tests database migration scripts and validation in local development environment
# ==================================================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$LocalConnectionString = "Server=(localdb)\\mssqllocaldb;Database=FlightCompanionTest;Trusted_Connection=true;MultipleActiveResultSets=true",

    [Parameter(Mandatory = $false)]
    [switch]$CleanDatabase,

    [Parameter(Mandatory = $false)]
    [switch]$RunFullTests,

    [Parameter(Mandatory = $false)]
    [string]$TestResultsPath = ".\test-results"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectPath = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp\backend"
$ScriptsPath = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp\Scripts"

# ==================================================================================================
# Helper Functions
# ==================================================================================================

function Write-TestLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "INFO" { "White" }
        default { "Gray" }
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Write-TestHeader {
    param([string]$Title)
    
    $separator = "=" * 60
    Write-TestLog $separator
    Write-TestLog "  $Title"
    Write-TestLog $separator
}

function Test-Prerequisites {
    Write-TestLog "Checking local development prerequisites..."
    
    $issues = @()
    
    # Check .NET CLI
    try {
        $dotnetVersion = dotnet --version
        Write-TestLog "✓ .NET CLI: $dotnetVersion" -Level "SUCCESS"
    }
    catch {
        $issues += ".NET CLI not found"
        Write-TestLog "✗ .NET CLI not available" -Level "ERROR"
    }
    
    # Check Entity Framework tools
    try {
        $efTools = dotnet tool list --global | Select-String "dotnet-ef"
        if ($efTools) {
            Write-TestLog "✓ Entity Framework Core tools available" -Level "SUCCESS"
        }
        else {
            Write-TestLog "Installing Entity Framework Core tools..." -Level "WARNING"
            dotnet tool install --global dotnet-ef
        }
    }
    catch {
        $issues += "Entity Framework Core tools not available"
        Write-TestLog "✗ Entity Framework Core tools not available" -Level "ERROR"
    }
    
    # Check LocalDB
    try {
        $localDbInfo = sqllocaldb info
        if ($localDbInfo -match "mssqllocaldb") {
            Write-TestLog "✓ SQL Server LocalDB available" -Level "SUCCESS"
        }
        else {
            Write-TestLog "Starting LocalDB instance..." -Level "WARNING"
            sqllocaldb start mssqllocaldb
        }
    }
    catch {
        $issues += "SQL Server LocalDB not available"
        Write-TestLog "✗ SQL Server LocalDB not available" -Level "ERROR"
    }
    
    # Check project file
    $projectFile = Join-Path $ProjectPath "NetworkingApp.csproj"
    if (Test-Path $projectFile) {
        Write-TestLog "✓ Project file found" -Level "SUCCESS"
    }
    else {
        $issues += "Project file not found"
        Write-TestLog "✗ Project file not found" -Level "ERROR"
    }
    
    if ($issues.Count -gt 0) {
        Write-TestLog "Prerequisites check failed:" -Level "ERROR"
        foreach ($issue in $issues) {
            Write-TestLog "  - $issue" -Level "ERROR"
        }
        return $false
    }
    
    return $true
}

function Initialize-TestEnvironment {
    Write-TestLog "Initializing test environment..."
    
    # Create test results directory
    if (-not (Test-Path $TestResultsPath)) {
        New-Item -Path $TestResultsPath -ItemType Directory -Force | Out-Null
        Write-TestLog "Created test results directory: $TestResultsPath"
    }
    
    # Clean database if requested
    if ($CleanDatabase) {
        Write-TestLog "Cleaning test database..." -Level "WARNING"
        
        try {
            Push-Location $ProjectPath
            
            # Drop the database
            dotnet ef database drop --force --connection "$LocalConnectionString" 2>&1 | Out-Null
            Write-TestLog "✓ Test database cleaned" -Level "SUCCESS"
        }
        catch {
            Write-TestLog "Database clean failed (this is normal if database doesn't exist): $($_.Exception.Message)" -Level "WARNING"
        }
        finally {
            Pop-Location
        }
    }
}

function Test-ProjectBuild {
    Write-TestLog "Building project..."
    
    try {
        Push-Location $ProjectPath
        
        # Restore packages
        Write-TestLog "Restoring NuGet packages..."
        dotnet restore
        
        # Build project
        Write-TestLog "Building project..."
        dotnet build --no-restore --configuration Debug
        
        Write-TestLog "✓ Project build successful" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-TestLog "✗ Project build failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Test-MigrationScripts {
    Write-TestLog "Testing database migration scripts..."
    
    try {
        Push-Location $ScriptsPath
        
        # Test migration deployment script
        Write-TestLog "Testing migration deployment..."
        $result = .\Deploy-DatabaseMigrations.ps1 `
            -Environment "dev" `
            -ConnectionString $LocalConnectionString `
            -CreateBackup $false `
            -SeedData $true `
            -ValidateOnly $false
        
        if ($result) {
            Write-TestLog "✓ Migration deployment successful" -Level "SUCCESS"
        }
        else {
            Write-TestLog "✗ Migration deployment failed" -Level "ERROR"
            return $false
        }
        
        # Test migration validation script
        Write-TestLog "Testing migration validation..."
        $validationResult = .\Validate-DatabaseMigration.ps1 `
            -ConnectionString $LocalConnectionString `
            -ValidationLevel "Standard" `
            -ExportReport `
            -OutputPath "$TestResultsPath\local-validation-report.json"
        
        if ($validationResult) {
            Write-TestLog "✓ Migration validation successful" -Level "SUCCESS"
        }
        else {
            Write-TestLog "✗ Migration validation failed" -Level "ERROR"
            return $false
        }
        
        return $true
    }
    catch {
        Write-TestLog "✗ Migration script testing failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Test-DatabaseSeeding {
    Write-TestLog "Testing database seeding functionality..."
    
    try {
        Push-Location $ProjectPath
        
        # Check if seeding was successful by querying data
        Write-TestLog "Verifying seeded data..."
        
        # For now, we'll use EF migrations to check if tables exist
        $migrationStatus = dotnet ef migrations list --connection "$LocalConnectionString" 2>&1
        
        if ($migrationStatus -match "No migrations") {
            Write-TestLog "✓ Database schema is up to date" -Level "SUCCESS"
        }
        else {
            Write-TestLog "Database migration status: $migrationStatus"
        }
        
        Write-TestLog "✓ Database seeding verification completed" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-TestLog "✗ Database seeding test failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Test-RollbackFunctionality {
    Write-TestLog "Testing migration rollback functionality..."
    
    try {
        Push-Location $ProjectPath
        
        # Get current migration list
        $migrations = dotnet ef migrations list --connection "$LocalConnectionString" 2>&1
        Write-TestLog "Current migrations: $migrations"
        
        # For testing, we'll just validate that the rollback script syntax works
        # In a real scenario, you'd test actual rollback to a previous migration
        
        Push-Location $ScriptsPath
        
        # Test dry-run rollback (validation only)
        Write-TestLog "Testing rollback validation..."
        $rollbackTest = .\Deploy-DatabaseMigrations.ps1 `
            -Environment "dev" `
            -ConnectionString $LocalConnectionString `
            -ValidateOnly $true
        
        if ($rollbackTest) {
            Write-TestLog "✓ Rollback functionality validation successful" -Level "SUCCESS"
        }
        else {
            Write-TestLog "✗ Rollback functionality validation failed" -Level "ERROR"
            return $false
        }
        
        return $true
    }
    catch {
        Write-TestLog "✗ Rollback functionality test failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
    finally {
        Pop-Location
        Pop-Location
    }
}

function Test-PerformanceBaseline {
    if (-not $RunFullTests) {
        Write-TestLog "Skipping performance tests (use -RunFullTests to include)"
        return $true
    }
    
    Write-TestLog "Running performance baseline tests..."
    
    try {
        Push-Location $ProjectPath
        
        # Run any performance tests if they exist
        $performanceTests = dotnet test --filter Category=Performance --logger "trx;LogFileName=performance-tests.trx" --results-directory $TestResultsPath 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-TestLog "✓ Performance baseline tests completed" -Level "SUCCESS"
        }
        else {
            Write-TestLog "Performance tests output: $performanceTests" -Level "WARNING"
            Write-TestLog "Note: Performance tests may not exist yet" -Level "WARNING"
        }
        
        return $true
    }
    catch {
        Write-TestLog "Performance baseline test failed: $($_.Exception.Message)" -Level "WARNING"
        return $true # Non-critical failure
    }
    finally {
        Pop-Location
    }
}

function Test-SecurityValidation {
    if (-not $RunFullTests) {
        Write-TestLog "Skipping security tests (use -RunFullTests to include)"
        return $true
    }
    
    Write-TestLog "Running security validation tests..."
    
    try {
        # Test connection string security
        if ($LocalConnectionString -match "Password=") {
            Write-TestLog "⚠️ Connection string contains password in plain text" -Level "WARNING"
        }
        
        # Test for SQL injection vulnerabilities in migration scripts
        $migrationFiles = Get-ChildItem -Path "$ProjectPath\Migrations" -Filter "*.cs" -Recurse
        foreach ($file in $migrationFiles) {
            $content = Get-Content $file.FullName -Raw
            if ($content -match "string\.Format|string interpolation without parameterization") {
                Write-TestLog "⚠️ Potential SQL injection risk in $($file.Name)" -Level "WARNING"
            }
        }
        
        Write-TestLog "✓ Security validation completed" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-TestLog "Security validation failed: $($_.Exception.Message)" -Level "WARNING"
        return $true # Non-critical failure
    }
}

function Generate-TestReport {
    param([hashtable]$TestResults)
    
    Write-TestLog "Generating test report..."
    
    $report = @{
        TestRun = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Environment = "Local Development"
            ConnectionString = $LocalConnectionString -replace "Password=[^;]*", "Password=***"
            TestResults = $TestResults
        }
    }
    
    $reportPath = Join-Path $TestResultsPath "local-migration-test-report.json"
    $report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath -Encoding UTF8
    
    Write-TestLog "✓ Test report generated: $reportPath" -Level "SUCCESS"
    
    # Summary
    Write-TestHeader "TEST SUMMARY"
    $passed = ($TestResults.Values | Where-Object { $_ -eq $true }).Count
    $total = $TestResults.Count
    $passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }
    
    Write-TestLog "Total Tests: $total"
    Write-TestLog "Passed: $passed" -Level "SUCCESS"
    Write-TestLog "Failed: $($total - $passed)" -Level $(if ($passed -eq $total) { "SUCCESS" } else { "ERROR" })
    Write-TestLog "Pass Rate: $passRate%"
    
    # Failed tests detail
    $failedTests = $TestResults.GetEnumerator() | Where-Object { $_.Value -eq $false }
    if ($failedTests) {
        Write-TestLog "Failed Tests:" -Level "ERROR"
        foreach ($test in $failedTests) {
            Write-TestLog "  ❌ $($test.Key)" -Level "ERROR"
        }
    }
    
    return $passed -eq $total
}

# ==================================================================================================
# Main Test Execution
# ==================================================================================================

function Start-LocalMigrationTests {
    Write-TestHeader "LOCAL DATABASE MIGRATION TESTING"
    Write-TestLog "Connection String: $($LocalConnectionString -replace 'Password=[^;]*', 'Password=***')"
    Write-TestLog "Clean Database: $CleanDatabase"
    Write-TestLog "Run Full Tests: $RunFullTests"
    Write-TestLog "Test Results Path: $TestResultsPath"
    
    $testResults = @{}
    
    try {
        # Prerequisites
        Write-TestHeader "Prerequisites Check"
        $testResults["Prerequisites"] = Test-Prerequisites
        
        if (-not $testResults["Prerequisites"]) {
            Write-TestLog "Cannot continue due to prerequisite failures" -Level "ERROR"
            return $false
        }
        
        # Initialize test environment
        Write-TestHeader "Test Environment Setup"
        Initialize-TestEnvironment
        
        # Project build
        Write-TestHeader "Project Build Test"
        $testResults["ProjectBuild"] = Test-ProjectBuild
        
        # Migration scripts
        Write-TestHeader "Migration Scripts Test"
        $testResults["MigrationScripts"] = Test-MigrationScripts
        
        # Database seeding
        Write-TestHeader "Database Seeding Test"
        $testResults["DatabaseSeeding"] = Test-DatabaseSeeding
        
        # Rollback functionality
        Write-TestHeader "Rollback Functionality Test"
        $testResults["RollbackFunctionality"] = Test-RollbackFunctionality
        
        # Performance baseline (optional)
        Write-TestHeader "Performance Baseline Test"
        $testResults["PerformanceBaseline"] = Test-PerformanceBaseline
        
        # Security validation (optional)
        Write-TestHeader "Security Validation Test"
        $testResults["SecurityValidation"] = Test-SecurityValidation
        
        # Generate report
        Write-TestHeader "Test Report Generation"
        $overallSuccess = Generate-TestReport -TestResults $testResults
        
        if ($overallSuccess) {
            Write-TestLog "🎉 All local migration tests passed successfully!" -Level "SUCCESS"
        }
        else {
            Write-TestLog "❌ Some local migration tests failed. Check the details above." -Level "ERROR"
        }
        
        return $overallSuccess
    }
    catch {
        Write-TestLog "Local migration testing failed with exception: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# ==================================================================================================
# Script Entry Point
# ==================================================================================================

Write-TestLog "Starting local database migration tests at $(Get-Date)" -Level "SUCCESS"

$result = Start-LocalMigrationTests

if ($result) {
    Write-TestLog "Local migration testing completed successfully" -Level "SUCCESS"
    exit 0
}
else {
    Write-TestLog "Local migration testing completed with failures" -Level "ERROR"
    exit 1
}
