// Data/SeedData/DatabaseSeeder.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<IdentityRole<int>> roleManager, ILogger logger)
        {
            try
            {
                // Ensure database is created
                await context.Database.EnsureCreatedAsync();

                // Check if data already exists
                if (await context.Users.AnyAsync())
                {
                    logger.LogInformation("Database already contains data. Skipping seeding.");
                    return;
                }

                logger.LogInformation("Starting database seeding...");

                // Initialize roles first
                await InitializeRolesAsync(roleManager, logger);

                // Seed Users
                var users = UserSeedDataFactory.CreateSeedUsers();
                foreach (var user in users)
                {
                    await userManager.CreateAsync(user, "Password123!");
                }
                logger.LogInformation($"Seeded {users.Count} users");

                // Seed Admin User
                await SeedAdminUserAsync(userManager, logger);

                // Refresh context to get user IDs
                await context.SaveChangesAsync();

                // Seed Flight Companion Requests
                var flightRequests = FlightCompanionSeedDataFactory.CreateSeedRequests();
                await context.FlightCompanionRequests.AddRangeAsync(flightRequests);
                logger.LogInformation($"Seeded {flightRequests.Count} flight companion requests");

                // Seed Flight Companion Offers
                var flightOffers = FlightCompanionSeedDataFactory.CreateSeedOffers();
                await context.FlightCompanionOffers.AddRangeAsync(flightOffers);
                logger.LogInformation($"Seeded {flightOffers.Count} flight companion offers");

                // Seed Pickup Requests
                var pickupRequests = PickupSeedDataFactory.CreateSeedRequests();
                await context.PickupRequests.AddRangeAsync(pickupRequests);
                logger.LogInformation($"Seeded {pickupRequests.Count} pickup requests");

                // Seed Pickup Offers
                var pickupOffers = PickupSeedDataFactory.CreateSeedOffers();
                await context.PickupOffers.AddRangeAsync(pickupOffers);
                logger.LogInformation($"Seeded {pickupOffers.Count} pickup offers");

                // Seed Ratings
                var ratings = RatingSeedDataFactory.CreateSeedRatings();
                await context.Ratings.AddRangeAsync(ratings);
                logger.LogInformation($"Seeded {ratings.Count} ratings");

                // Seed Payments
                var payments = PaymentSeedDataFactory.CreateSeedPayments();
                await context.Payments.AddRangeAsync(payments);
                logger.LogInformation($"Seeded {payments.Count} payments");

                // Seed Notifications
                var notifications = NotificationSeedDataFactory.CreateSeedNotifications();
                await context.Notifications.AddRangeAsync(notifications);
                logger.LogInformation($"Seeded {notifications.Count} notifications");

                // Seed User Settings
                var userSettings = UserSettingsSeedDataFactory.CreateUserSettings();
                await context.UserSettings.AddRangeAsync(userSettings);
                logger.LogInformation($"Seeded {userSettings.Count} user settings");

                // Save all changes
                await context.SaveChangesAsync();

                logger.LogInformation("Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the database");
                throw;
            }
        }

        public static async Task SeedDevelopmentDataAsync(ApplicationDbContext context, ILogger logger)
        {
            try
            {
                // This method can be used for additional development-only data
                // For example, more test scenarios, edge cases, etc.
                
                if (await context.FlightCompanionRequests.CountAsync() > 10)
                {
                    logger.LogInformation("Development data already exists. Skipping development seeding.");
                    return;
                }

                logger.LogInformation("Adding additional development data...");

                // Add more test flight companion requests for various scenarios
                var additionalRequests = new List<FlightCompanionRequest>
                {
                    new FlightCompanionRequest
                    {
                        UserId = 1,
                        FlightNumber = "CZ330",
                        Airline = "China Southern",
                        FlightDate = DateTime.UtcNow.AddDays(10),
                        DepartureAirport = "CAN",
                        ArrivalAirport = "AKL",
                        TravelerName = "Business colleague",
                        TravelerAge = "Adult",
                        SpecialNeeds = "First time business traveler, needs help with customs and immigration procedures",
                        OfferedAmount = 40m,
                        AdditionalNotes = "Colleague is nervous about international travel procedures",
                        IsActive = true,
                        IsMatched = false,
                        CreatedAt = DateTime.UtcNow.AddHours(-3)
                    }
                };

                await context.FlightCompanionRequests.AddRangeAsync(additionalRequests);
                await context.SaveChangesAsync();

                logger.LogInformation("Development data seeding completed!");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding development data");
                throw;
            }
        }

        /// <summary>
        /// Initializes the essential roles for the application
        /// </summary>
        private static async Task InitializeRolesAsync(RoleManager<IdentityRole<int>> roleManager, ILogger logger)
        {
            try
            {
                var roles = new[] { "Admin", "Helper", "User" };

                foreach (var roleName in roles)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        var role = new IdentityRole<int>(roleName);
                        var result = await roleManager.CreateAsync(role);
                        
                        if (result.Succeeded)
                        {
                            logger.LogInformation("Created role: {RoleName}", roleName);
                        }
                        else
                        {
                            logger.LogError("Failed to create role {RoleName}: {Errors}", 
                                roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                        }
                    }
                    else
                    {
                        logger.LogInformation("Role {RoleName} already exists", roleName);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error initializing roles");
            }
        }

        /// <summary>
        /// Seeds the default administrator user for development
        /// </summary>
        private static async Task SeedAdminUserAsync(UserManager<User> userManager, ILogger logger)
        {
            const string adminEmail = "admin@flightcompanion.com";
            
            var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
            if (existingAdmin != null)
            {
                logger.LogInformation("Admin user already exists. Skipping admin creation.");
                return;
            }

            var adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Administrator",
                PhoneNumber = "+64211234567",
                PreferredLanguage = "English",
                IsVerified = true,
                EmergencyContact = "Emergency Services",
                EmergencyPhone = "111",
                Rating = 5.0m,
                TotalRatings = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123!Development");
            
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
                logger.LogInformation("Admin user created successfully: {Email}", adminEmail);
            }
            else
            {
                logger.LogError("Failed to create admin user: {Errors}", 
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
}