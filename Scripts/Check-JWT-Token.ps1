# Check-JWT-Token.ps1
# Script to decode and check JWT token contents

param(
    [string]$Token = ""
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
        # Split the token into parts
        $parts = $Token.Split('.')
        if ($parts.Length -ne 3) {
            Write-Log "Invalid JWT token format" "ERROR"
            return $null
        }
        
        # Decode the payload (second part)
        $payload = $parts[1]
        
        # Add padding if needed
        $padding = 4 - ($payload.Length % 4)
        if ($padding -ne 4) {
            $payload = $payload + ("=" * $padding)
        }
        
        # Convert from base64url to base64
        $payload = $payload.Replace('-', '+').Replace('_', '/')
        
        # Decode and parse JSON
        $bytes = [System.Convert]::FromBase64String($payload)
        $json = [System.Text.Encoding]::UTF8.GetString($bytes)
        $decoded = $json | ConvertFrom-Json
        
        return $decoded
    }
    catch {
        Write-Log "Error decoding JWT token: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Main execution
Write-Log "=== JWT Token Checker ===" "INFO"

if ([string]::IsNullOrEmpty($Token)) {
    Write-Log "No token provided. Please provide a JWT token to check." "WARN"
    Write-Log "Usage: .\Scripts\Check-JWT-Token.ps1 -Token 'your.jwt.token'" "INFO"
    Write-Log "Or get the token from your browser's localStorage" "INFO"
    exit 1
}

# Decode the token
$decoded = Decode-JWTToken -Token $Token

if ($decoded) {
    Write-Log "JWT Token decoded successfully!" "SUCCESS"
    Write-Log ""
    
    # Display token information
    Write-Log "Token Information:" "INFO"
    Write-Log "  Subject (User ID): $($decoded.sub)" "INFO"
    Write-Log "  Email: $($decoded.email)" "INFO"
    Write-Log "  Name: $($decoded.name)" "INFO"
    Write-Log "  Issued At: $($decoded.iat)" "INFO"
    Write-Log "  Expires At: $($decoded.exp)" "INFO"
    Write-Log ""
    
    # Check for roles
    Write-Log "Role Information:" "INFO"
    if ($decoded.role) {
        if ($decoded.role -is [array]) {
            Write-Log "  Roles found: $($decoded.role -join ', ')" "SUCCESS"
            $hasAdmin = $decoded.role -contains "Admin"
        }
        else {
            Write-Log "  Role found: $($decoded.role)" "SUCCESS"
            $hasAdmin = $decoded.role -eq "Admin"
        }
    }
    else {
        Write-Log "  No roles found in token" "WARN"
        $hasAdmin = $false
    }
    
    Write-Log ""
    if ($hasAdmin) {
        Write-Log "✓ Admin role detected! You should have admin access." "SUCCESS"
    }
    else {
        Write-Log "✗ Admin role not found. You may not have admin access." "WARN"
    }
    
    Write-Log ""
    Write-Log "Full token payload:" "INFO"
    $decoded | ConvertTo-Json -Depth 10
}
else {
    Write-Log "Failed to decode JWT token" "ERROR"
} 