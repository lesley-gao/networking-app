# ASP.NET Core Identity Configuration

## Overview
This document describes the configuration and implementation of ASP.NET Core Identity for WingCompanion.

## Key Features
- Strongly-typed User model extending `IdentityUser<int>`
- Role-based authorization with Admin, Helper, and User roles
- Secure password and lockout policies
- Entity Framework Core integration for persistence
- Role management service for initialization and assignment

## Implementation Details

### 1. User Model
- `Models/User.cs` extends `IdentityUser<int>`
- Includes additional properties: FirstName, LastName, PreferredLanguage, IsVerified, EmergencyContact, Rating, etc.

### 2. ApplicationDbContext
- Inherits from `IdentityDbContext<User, IdentityRole<int>, int>`
- Configured in `Data/ApplicationDbContext.cs`
- All Identity tables managed by EF Core

### 3. Identity Configuration (Program.cs)
```csharp
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
    options.Password.RequiredUniqueChars = 4;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    options.SignIn.RequireConfirmedEmail = false; // Set to true in production
    options.SignIn.RequireConfirmedPhoneNumber = false;
    options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
    options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultEmailProvider;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders()
.AddRoles<IdentityRole<int>>();
```

### 4. Role Management
- `Services/IRoleService.cs` provides methods to initialize roles and assign/remove roles from users
- Default roles: Admin, Helper, User
- Roles are initialized on application startup

### 5. Startup Initialization
```csharp
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var roleService = scope.ServiceProvider.GetRequiredService<IRoleService>();
    await DatabaseSeeder.SeedAsync(context, userManager, logger);
    await roleService.InitializeRolesAsync();
}
```

### 6. Security Best Practices
- Passwords must be strong and unique
- Lockout policy prevents brute-force attacks
- Unique email required for all users
- Role-based access control for sensitive endpoints
- Token providers for email confirmation and password reset

### 7. Next Steps
- Implement AuthController for registration, login, logout, and password reset (TASK-050)
- Add role-based authorization to controllers (TASK-053)
- Integrate JWT authentication (TASK-051)

## References
- [ASP.NET Core Identity documentation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity)
- [Entity Framework Core documentation](https://learn.microsoft.com/en-us/ef/core/)
