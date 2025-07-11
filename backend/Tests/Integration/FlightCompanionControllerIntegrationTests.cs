using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NetworkingApp.Models;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Integration tests for Flight Companion endpoints.
    /// </summary>
    [TestClass]
    public class FlightCompanionControllerIntegrationTests : IntegrationTestBase
    {
        [TestInitialize]
        public async Task TestInitialize()
        {
            await ClearDatabaseAsync();
        }

        [TestMethod]
        public async Task GetRequests_ShouldReturnActiveRequests()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create test requests
            var activeRequest = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "JFK",
                ArrivalAirport = "LAX",
                FlightDate = DateTime.UtcNow.AddDays(5),
                OfferedAmount = 150.00m,
                Description = "Looking for a travel companion",
                PreferredGender = "Any",
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            var inactiveRequest = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "ORD",
                ArrivalAirport = "MIA",
                FlightDate = DateTime.UtcNow.AddDays(3),
                OfferedAmount = 100.00m,
                Description = "Another request",
                PreferredGender = "Any",
                IsActive = false,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.FlightCompanionRequests.AddRange(activeRequest, inactiveRequest);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync("/api/flightcompanion/requests");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var requests = await DeserializeResponseAsync<List<FlightCompanionRequest>>(response);
            requests.Should().NotBeNull();
            requests.Should().HaveCount(1); // Only active request should be returned
            requests![0].Id.Should().Be(activeRequest.Id);
            requests[0].IsActive.Should().BeTrue();
        }

        [TestMethod]
        public async Task GetRequest_WithValidId_ShouldReturnRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var request = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "JFK",
                ArrivalAirport = "LAX",
                FlightDate = DateTime.UtcNow.AddDays(5),
                OfferedAmount = 150.00m,
                Description = "Looking for a travel companion",
                PreferredGender = "Any",
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.FlightCompanionRequests.Add(request);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync($"/api/flightcompanion/requests/{request.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var returnedRequest = await DeserializeResponseAsync<FlightCompanionRequest>(response);
            returnedRequest.Should().NotBeNull();
            returnedRequest!.Id.Should().Be(request.Id);
            returnedRequest.DepartureAirport.Should().Be("JFK");
            returnedRequest.ArrivalAirport.Should().Be("LAX");
        }

        [TestMethod]
        public async Task GetRequest_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Act
            var response = await _client.GetAsync("/api/flightcompanion/requests/999");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [TestMethod]
        public async Task CreateRequest_WithValidData_ShouldCreateAndReturnRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newRequest = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "JFK",
                ArrivalAirport = "LAX",
                FlightDate = DateTime.UtcNow.AddDays(10),
                OfferedAmount = 200.00m,
                Description = "Need a travel companion for business trip",
                PreferredGender = "Any"
            };

            // Act
            var response = await _client.PostAsync("/api/flightcompanion/requests", CreateJsonContent(newRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var createdRequest = await DeserializeResponseAsync<FlightCompanionRequest>(response);
            createdRequest.Should().NotBeNull();
            createdRequest!.Id.Should().BeGreaterThan(0);
            createdRequest.DepartureAirport.Should().Be("JFK");
            createdRequest.ArrivalAirport.Should().Be("LAX");
            createdRequest.IsActive.Should().BeTrue();
            createdRequest.IsMatched.Should().BeFalse();

            // Verify in database
            var dbRequest = await _context.FlightCompanionRequests.FindAsync(createdRequest.Id);
            dbRequest.Should().NotBeNull();
            dbRequest!.UserId.Should().Be(user.Id);
        }

        [TestMethod]
        public async Task CreateRequest_WithPastFlightDate_ShouldReturnBadRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newRequest = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "JFK",
                ArrivalAirport = "LAX",
                FlightDate = DateTime.UtcNow.AddDays(-1), // Past date
                OfferedAmount = 200.00m,
                Description = "Need a travel companion",
                PreferredGender = "Any"
            };

            // Act
            var response = await _client.PostAsync("/api/flightcompanion/requests", CreateJsonContent(newRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task CreateRequest_WithMissingRequiredFields_ShouldReturnBadRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newRequest = new FlightCompanionRequest
            {
                UserId = user.Id,
                // Missing required fields like DepartureAirport, ArrivalAirport
                FlightDate = DateTime.UtcNow.AddDays(5),
                OfferedAmount = 200.00m
            };

            // Act
            var response = await _client.PostAsync("/api/flightcompanion/requests", CreateJsonContent(newRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task GetOffers_ShouldReturnActiveOffers()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a flight companion request first
            var request = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "JFK",
                ArrivalAirport = "LAX",
                FlightDate = DateTime.UtcNow.AddDays(5),
                OfferedAmount = 150.00m,
                Description = "Looking for a travel companion",
                PreferredGender = "Any",
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.FlightCompanionRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create test offers
            var activeOffer = new FlightCompanionOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                RequestedAmount = 125.00m,
                Message = "I can travel with you",
                IsActive = true,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            var inactiveOffer = new FlightCompanionOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                RequestedAmount = 100.00m,
                Message = "Another offer",
                IsActive = false,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.FlightCompanionOffers.AddRange(activeOffer, inactiveOffer);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync("/api/flightcompanion/offers");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var offers = await DeserializeResponseAsync<List<FlightCompanionOffer>>(response);
            offers.Should().NotBeNull();
            offers.Should().HaveCount(1); // Only active offer should be returned
            offers![0].Id.Should().Be(activeOffer.Id);
            offers[0].IsActive.Should().BeTrue();
        }

        [TestMethod]
        public async Task CreateOffer_WithValidData_ShouldCreateAndReturnOffer()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a flight companion request first
            var request = new FlightCompanionRequest
            {
                UserId = user.Id,
                DepartureAirport = "JFK",
                ArrivalAirport = "LAX",
                FlightDate = DateTime.UtcNow.AddDays(5),
                OfferedAmount = 150.00m,
                Description = "Looking for a travel companion",
                PreferredGender = "Any",
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.FlightCompanionRequests.Add(request);
            await _context.SaveChangesAsync();

            var newOffer = new FlightCompanionOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                RequestedAmount = 125.00m,
                Message = "I would love to travel with you!"
            };

            // Act
            var response = await _client.PostAsync("/api/flightcompanion/offers", CreateJsonContent(newOffer));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var createdOffer = await DeserializeResponseAsync<FlightCompanionOffer>(response);
            createdOffer.Should().NotBeNull();
            createdOffer!.Id.Should().BeGreaterThan(0);
            createdOffer.RequestId.Should().Be(request.Id);
            createdOffer.RequestedAmount.Should().Be(125.00m);
            createdOffer.IsActive.Should().BeTrue();
            createdOffer.IsAccepted.Should().BeFalse();

            // Verify in database
            var dbOffer = await _context.FlightCompanionOffers.FindAsync(createdOffer.Id);
            dbOffer.Should().NotBeNull();
            dbOffer!.UserId.Should().Be(user.Id);
        }

        [TestMethod]
        public async Task CreateOffer_WithInvalidRequestId_ShouldReturnBadRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newOffer = new FlightCompanionOffer
            {
                RequestId = 999, // Non-existent request
                UserId = user.Id,
                RequestedAmount = 125.00m,
                Message = "I would love to travel with you!"
            };

            // Act
            var response = await _client.PostAsync("/api/flightcompanion/offers", CreateJsonContent(newOffer));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }
}
