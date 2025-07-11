// Data/SeedData/RatingSeedDataFactory.cs
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class RatingSeedDataFactory
    {
        public static List<Rating> CreateSeedRatings()
        {
            return new List<Rating>
            {
                new Rating
                {
                    Id = 1,
                    RaterId = 1,
                    RatedUserId = 2,
                    RequestId = 2,
                    RequestType = "PickupRequest",
                    Score = 5,
                    Comment = "Excellent service! Michael was very professional and helpful. Highly recommend!",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Rating
                {
                    Id = 2,
                    RaterId = 3,
                    RatedUserId = 2,
                    RequestId = 3,
                    RequestType = "FlightCompanionRequest",
                    Score = 5,
                    Comment = "Michael helped my mother throughout the entire flight. Very patient and kind. 非常感谢！",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new Rating
                {
                    Id = 3,
                    RaterId = 2,
                    RatedUserId = 3,
                    RequestId = 2,
                    RequestType = "PickupRequest",
                    Score = 5,
                    Comment = "Lucia was easy to coordinate with and very appreciative. Great passenger!",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Rating
                {
                    Id = 4,
                    RaterId = 4,
                    RatedUserId = 1,
                    RequestId = 1,
                    RequestType = "FlightCompanionRequest",
                    Score = 4,
                    Comment = "Wei was very grateful for the help. Nice to assist fellow travelers.",
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-15)
                }
            };
        }
    }
}