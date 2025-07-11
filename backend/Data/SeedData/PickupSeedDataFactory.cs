// Data/SeedData/PickupSeedDataFactory.cs
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class PickupSeedDataFactory
    {
        public static List<PickupRequest> CreateSeedRequests()
        {
            return new List<PickupRequest>
            {
                new PickupRequest
                {
                    Id = 1,
                    UserId = 1,
                    FlightNumber = "CA783",
                    ArrivalDate = DateTime.UtcNow.AddDays(3).Date,
                    ArrivalTime = new TimeSpan(14, 30, 0), // 2:30 PM
                    Airport = "AKL",
                    DestinationAddress = "123 Queen Street, Auckland CBD",
                    PassengerName = "Wei Zhang + Parents",
                    PassengerPhone = "+64211234567",
                    PassengerCount = 3,
                    HasLuggage = true,
                    OfferedAmount = 45m,
                    SpecialRequests = "Elderly passengers with multiple large suitcases. Need patient driver.",
                    IsActive = true,
                    IsMatched = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new PickupRequest
                {
                    Id = 2,
                    UserId = 3,
                    FlightNumber = "QF143",
                    ArrivalDate = DateTime.UtcNow.AddDays(2).Date,
                    ArrivalTime = new TimeSpan(9, 15, 0), // 9:15 AM
                    Airport = "AKL",
                    DestinationAddress = "456 Dominion Road, Mt Eden",
                    PassengerName = "Lucia Wang",
                    PassengerPhone = "+64211234571",
                    PassengerCount = 1,
                    HasLuggage = true,
                    OfferedAmount = 35m,
                    SpecialRequests = "Just one person with carry-on and one checked bag.",
                    IsActive = true,
                    IsMatched = true,
                    MatchedOfferId = 1,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new PickupRequest
                {
                    Id = 3,
                    UserId = 5,
                    FlightNumber = "NZ108",
                    ArrivalDate = DateTime.UtcNow.AddDays(6).Date,
                    ArrivalTime = new TimeSpan(21, 45, 0), // 9:45 PM
                    Airport = "AKL",
                    DestinationAddress = "789 Great North Road, New Lynn",
                    PassengerName = "Annie Zhou + Friend",
                    PassengerPhone = "+64211234575",
                    PassengerCount = 2,
                    HasLuggage = true,
                    OfferedAmount = 50m,
                    SpecialRequests = "Late night arrival, prefer driver who speaks Chinese",
                    IsActive = true,
                    IsMatched = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-8)
                }
            };
        }

        public static List<PickupOffer> CreateSeedOffers()
        {
            return new List<PickupOffer>
            {
                new PickupOffer
                {
                    Id = 1,
                    UserId = 2,
                    Airport = "AKL",
                    VehicleType = "SUV",
                    MaxPassengers = 6,
                    CanHandleLuggage = true,
                    ServiceArea = "Auckland CBD, North Shore, East Auckland",
                    BaseRate = 30m,
                    Languages = "Chinese, English",
                    AdditionalServices = "Airport meet and greet, Help with luggage, City tour guidance",
                    IsAvailable = false, // Matched with request #2
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    TotalPickups = 28,
                    AverageRating = 4.9m
                },
                new PickupOffer
                {
                    Id = 2,
                    UserId = 4,
                    Airport = "AKL",
                    VehicleType = "Sedan",
                    MaxPassengers = 4,
                    CanHandleLuggage = true,
                    ServiceArea = "All Auckland regions",
                    BaseRate = 25m,
                    Languages = "Chinese, English",
                    AdditionalServices = "24/7 availability, Local area knowledge, Shopping assistance",
                    IsAvailable = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    TotalPickups = 15,
                    AverageRating = 4.7m
                },
                new PickupOffer
                {
                    Id = 3,
                    UserId = 2,
                    Airport = "AKL",
                    VehicleType = "Van",
                    MaxPassengers = 8,
                    CanHandleLuggage = true,
                    ServiceArea = "Auckland CBD, West Auckland, Central Auckland",
                    BaseRate = 40m,
                    Languages = "Chinese, English",
                    AdditionalServices = "Large group transport, Multiple stops, Chinese cultural advice",
                    IsAvailable = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    TotalPickups = 28,
                    AverageRating = 4.9m
                }
            };
        }
    }
}