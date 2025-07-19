# Test-AdminAccess.ps1
# Script to test admin access and debug admin role issues

param(
    [string]$BaseUrl = "https://localhost:5001",
    [string]$FrontendUrl = "http://localhost:3000"
)

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

# Function to decode JWT token
function Decode-JWTToken {
    param([string]$Token)
    
    try {
        $parts = $Token.Split('.')
        if ($parts.Length -ne 3) {
            return $null
        }
        
        $payload = $parts[1]
        $padding = 4 - ($payload.Length % 4)
        if ($padding -ne 4) {
            $payload = $payload + ("=" * $padding)
        }
        
        $payload = $payload.Replace('-', '+').Replace('_', '/')
        $bytes = [System.Convert]::FromBase64String($payload)
        $json = [System.Text.Encoding]::UTF8.GetString($bytes)
        $decoded = $json | ConvertFrom-Json
        
        return $decoded
    }
    catch {
        return $null
    }
}

# Main execution
Write-Log "=== Admin Access Test ===" "INFO"
Write-Log ""

# Step 1: Check if backend is running
Write-Log "Step 1: Checking backend availability..." "INFO"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -SkipCertificateCheck -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Log "✓ Backend is running" "SUCCESS"
    }
    else {
        Write-Log "✗ Backend returned status: $($response.StatusCode)" "ERROR"
    }
}
catch {
    Write-Log "✗ Backend is not accessible: $($_.Exception.Message)" "ERROR"
    Write-Log "Please make sure the backend is running on $BaseUrl" "WARN"
    exit 1
}

Write-Log ""

# Step 2: Check if frontend is running
Write-Log "Step 2: Checking frontend availability..." "INFO"
try {
    $response = Invoke-WebRequest -Uri "$FrontendUrl" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Log "✓ Frontend is running" "SUCCESS"
    }
    else {
        Write-Log "✗ Frontend returned status: $($response.StatusCode)" "ERROR"
    }
}
catch {
    Write-Log "✗ Frontend is not accessible: $($_.Exception.Message)" "ERROR"
    Write-Log "Please make sure the frontend is running on $FrontendUrl" "WARN"
}

Write-Log ""

# Step 3: Instructions for manual testing
Write-Log "Step 3: Manual Testing Instructions" "INFO"
Write-Log "1. Open your browser and go to: $FrontendUrl" "INFO"
Write-Log "2. Log in with admin credentials:" "INFO"
Write-Log "   Email: admin@flightcompanion.com" "INFO"
Write-Log "   Password: Admin@123!Development" "INFO"
Write-Log "3. After login, check the browser console for debug logs" "INFO"
Write-Log "4. Look for the AdminNavLink component in the top-right corner" "INFO"
Write-Log "5. If you see 'Not an admin user', click 'Show Debug' to see details" "INFO"
Write-Log ""

# Step 4: JWT Token Analysis Instructions
Write-Log "Step 4: JWT Token Analysis" "INFO"
Write-Log "To analyze your JWT token:" "INFO"
Write-Log "1. Open browser Developer Tools (F12)" "INFO"
Write-Log "2. Go to Application tab → Local Storage" "INFO"
Write-Log "3. Find the 'token' and copy it" "INFO"
Write-Log "4. Run: .\Scripts\Check-JWT-Token.ps1 -Token 'your.token.here'" "INFO"
Write-Log ""

# Step 5: Admin API Testing Instructions
Write-Log "Step 5: Admin API Testing" "INFO"
Write-Log "Once you have a valid token, test the admin API:" "INFO"
Write-Log "curl -H 'Authorization: Bearer YOUR_TOKEN' $BaseUrl/api/admin/health" "INFO"
Write-Log "curl -H 'Authorization: Bearer YOUR_TOKEN' $BaseUrl/api/admin/me" "INFO"
Write-Log ""

# Step 6: Common Issues and Solutions
Write-Log "Step 6: Common Issues and Solutions" "INFO"
Write-Log "If you see 'Access denied' on /admin:" "INFO"
Write-Log "- Check if the JWT token contains the 'Admin' role" "INFO"
Write-Log "- Make sure the admin user was created with the correct role" "INFO"
Write-Log "- Try logging out and logging back in" "INFO"
Write-Log ""
Write-Log "If you see 404 on /api/admin/*:" "INFO"
Write-Log "- Make sure the AdminController.cs file exists" "INFO"
Write-Log "- Restart the backend application" "INFO"
Write-Log ""

Write-Log "=== Test Complete ===" "INFO"
Write-Log "Follow the instructions above to debug your admin access issue." "INFO" 