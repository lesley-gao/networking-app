# Clear-And-Recreate-Database.ps1
# Script to clear the database and recreate it with admin account

param(
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Level) {
        "ERROR" { Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red }
        "WARN"  { Write-Host "[$timestamp] WARN:  $Message" -ForegroundColor Yellow }
        "SUCCESS" { Write-Host "[$timestamp] SUCCESS: $Message" -ForegroundColor Green }
        default { Write-Host "[$timestamp] INFO:  $Message" -ForegroundColor White }
    }
}

# Function to check if .NET is available
function Test-DotNetAvailability {
    try {
        $dotnetVersion = dotnet --version
        Write-Log ".NET version: $dotnetVersion" "SUCCESS"
        return $true
    }
    catch {
        Write-Log ".NET is not available. Please install .NET 8.0 or later." "ERROR"
        return $false
    }
}

# Function to clear database
function Clear-Database {
    Write-Log "Clearing existing database..."
    
    $dbPath = "backend/FlightCompanion.db"
    if (Test-Path $dbPath) {
        try {
            Remove-Item $dbPath -Force
            Write-Log "Database cleared successfully" "SUCCESS"
            return $true
        }
        catch {
            Write-Log "Failed to clear database: $($_.Exception.Message)" "ERROR"
            return $false
        }
    }
    else {
        Write-Log "Database file not found, nothing to clear" "INFO"
        return $true
    }
}

# Function to build the project
function Build-Project {
    Write-Log "Building the project..."
    
    try {
        $buildResult = dotnet build backend/NetworkingApp.csproj --configuration Debug --no-restore
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Project built successfully" "SUCCESS"
            return $true
        }
        else {
            Write-Log "Project build failed" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Build failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to run the application to recreate database
function Start-Application {
    Write-Log "Starting application to recreate database..."
    
    try {
        # Set environment variable for development
        $env:ASPNETCORE_ENVIRONMENT = "Development"
        
        # Run the application
        $process = Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "backend/NetworkingApp.csproj", "--configuration", "Debug" -PassThru -NoNewWindow
        
        # Wait for the application to start and seed
        Start-Sleep -Seconds 20
        
        # Stop the application
        if (!$process.HasExited) {
            Stop-Process -Id $process.Id -Force
            Write-Log "Application stopped" "INFO"
        }
        
        Write-Log "Database recreation completed" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Database recreation failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to validate admin account creation
function Test-AdminAccount {
    Write-Log "Validating admin account creation..."
    
    try {
        # Check if the database file exists
        $dbPath = "backend/FlightCompanion.db"
        if (Test-Path $dbPath) {
            Write-Log "Database file found: $dbPath" "SUCCESS"
            
            # Use SQLite command line to check for admin user
            if (Get-Command "sqlite3" -ErrorAction SilentlyContinue) {
                $adminCheck = sqlite3 $dbPath "SELECT COUNT(*) FROM AspNetUsers WHERE Email = 'admin@flightcompanion.com';"
                if ($adminCheck -eq "1") {
                    Write-Log "Admin account found in database" "SUCCESS"
                    return $true
                }
                else {
                    Write-Log "Admin account not found in database" "WARN"
                    return $false
                }
            }
            else {
                Write-Log "SQLite3 not available, cannot validate admin account" "WARN"
                return $true
            }
        }
        else {
            Write-Log "Database file not found: $dbPath" "WARN"
            return $false
        }
    }
    catch {
        Write-Log "Admin account validation failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to display admin credentials
function Show-AdminCredentials {
    Write-Log "=== ADMIN ACCOUNT CREDENTIALS ===" "SUCCESS"
    Write-Log "Email: admin@flightcompanion.com" "INFO"
    Write-Log "Password: Admin@123!Development" "INFO"
    Write-Log "Role: Admin" "INFO"
    Write-Log "================================" "SUCCESS"
}

# Main execution
Write-Log "Starting Database Clear and Recreate" "INFO"

# Check prerequisites
if (-not (Test-DotNetAvailability)) {
    exit 1
}

# Clear database
if (-not (Clear-Database)) {
    exit 1
}

# Build the project
if (-not (Build-Project)) {
    exit 1
}

# Start application to recreate database
if (-not (Start-Application)) {
    exit 1
}

# Validate admin account
if (-not (Test-AdminAccount)) {
    Write-Log "Admin account validation failed" "WARN"
}

# Show admin credentials
Show-AdminCredentials

Write-Log "Database clear and recreate completed!" "SUCCESS"
Write-Log "You can now start the application and log in with the admin credentials." "INFO" 