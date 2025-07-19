# Admin Account Setup

## Overview

The admin account is automatically created when running the application in development mode. This provides easy access to admin functionality for testing and development.

## Quick Setup

### 1. Run the Application

```bash
# Navigate to the project directory
cd "D:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"

# Run the backend in development mode
dotnet run --project backend/NetworkingApp.csproj
```

### 2. Admin Account Details

The admin account is created automatically with these credentials:

- **Email**: `admin@flightcompanion.com`
- **Password**: `Admin@123!Development`
- **Role**: `Admin`
- **Name**: System Administrator

### 3. Access Admin Features

After logging in with the admin credentials, you can access:

- **Frontend Admin Dashboard**: `http://localhost:3000/admin`
- **Backend Admin API**: `https://localhost:5001/api/admin/*`

## Admin Dashboard Features

The admin dashboard includes:

1. **User Management**
   - View all users
   - Edit user information
   - Activate/deactivate users
   - Verify user accounts

2. **Verification Management**
   - Review pending verification documents
   - Approve or reject user verifications

3. **Dispute Management**
   - View all disputes
   - Resolve disputes with admin notes
   - Handle refunds and payments

4. **Platform Monitoring**
   - System health metrics
   - Activity logs
   - Performance monitoring

## Verification

To verify the admin account was created successfully, look for this message in the console:

```
[INFO] Admin user created successfully: admin@flightcompanion.com
```

## Security Notes

- The admin password should be changed after first login
- This is for development/testing purposes only
- In production, use proper security measures

## Troubleshooting

If the admin account is not created:

1. **Check the console output** for any error messages
2. **Verify the database** exists and is accessible
3. **Check if the admin already exists** - the seeder won't create duplicates
4. **Restart the application** to trigger seeding again

## Testing Script

Run the test script to get setup instructions:

```powershell
.\Scripts\Test-AdminCreation.ps1
``` 