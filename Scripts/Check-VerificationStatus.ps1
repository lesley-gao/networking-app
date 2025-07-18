# Check Verification Status Script

param(
    [string]$BaseUrl = "https://localhost:5001",
    [string]$Token = ""
)

Write-Host "Checking verification status..." -ForegroundColor Yellow

# If no token provided, prompt for it
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "Please provide your authentication token:" -ForegroundColor Cyan
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

    $uri = "$BaseUrl/api/verification/status"
    
    Write-Host "Calling: $uri" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    
    Write-Host "Verification Status:" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor Cyan
    if ($response.fileName) {
        Write-Host "File: $($response.fileName)" -ForegroundColor Cyan
    }
    if ($response.uploadedAt) {
        Write-Host "Uploaded: $($response.uploadedAt)" -ForegroundColor Cyan
    }
    if ($response.adminComment) {
        Write-Host "Admin Comment: $($response.adminComment)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
    }
    exit 1
} 