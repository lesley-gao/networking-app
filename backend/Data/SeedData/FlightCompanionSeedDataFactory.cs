// Data/SeedData/FlightCompanionSeedDataFactory.cs
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class FlightCompanionSeedDataFactory
    {
        public static List<FlightCompanionRequest> CreateSeedRequests()
        {
            return new List<FlightCompanionRequest>
            {
                new FlightCompanionRequest
                {
                    Id = 1,
                    UserId = 1,
                    FlightNumber = "CA783",
                    Airline = "Air China",
                    FlightDate = DateTime.UtcNow.AddDays(3),
                    DepartureAirport = "PVG",
                    ArrivalAirport = "AKL",
                    TravelerName = "My elderly parents",
                    TravelerAge = "Elderly",
                    SpecialNeeds = "Need help with English translation and airport navigation. Parents are 75+ years old and this is their first international trip.",
                    OfferedAmount = 80m,
                    AdditionalNotes = "Very grateful for any assistance. Can arrange pickup from arrival gate.",
                    IsActive = true,
                    IsMatched = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new FlightCompanionRequest
                {
                    Id = 2,
                    UserId = 3,
                    FlightNumber = "NZ289",
                    Airline = "Air New Zealand",
                    FlightDate = DateTime.UtcNow.AddDays(5),
                    DepartureAirport = "AKL",
                    ArrivalAirport = "PVG",
                    TravelerName = "Myself",
                    TravelerAge = "Adult",
                    SpecialNeeds = "First time traveling to China, need help with customs forms and connecting flight information",
                    OfferedAmount = 60m,
                    AdditionalNotes = "Nervous about the trip, would appreciate someone to sit nearby and help if needed.",
                    IsActive = true,
                    IsMatched = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new FlightCompanionRequest
                {
                    Id = 3,
                    UserId = 5,
                    FlightNumber = "MU780",
                    Airline = "China Eastern",
                    FlightDate = DateTime.UtcNow.AddDays(7),
                    DepartureAirport = "PVG",
                    ArrivalAirport = "AKL",
                    TravelerName = "My mother",
                    TravelerAge = "Elderly",
                    SpecialNeeds = "Mother has limited mobility and needs wheelchair assistance. Also needs help with meal requests.",
                    OfferedAmount = 100m,
                    AdditionalNotes = "Mother speaks only Mandarin. Looking for someone who can help communicate with flight crew.",
                    IsActive = true,
                    IsMatched = true,
                    MatchedOfferId = 1,
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };
        }

        public static List<FlightCompanionOffer> CreateSeedOffers()
        {
            return new List<FlightCompanionOffer>
            {
                new FlightCompanionOffer
                {
                    Id = 1,
                    UserId = 2,
                    FlightNumber = "MU780",
                    Airline = "China Eastern",
                    FlightDate = DateTime.UtcNow.AddDays(7),
                    DepartureAirport = "PVG",
                    ArrivalAirport = "AKL",
                    AvailableServices = "Translation (Mandarin/English), Airport navigation, Meal assistance, General companionship",
                    Languages = "Chinese, English",
                    RequestedAmount = 80m,
                    IsAvailable = false, // Matched with request #3
                    AdditionalInfo = "I'm a frequent traveler on this route and happy to help fellow passengers. Fluent in both languages.",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    HelpedCount = 12
                },
                new FlightCompanionOffer
                {
                    Id = 2,
                    UserId = 4,
                    FlightNumber = "CA783",
                    Airline = "Air China",
                    FlightDate = DateTime.UtcNow.AddDays(3),
                    DepartureAirport = "PVG",
                    ArrivalAirport = "AKL",
                    AvailableServices = "Translation, Customs assistance, Airport navigation",
                    Languages = "Chinese, English",
                    RequestedAmount = 70m,
                    IsAvailable = true,
                    AdditionalInfo = "Business traveler familiar with both airports. Can help with paperwork and directions.",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    HelpedCount = 5
                },
                new FlightCompanionOffer
                {
                    Id = 3,
                    UserId = 2,
                    FlightNumber = "NZ289",
                    Airline = "Air New Zealand",
                    FlightDate = DateTime.UtcNow.AddDays(5),
                    DepartureAirport = "AKL",
                    ArrivalAirport = "PVG",
                    AvailableServices = "China travel advice, Translation, Cultural tips",
                    Languages = "Chinese, English",
                    RequestedAmount = 50m,
                    IsAvailable = true,
                    AdditionalInfo = "Living in China for 5 years, know the ins and outs of Shanghai airport and city.",
                    CreatedAt = DateTime.UtcNow.AddHours(-6),
                    HelpedCount = 12
                }
            };
        }
    }
}