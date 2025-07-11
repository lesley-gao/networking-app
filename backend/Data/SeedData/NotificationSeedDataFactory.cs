// Data/SeedData/NotificationSeedDataFactory.cs
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class NotificationSeedDataFactory
    {
        public static List<Notification> CreateSeedNotifications()
        {
            return new List<Notification>
            {
                new Notification
                {
                    Id = 1,
                    UserId = 1,
                    Title = "Match Found!",
                    Message = "A helper has been found for your flight companion request on CA783. Please check your matches.",
                    Type = "MatchFound",
                    IsRead = true,
                    ActionUrl = "/flight-companion/matches/1",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    ExpiresAt = DateTime.UtcNow.AddDays(7)
                },
                new Notification
                {
                    Id = 2,
                    UserId = 3,
                    Title = "Driver Assigned",
                    Message = "Michael Chen will be your driver for pickup from AKL airport. Contact: +64211234569",
                    Type = "DriverAssigned",
                    IsRead = true,
                    ActionUrl = "/pickup/matches/2",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    ExpiresAt = DateTime.UtcNow.AddDays(5)
                },
                new Notification
                {
                    Id = 3,
                    UserId = 2,
                    Title = "Service Completed",
                    Message = "Thank you for providing pickup service to Lucia Wang. Please rate your experience.",
                    Type = "ServiceCompleted",
                    IsRead = false,
                    ActionUrl = "/ratings/create/2",
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    ExpiresAt = DateTime.UtcNow.AddDays(-3)
                },
                new Notification
                {
                    Id = 4,
                    UserId = 5,
                    Title = "Payment Received",
                    Message = "Your payment of NZD $80 for flight companion service has been processed.",
                    Type = "PaymentReceived",
                    IsRead = false,
                    ActionUrl = "/payments/history",
                    CreatedAt = DateTime.UtcNow.AddHours(-2),
                    ExpiresAt = DateTime.UtcNow.AddDays(30)
                }
            };
        }
    }
}