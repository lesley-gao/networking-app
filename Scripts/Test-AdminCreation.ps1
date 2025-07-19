# Test-AdminCreation.ps1
# Simple script to test admin account creation in development mode

Write-Host "=== Admin Account Creation Test ===" -ForegroundColor Green
Write-Host ""

Write-Host "This script will help you test admin account creation in development mode." -ForegroundColor Yellow
Write-Host ""

# Check if .NET is available
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET version: $dotnetVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ .NET is not available. Please install .NET 8.0 or later." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "To create the admin account:" -ForegroundColor Cyan
Write-Host "1. Run the application in development mode:" -ForegroundColor White
Write-Host "   dotnet run --project backend/NetworkingApp.csproj" -ForegroundColor Gray
Write-Host ""
Write-Host "2. The admin account will be created automatically with these credentials:" -ForegroundColor White
Write-Host "   Email: admin@flightcompanion.com" -ForegroundColor Gray
Write-Host "   Password: Admin@123!Development" -ForegroundColor Gray
Write-Host "   Role: Admin" -ForegroundColor Gray
Write-Host ""

Write-Host "3. You can then access the admin dashboard at:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000/admin" -ForegroundColor Gray
Write-Host "   Backend API: https://localhost:5001/api/admin/*" -ForegroundColor Gray
Write-Host ""

Write-Host "4. To verify the admin was created, look for this message in the console:" -ForegroundColor White
Write-Host "   [INFO] Admin user created successfully: admin@flightcompanion.com" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Ready to Test ===" -ForegroundColor Green
Write-Host "Run the application now to create the admin account!" -ForegroundColor Yellow 