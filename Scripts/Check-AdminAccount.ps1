# Check-AdminAccount.ps1
# Script to check if admin account exists in the database

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

# Function to check database
function Check-Database {
    $dbPath = "backend/FlightCompanion.db"
    
    if (-not (Test-Path $dbPath)) {
        Write-Log "Database file not found: $dbPath" "ERROR"
        return $false
    }
    
    Write-Log "Database file found: $dbPath" "SUCCESS"
    return $true
}

# Function to check admin account
function Check-AdminAccount {
    $dbPath = "backend/FlightCompanion.db"
    
    if (Get-Command "sqlite3" -ErrorAction SilentlyContinue) {
        try {
            # Check if admin user exists
            $adminCheck = sqlite3 $dbPath "SELECT COUNT(*) FROM AspNetUsers WHERE Email = 'admin@flightcompanion.com';"
            
            if ($adminCheck -eq "1") {
                Write-Log "Admin account exists in database" "SUCCESS"
                
                # Get admin user details
                $adminDetails = sqlite3 $dbPath "SELECT Id, Email, FirstName, LastName, IsVerified, IsActive FROM AspNetUsers WHERE Email = 'admin@flightcompanion.com';"
                Write-Log "Admin details: $adminDetails" "INFO"
                
                # Check if admin has Admin role
                $adminRoleCheck = sqlite3 $dbPath "SELECT COUNT(*) FROM AspNetUserRoles ur JOIN AspNetRoles r ON ur.RoleId = r.Id JOIN AspNetUsers u ON ur.UserId = u.Id WHERE u.Email = 'admin@flightcompanion.com' AND r.Name = 'Admin';"
                
                if ($adminRoleCheck -eq "1") {
                    Write-Log "Admin user has Admin role" "SUCCESS"
                }
                else {
                    Write-Log "Admin user does not have Admin role" "WARN"
                }
                
                return $true
            }
            else {
                Write-Log "Admin account not found in database" "ERROR"
                return $false
            }
        }
        catch {
            Write-Log "Error checking admin account: $($_.Exception.Message)" "ERROR"
            return $false
        }
    }
    else {
        Write-Log "SQLite3 not available, cannot check admin account" "WARN"
        return $false
    }
}

# Function to check all users
function Check-AllUsers {
    $dbPath = "backend/FlightCompanion.db"
    
    if (Get-Command "sqlite3" -ErrorAction SilentlyContinue) {
        try {
            $userCount = sqlite3 $dbPath "SELECT COUNT(*) FROM AspNetUsers;"
            Write-Log "Total users in database: $userCount" "INFO"
            
            $users = sqlite3 $dbPath "SELECT Id, Email, FirstName, LastName FROM AspNetUsers LIMIT 10;"
            Write-Log "First 10 users:" "INFO"
            Write-Log $users "INFO"
        }
        catch {
            Write-Log "Error checking users: $($_.Exception.Message)" "ERROR"
        }
    }
}

# Function to check roles
function Check-Roles {
    $dbPath = "backend/FlightCompanion.db"
    
    if (Get-Command "sqlite3" -ErrorAction SilentlyContinue) {
        try {
            $roles = sqlite3 $dbPath "SELECT Name FROM AspNetRoles;"
            Write-Log "Available roles: $roles" "INFO"
        }
        catch {
            Write-Log "Error checking roles: $($_.Exception.Message)" "ERROR"
        }
    }
}

# Main execution
Write-Log "=== Admin Account Check ===" "INFO"

# Check database
if (-not (Check-Database)) {
    exit 1
}

# Check admin account
$adminExists = Check-AdminAccount

# Check all users
Check-AllUsers

# Check roles
Check-Roles

Write-Log "=== Check Complete ===" "INFO"

if ($adminExists) {
    Write-Log "Admin account exists. You should be able to log in with:" "SUCCESS"
    Write-Log "Email: admin@flightcompanion.com" "INFO"
    Write-Log "Password: Admin@123!Development" "INFO"
}
else {
    Write-Log "Admin account does not exist. You need to recreate the database." "WARN"
    Write-Log "Run: .\Scripts\Clear-And-Recreate-Database.ps1" "INFO"
} 