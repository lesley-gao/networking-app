# Create VerificationDocuments Table Script
# This script calls the temporary endpoint to create the VerificationDocuments table

param(
    [string]$BaseUrl = "https://localhost:5001",
    [string]$Token = ""
)

Write-Host "Creating VerificationDocuments table..." -ForegroundColor Yellow

# If no token provided, try to get it from localStorage (you'll need to provide it manually)
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "Please provide your authentication token:" -ForegroundColor Cyan
    Write-Host "You can get this from your browser's developer tools -> Application -> Local Storage -> token" -ForegroundColor Gray
    $Token = Read-Host "Enter your token"
}

if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "No token provided. Exiting." -ForegroundColor Red
    exit 1
}

try {
    # Add SSL certificate validation bypass for development
    add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }

    $uri = "$BaseUrl/api/verification/create-table"
    
    Write-Host "Calling: $uri" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers
    
    Write-Host "Success! $($response.message)" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Table creation completed successfully!" -ForegroundColor Green 