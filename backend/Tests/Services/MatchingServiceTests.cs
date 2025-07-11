// Tests/Services/MatchingServiceTests.cs
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Services;
using NetworkingApp.Tests.Services.TestHelpers;

namespace NetworkingApp.Tests.Services
{
    [TestClass]
    public class MatchingServiceTests : ServiceTestBase
    {
        private ApplicationDbContext _context = null!;
        private Mock<ILogger<MatchingService>> _mockLogger = null!;
        private MatchingService _matchingService = null!;

        [TestInitialize]
        public void Setup()
        {
            _context = CreateInMemoryContext();
            _mockLogger = CreateMockLogger<MatchingService>();
            _matchingService = new MatchingService(_context, _mockLogger.Object);
            SeedTestData(_context);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _context?.Dispose();
        }

        #region FlightCompanionMatching Tests

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_ValidRequest_ReturnsMatches()
        {
            // Act
            var result = await _matchingService.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Request.Id.Should().Be(1);
            result[0].Offer.Id.Should().Be(2); // Offer 2 matches flight CA783
            result[0].CompatibilityScore.OverallScore.Should().BeGreaterThan(0);
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_InvalidRequestId_ThrowsArgumentException()
        {
            // Act & Assert
            await FluentActions.Invoking(async () => 
                await _matchingService.FindFlightCompanionMatchesAsync(999, 10))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Flight companion request with ID 999 not found*");
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_AlreadyMatchedRequest_ReturnsEmptyList()
        {
            // Arrange
            var request = _context.FlightCompanionRequests.First(r => r.Id == 1);
            request.IsMatched = true;
            await _context.SaveChangesAsync();

            // Act
            var result = await _matchingService.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_NoAvailableOffers_ReturnsEmptyList()
        {
            // Arrange - Create a separate context to modify data
            using var setupContext = CreateInMemoryContext("NoAvailableOffers");
            SeedTestData(setupContext);
            
            // Make offer unavailable
            var offer = setupContext.FlightCompanionOffers.First(o => o.Id == 2);
            offer.IsAvailable = false;
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use a fresh context for the service
            using var testContext = CreateInMemoryContext("NoAvailableOffers");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_MaxResultsParameter_LimitsResults()
        {
            // Arrange - Create context with unique database name
            using var setupContext = CreateInMemoryContext("MaxResultsTest");
            SeedTestData(setupContext);
            
            // Add more offers that match request 1 (CA783)
            setupContext.FlightCompanionOffers.Add(new FlightCompanionOffer
            {
                Id = 10, // Use unique ID
                UserId = 3,
                FlightNumber = "CA783", // Match request 1
                Airline = "Air China", 
                FlightDate = DateTime.UtcNow.AddDays(3), // Match request 1 date
                DepartureAirport = "PVG",
                ArrivalAirport = "AKL",
                AvailableServices = "Navigation",
                Languages = "English",
                RequestedAmount = 40m,
                HelpedCount = 5,
                IsAvailable = true
            });
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use fresh context
            using var testContext = CreateInMemoryContext("MaxResultsTest");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindFlightCompanionMatchesAsync(1, 1);

            // Assert - Should return only 1 result due to maxResults parameter
            result.Should().HaveCount(1);
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_DifferentFlightNumber_NoMatch()
        {
            // Act - Request 2 has flight "NZ289" but no offers match this flight
            var result = await _matchingService.FindFlightCompanionMatchesAsync(2, 10);

            // Assert - Should be empty because request 2 (NZ289) has no matching offers
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_SameUser_ExcludesSelfMatch()
        {
            // Arrange - Create context with unique database name
            using var setupContext = CreateInMemoryContext("SelfMatchTest");
            SeedTestData(setupContext);
            
            // Modify offer 2 to have same user as request 1
            var offer = setupContext.FlightCompanionOffers.First(o => o.Id == 2);
            offer.UserId = 1; // Same as request 1 user
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use fresh context
            using var testContext = CreateInMemoryContext("SelfMatchTest");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindFlightCompanionMatchesAsync(1, 10);

            // Assert - Should be empty because user can't match with themselves
            result.Should().BeEmpty();
        }

        #endregion

        #region PickupMatching Tests

        [TestMethod]
        public async Task FindPickupMatchesAsync_ValidRequest_ReturnsMatches()
        {
            // Act
            var result = await _matchingService.FindPickupMatchesAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2); // Should match with offers 2 and 3
            result[0].Request.Id.Should().Be(1);
            result[0].CompatibilityScore.OverallScore.Should().BeGreaterThan(0);
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_InvalidRequestId_ThrowsArgumentException()
        {
            // Act & Assert
            await FluentActions.Invoking(async () => 
                await _matchingService.FindPickupMatchesAsync(999, 10))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("*Pickup request with ID 999 not found*");
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_AlreadyMatchedRequest_ReturnsEmptyList()
        {
            // Arrange
            var request = _context.PickupRequests.First(r => r.Id == 1);
            request.IsMatched = true;
            await _context.SaveChangesAsync();

            // Act
            var result = await _matchingService.FindPickupMatchesAsync(1, 10);

            // Assert
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_InsufficientCapacity_NoMatch()
        {
            // Arrange - Create context with unique database name
            using var setupContext = CreateInMemoryContext("InsufficientCapacity");
            SeedTestData(setupContext);
            
            // Modify request to have more passengers than any offer can handle
            var request = setupContext.PickupRequests.First(r => r.Id == 1);
            request.PassengerCount = 10; // More than any offer capacity (max is 8)
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use fresh context
            using var testContext = CreateInMemoryContext("InsufficientCapacity");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindPickupMatchesAsync(1, 10);

            // Assert - Should be empty because no vehicle can handle 10 passengers
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_LuggageRequirement_ChecksCompatibility()
        {
            // Arrange - Create context with unique database name
            using var setupContext = CreateInMemoryContext("LuggageTest");
            SeedTestData(setupContext);
            
            // Modify available offers to not handle luggage
            var offers = setupContext.PickupOffers.Where(o => o.IsAvailable).ToList();
            foreach (var offer in offers)
            {
                offer.CanHandleLuggage = false;
            }
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use fresh context
            using var testContext = CreateInMemoryContext("LuggageTest");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindPickupMatchesAsync(1, 10); // Request 1 has luggage = true

            // Assert - Should be empty because request needs luggage handling but no offers support it
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_DifferentAirport_NoMatch()
        {
            // Arrange - Create context with unique database name
            using var setupContext = CreateInMemoryContext("DifferentAirport");
            SeedTestData(setupContext);
            
            // Modify request to use different airport
            var request = setupContext.PickupRequests.First(r => r.Id == 1);
            request.Airport = "CHC"; // All offers are for AKL
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use fresh context
            using var testContext = CreateInMemoryContext("DifferentAirport");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindPickupMatchesAsync(1, 10);

            // Assert - Should be empty because request is for CHC but all offers are for AKL
            result.Should().BeEmpty();
        }

        #endregion

        #region Compatibility Scoring Tests

        [TestMethod]
        public async Task CompatibilityScoring_HighRatedUser_IncreasesScore()
        {
            // Arrange
            var user = _context.Users.First(u => u.Id == 2);
            user.Rating = 5.0m;
            user.TotalRatings = 50;
            user.IsVerified = true;
            await _context.SaveChangesAsync();

            // Act
            var result = await _matchingService.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().HaveCount(1);
            result[0].CompatibilityScore.UserReputationScore.Should().BeGreaterOrEqualTo(80);
        }

        [TestMethod]
        public async Task CompatibilityScoring_ExperiencedHelper_IncreasesScore()
        {
            // Arrange - Create context with unique database name
            using var setupContext = CreateInMemoryContext("ExperienceTest");
            SeedTestData(setupContext);
            
            // Modify offer 2 (which matches request 1) to have high experience
            var offer = setupContext.FlightCompanionOffers.First(o => o.Id == 2);
            offer.HelpedCount = 50;
            await setupContext.SaveChangesAsync();
            setupContext.Dispose();

            // Act - Use fresh context
            using var testContext = CreateInMemoryContext("ExperienceTest");
            var logger = CreateMockLogger<MatchingService>();
            var service = new MatchingService(testContext, logger.Object);
            
            var result = await service.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().HaveCount(1);
            result[0].CompatibilityScore.ExperienceScore.Should().BeGreaterOrEqualTo(70);
        }

        [TestMethod]
        public async Task CompatibilityScoring_LanguageMatch_IncreasesScore()
        {
            // Arrange
            var request = _context.FlightCompanionRequests.First(r => r.Id == 1);
            request.User.PreferredLanguage = "Chinese";
            var offer = _context.FlightCompanionOffers.First(o => o.Id == 1);
            offer.Languages = "English, Chinese, Japanese";
            await _context.SaveChangesAsync();

            // Act
            var result = await _matchingService.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().HaveCount(1);
            result[0].CompatibilityScore.LanguageCompatibilityScore.Should().Be(100);
        }

        [TestMethod]
        public async Task CompatibilityScoring_SpecialNeedsMatch_IncreasesScore()
        {
            // Arrange
            var request = _context.FlightCompanionRequests.First(r => r.Id == 1);
            request.SpecialNeeds = "Translation, Navigation";
            var offer = _context.FlightCompanionOffers.First(o => o.Id == 1);
            offer.AvailableServices = "Translation, Navigation, General Help";
            await _context.SaveChangesAsync();

            // Act
            var result = await _matchingService.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            result.Should().HaveCount(1);
            result[0].CompatibilityScore.SpecialNeedsCompatibilityScore.Should().BeGreaterOrEqualTo(80);
        }

        #endregion

        #region Edge Cases and Error Handling

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_NullContext_ThrowsException()
        {
            // Arrange
            _matchingService = new MatchingService(null!, _mockLogger.Object);

            // Act & Assert
            await FluentActions.Invoking(async () => 
                await _matchingService.FindFlightCompanionMatchesAsync(1, 10))
                .Should().ThrowAsync<NullReferenceException>(); // Actual exception thrown
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_NegativeMaxResults_HandlesGracefully()
        {
            // Act
            var result = await _matchingService.FindPickupMatchesAsync(1, -1);

            // Assert
            result.Should().BeEmpty();
        }

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_ZeroMaxResults_ReturnsEmpty()
        {
            // Act
            var result = await _matchingService.FindFlightCompanionMatchesAsync(1, 0);

            // Assert
            result.Should().BeEmpty();
        }

        #endregion

        #region Logging Verification

        [TestMethod]
        public async Task FindFlightCompanionMatchesAsync_LogsInformation()
        {
            // Act
            await _matchingService.FindFlightCompanionMatchesAsync(1, 10);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Starting flight companion matching")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task FindPickupMatchesAsync_LogsWarningForMatchedRequest()
        {
            // Arrange
            var request = _context.PickupRequests.First(r => r.Id == 1);
            request.IsMatched = true;
            await _context.SaveChangesAsync();

            // Act
            await _matchingService.FindPickupMatchesAsync(1, 10);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("already matched")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        #endregion
    }
}