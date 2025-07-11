using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class MessageSeedDataFactory
    {
        public static List<Message> CreateSeedMessages()
        {
            return new List<Message>
            {
                new Message
                {
                    Id = 1,
                    SenderId = 1,
                    ReceiverId = 2,
                    Content = "Hi! I saw your flight companion request for NZ289. I'd be happy to help with translation and navigation.",
                    Type = "Text",
                    RequestType = "FlightCompanion",
                    RequestId = 1,
                    ThreadId = "thread_1_2",
                    IsRead = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    ReadAt = DateTime.UtcNow.AddDays(-2).AddMinutes(15)
                },
                new Message
                {
                    Id = 2,
                    SenderId = 2,
                    ReceiverId = 1,
                    Content = "That would be amazing! Thank you so much. I'm quite nervous about the trip.",
                    Type = "Text",
                    RequestType = "FlightCompanion",
                    RequestId = 1,
                    ThreadId = "thread_1_2",
                    IsRead = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-2).AddMinutes(20),
                    ReadAt = DateTime.UtcNow.AddDays(-2).AddMinutes(25)
                },
                new Message
                {
                    Id = 3,
                    SenderId = 3,
                    ReceiverId = 4,
                    Content = "Hello! I can provide pickup service from AKL airport. I have a comfortable SUV and speak both English and Chinese.",
                    Type = "Text",
                    RequestType = "Pickup",
                    RequestId = 1,
                    ThreadId = "thread_3_4",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-6)
                }
            };
        }
    }
}