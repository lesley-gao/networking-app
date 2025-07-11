using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;

namespace NetworkingApp.Data.ProductionSeeding
{
    /// <summary>
    /// Seeder for essential configuration data required for production operation
    /// </summary>
    public static class ConfigurationDataSeeder
    {
        /// <summary>
        /// Seeds essential configuration data for production environment
        /// </summary>
        /// <param name="context">Database context</param>
        /// <returns>True if seeding completed successfully</returns>
        public static async Task<bool> SeedConfigurationDataAsync(ApplicationDbContext context)
        {
            try
            {
                await SeedEmergencyContactsAsync(context);
                await SeedSystemMessagesAsync(context);
                await SeedDefaultEscrowSettingsAsync(context);

                await context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Configuration data seeding failed: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Seeds emergency contact information and procedures
        /// </summary>
        private static async Task SeedEmergencyContactsAsync(ApplicationDbContext context)
        {
            if (await context.Emergencies.AnyAsync())
            {
                return; // Emergency data already exists
            }

            var emergencyContacts = new[]
            {
                new Emergency
                {
                    UserId = 1, // System reference
                    Type = "System",
                    Description = "24/7 platform emergency support contact: +1-800-FLIGHT-HELP, emergency@flightcompanion.com",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                },
                new Emergency
                {
                    UserId = 1,
                    Type = "Medical",
                    Description = "Emergency medical services - dial 911, contact: medical@emergency.gov",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                },
                new Emergency
                {
                    UserId = 1,
                    Type = "Safety",
                    Description = "Platform security and safety concerns: +1-800-SECURITY, security@flightcompanion.com",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                },
                new Emergency
                {
                    UserId = 1,
                    Type = "Travel",
                    Description = "Transportation-related emergencies and disruptions: +1-800-TRANSPORT, transport@flightcompanion.com",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Emergencies.AddRangeAsync(emergencyContacts);
        }

        /// <summary>
        /// Seeds system-level messages and announcements
        /// </summary>
        private static async Task SeedSystemMessagesAsync(ApplicationDbContext context)
        {
            if (await context.Messages.AnyAsync(m => m.Type == "System"))
            {
                return; // System messages already exist
            }

            var systemMessages = new[]
            {
                new Message
                {
                    SenderId = 1, // System user
                    ReceiverId = 1,
                    RequestType = "General",
                    Content = "Welcome to Flight Companion! This is your system message center.",
                    Type = "System",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Message
                {
                    SenderId = 1,
                    ReceiverId = 1,
                    RequestType = "General",
                    Content = "Safety Reminder: Always verify companion identity before meeting.",
                    Type = "System",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Message
                {
                    SenderId = 1,
                    ReceiverId = 1,
                    RequestType = "General",
                    Content = "Payment Security: All transactions are processed securely through our platform.",
                    Type = "System",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Message
                {
                    SenderId = 1,
                    ReceiverId = 1,
                    RequestType = "General",
                    Content = "Emergency Protocol: In case of emergency, contact support immediately.",
                    Type = "System",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Messages.AddRangeAsync(systemMessages);
        }

        /// <summary>
        /// Seeds default escrow settings for secure transactions
        /// </summary>
        private static async Task SeedDefaultEscrowSettingsAsync(ApplicationDbContext context)
        {
            if (await context.Escrows.AnyAsync())
            {
                return; // Escrow settings already exist
            }

            var defaultEscrowSettings = new[]
            {
                new Escrow
                {
                    PaymentId = null, // Template - no specific payment
                    Amount = 0.00m, // Template amount
                    Currency = "nzd",
                    StripePaymentIntentId = "template_intent",
                    Status = EscrowStatus.Held,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Escrows.AddRangeAsync(defaultEscrowSettings);
        }

        /// <summary>
        /// Validates configuration data integrity
        /// </summary>
        /// <param name="context">Database context</param>
        /// <returns>True if configuration data is valid</returns>
        public static async Task<bool> ValidateConfigurationDataAsync(ApplicationDbContext context)
        {
            try
            {
                var hasEmergencyContacts = await context.Emergencies.AnyAsync();
                var hasSystemMessages = await context.Messages.AnyAsync(m => m.Type == "System");
                var hasEscrowSettings = await context.Escrows.AnyAsync();

                return hasEmergencyContacts && hasSystemMessages && hasEscrowSettings;
            }
            catch
            {
                return false;
            }
        }
    }
}
