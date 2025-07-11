// Data/SeedData/UserSeedDataFactory.cs
using Microsoft.AspNetCore.Identity;
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class UserSeedDataFactory
    {
        public static List<User> CreateSeedUsers()
        {
            var users = new List<User>
            {
                new()
                {
                    Id = 1,
                    UserName = "wei.zhang@email.com",
                    NormalizedUserName = "WEI.ZHANG@EMAIL.COM",
                    Email = "wei.zhang@email.com",
                    NormalizedEmail = "WEI.ZHANG@EMAIL.COM",
                    EmailConfirmed = true,
                    FirstName = "Wei",
                    LastName = "Zhang",
                    PhoneNumber = "+64211234567",
                    PreferredLanguage = "Chinese",
                    IsVerified = true,
                    EmergencyContact = "Li Zhang",
                    EmergencyPhone = "+64211234568",
                    Rating = 4.8m,
                    TotalRatings = 15,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddMonths(-6),
                    LastLoginAt = DateTime.UtcNow.AddDays(-2)
                },
                new()
                {
                    Id = 2,
                    UserName = "michael.chen@email.com",
                    NormalizedUserName = "MICHAEL.CHEN@EMAIL.COM",
                    Email = "michael.chen@email.com",
                    NormalizedEmail = "MICHAEL.CHEN@EMAIL.COM",
                    EmailConfirmed = true,
                    FirstName = "Michael",
                    LastName = "Chen",
                    PhoneNumber = "+64211234569",
                    PreferredLanguage = "English",
                    IsVerified = true,
                    EmergencyContact = "Sarah Chen",
                    EmergencyPhone = "+64211234570",
                    Rating = 4.9m,
                    TotalRatings = 23,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddMonths(-8),
                    LastLoginAt = DateTime.UtcNow.AddDays(-1)
                },
                new()
                {
                    Id = 3,
                    UserName = "lucia.wang@email.com",
                    NormalizedUserName = "LUCIA.WANG@EMAIL.COM",
                    Email = "lucia.wang@email.com",
                    NormalizedEmail = "LUCIA.WANG@EMAIL.COM",
                    EmailConfirmed = true,
                    FirstName = "Lucia",
                    LastName = "Wang",
                    PhoneNumber = "+64211234571",
                    PreferredLanguage = "Chinese",
                    IsVerified = true,
                    EmergencyContact = "David Wang",
                    EmergencyPhone = "+64211234572",
                    Rating = 4.7m,
                    TotalRatings = 12,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddMonths(-4),
                    LastLoginAt = DateTime.UtcNow.AddHours(-5)
                },
                new()
                {
                    Id = 4,
                    UserName = "james.liu@email.com",
                    NormalizedUserName = "JAMES.LIU@EMAIL.COM",
                    Email = "james.liu@email.com",
                    NormalizedEmail = "JAMES.LIU@EMAIL.COM",
                    EmailConfirmed = true,
                    FirstName = "James",
                    LastName = "Liu",
                    PhoneNumber = "+64211234573",
                    PreferredLanguage = "English",
                    IsVerified = true,
                    EmergencyContact = "Mary Liu",
                    EmergencyPhone = "+64211234574",
                    Rating = 4.6m,
                    TotalRatings = 8,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddMonths(-3),
                    LastLoginAt = DateTime.UtcNow.AddDays(-3)
                },
                new()
                {
                    Id = 5,
                    UserName = "annie.zhou@email.com",
                    NormalizedUserName = "ANNIE.ZHOU@EMAIL.COM",
                    Email = "annie.zhou@email.com",
                    NormalizedEmail = "ANNIE.ZHOU@EMAIL.COM",
                    EmailConfirmed = true,
                    FirstName = "Annie",
                    LastName = "Zhou",
                    PhoneNumber = "+64211234575",
                    PreferredLanguage = "Chinese",
                    IsVerified = false,
                    EmergencyContact = "Peter Zhou",
                    EmergencyPhone = "+64211234576",
                    Rating = 0m,
                    TotalRatings = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-14),
                    LastLoginAt = DateTime.UtcNow.AddHours(-12)
                }
            };

            // Set password hash for all users (password: "Password123!")
            var passwordHasher = new PasswordHasher<User>();
            foreach (var user in users)
            {
                user.PasswordHash = passwordHasher.HashPassword(user, "Password123!");
                user.SecurityStamp = Guid.NewGuid().ToString();
                user.ConcurrencyStamp = Guid.NewGuid().ToString();
            }

            return users;
        }
    }
}