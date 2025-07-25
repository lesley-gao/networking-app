# Check-JWT-Token-Simple.ps1
# Simple script to decode and check JWT token contents

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
        $parts = $Token.Split('.')
        if ($parts.Length -ne 3) {
            Write-Log "Invalid JWT token format" "ERROR"
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
        Write-Log "Error decoding JWT token: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Main execution
Write-Log "=== JWT Token Checker ===" "INFO"

if ([string]::IsNullOrEmpty($Token)) {
    Write-Log "No token provided. Please provide a JWT token to check." "WARN"
    Write-Log "Usage: .\Scripts\Check-JWT-Token-Simple.ps1 -Token 'your.jwt.token'" "INFO"
    exit 1
}

$decoded = Decode-JWTToken -Token $Token

if ($decoded) {
    Write-Log "JWT Token decoded successfully!" "SUCCESS"
    Write-Log ""
    
    Write-Log "Token Information:" "INFO"
    Write-Log "  Subject (User ID): $($decoded.sub)" "INFO"
    Write-Log "  Email: $($decoded.email)" "INFO"
    Write-Log "  Name: $($decoded.name)" "INFO"
    Write-Log ""
    
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
        Write-Log "Admin role detected! You should have admin access." "SUCCESS"
    }
    else {
        Write-Log "Admin role not found. You may not have admin access." "WARN"
    }
    
    Write-Log ""
    Write-Log "Full token payload:" "INFO"
    $decoded | ConvertTo-Json -Depth 10
}
else {
    Write-Log "Failed to decode JWT token" "ERROR"
} 