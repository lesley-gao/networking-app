// Tests/Services/TestHelpers/TestDataFactory.cs
using NetworkingApp.Data;
using NetworkingApp.Models;

namespace NetworkingApp.Tests.Services.TestHelpers
{
    public static class TestDataFactory
    {
        public static void SeedUsers(ApplicationDbContext context)
        {
            var users = new[]
            {
                new User
                {
                    Id = 1,
                    Email = "test1@example.com",
                    FirstName = "John",
                    LastName = "Doe",
                    IsVerified = true,
                    Rating = 4.5m,
                    TotalRatings = 10,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    PreferredLanguage = "English"
                },
                new User
                {
                    Id = 2,
                    Email = "test2@example.com", 
                    FirstName = "Jane",
                    LastName = "Smith",
                    IsVerified = true,
                    Rating = 4.8m,
                    TotalRatings = 25,
                    CreatedAt = DateTime.UtcNow.AddDays(-60),
                    PreferredLanguage = "Chinese"
                },
                new User
                {
                    Id = 3,
                    Email = "test3@example.com",
                    FirstName = "Mike", 
                    LastName = "Johnson",
                    IsVerified = false,
                    Rating = 3.2m,
                    TotalRatings = 5,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    PreferredLanguage = "English"
                }
            };

            context.Users.AddRange(users);
        }

        public static void SeedFlightCompanionData(ApplicationDbContext context)
        {
            var requests = new[]
            {
                new FlightCompanionRequest
                {
                    Id = 1,
                    UserId = 1,
                    FlightNumber = "NZ289",
                    Airline = "Air New Zealand",
                    FlightDate = DateTime.UtcNow.AddDays(7),
                    DepartureAirport = "AKL",
                    ArrivalAirport = "PVG",
                    TravelerAge = "Adult",
                    SpecialNeeds = "Language assistance",
                    OfferedAmount = 50m,
                    IsActive = true,
                    IsMatched = false
                }
            };

            var offers = new[]
            {
                new FlightCompanionOffer
                {
                    Id = 1,
                    UserId = 2,
                    FlightNumber = "NZ289", 
                    Airline = "Air New Zealand",
                    FlightDate = DateTime.UtcNow.AddDays(7),
                    DepartureAirport = "AKL",
                    ArrivalAirport = "PVG",
                    AvailableServices = "Translation, Navigation",
                    Languages = "English, Chinese",
                    RequestedAmount = 30m,
                    HelpedCount = 15,
                    IsAvailable = true
                }
            };

            context.FlightCompanionRequests.AddRange(requests);
            context.FlightCompanionOffers.AddRange(offers);
        }

        public static void SeedPickupData(ApplicationDbContext context)
        {
            var requests = new[]
            {
                new PickupRequest
                {
                    Id = 1,
                    UserId = 1,
                    FlightNumber = "NZ001",
                    ArrivalDate = DateTime.UtcNow.AddDays(1),
                    ArrivalTime = TimeSpan.FromHours(14.5),
                    Airport = "AKL",
                    DestinationAddress = "Auckland CBD",
                    PassengerCount = 2,
                    HasLuggage = true,
                    OfferedAmount = 25m,
                    IsActive = true,
                    IsMatched = false
                }
            };

            var offers = new[]
            {
                new PickupOffer
                {
                    Id = 1,
                    UserId = 2,
                    Airport = "AKL",
                    VehicleType = "SUV",
                    MaxPassengers = 4,
                    CanHandleLuggage = true,
                    ServiceArea = "Auckland CBD, North Shore",
                    BaseRate = 20m,
                    TotalPickups = 50,
                    AverageRating = 4.7m,
                    IsAvailable = true
                }
            };

            context.PickupRequests.AddRange(requests);
            context.PickupOffers.AddRange(offers);
        }
    }
}