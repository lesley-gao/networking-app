using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NetworkingApp.Models;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Integration tests for Pickup service endpoints.
    /// </summary>
    [TestClass]
    public class PickupControllerIntegrationTests : IntegrationTestBase
    {
        [TestInitialize]
        public async Task TestInitialize()
        {
            await ClearDatabaseAsync();
        }

        [TestMethod]
        public async Task GetRequests_ShouldReturnActivePickupRequests()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create test pickup requests
            var activeRequest = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 1",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(3),
                PassengerCount = 2,
                LuggageCount = 4,
                OfferedAmount = 75.00m,
                SpecialRequests = "Need child seat",
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            var inactiveRequest = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 2",
                DropoffLocation = "Ponsonby",
                PickupDate = DateTime.UtcNow.AddDays(5),
                PassengerCount = 1,
                LuggageCount = 2,
                OfferedAmount = 50.00m,
                IsActive = false,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupRequests.AddRange(activeRequest, inactiveRequest);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync("/api/pickup/requests");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var requests = await DeserializeResponseAsync<List<PickupRequest>>(response);
            requests.Should().NotBeNull();
            requests.Should().HaveCount(1); // Only active request should be returned
            requests![0].Id.Should().Be(activeRequest.Id);
            requests[0].IsActive.Should().BeTrue();
            requests[0].PickupLocation.Should().Be("Auckland Airport Terminal 1");
        }

        [TestMethod]
        public async Task GetRequest_WithValidId_ShouldReturnPickupRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var request = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 1",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(3),
                PassengerCount = 2,
                LuggageCount = 4,
                OfferedAmount = 75.00m,
                SpecialRequests = "Need child seat",
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupRequests.Add(request);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync($"/api/pickup/requests/{request.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var returnedRequest = await DeserializeResponseAsync<PickupRequest>(response);
            returnedRequest.Should().NotBeNull();
            returnedRequest!.Id.Should().Be(request.Id);
            returnedRequest.PickupLocation.Should().Be("Auckland Airport Terminal 1");
            returnedRequest.DropoffLocation.Should().Be("Auckland CBD");
            returnedRequest.PassengerCount.Should().Be(2);
        }

        [TestMethod]
        public async Task CreateRequest_WithValidData_ShouldCreatePickupRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newRequest = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 2",
                DropoffLocation = "Newmarket",
                PickupDate = DateTime.UtcNow.AddDays(7),
                PassengerCount = 3,
                LuggageCount = 6,
                OfferedAmount = 100.00m,
                SpecialRequests = "Large vehicle needed"
            };

            // Act
            var response = await _client.PostAsync("/api/pickup/requests", CreateJsonContent(newRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var createdRequest = await DeserializeResponseAsync<PickupRequest>(response);
            createdRequest.Should().NotBeNull();
            createdRequest!.Id.Should().BeGreaterThan(0);
            createdRequest.PickupLocation.Should().Be("Auckland Airport Terminal 2");
            createdRequest.DropoffLocation.Should().Be("Newmarket");
            createdRequest.PassengerCount.Should().Be(3);
            createdRequest.IsActive.Should().BeTrue();
            createdRequest.IsMatched.Should().BeFalse();

            // Verify in database
            var dbRequest = await _context.PickupRequests.FindAsync(createdRequest.Id);
            dbRequest.Should().NotBeNull();
            dbRequest!.UserId.Should().Be(user.Id);
        }

        [TestMethod]
        public async Task CreateRequest_WithPastPickupDate_ShouldReturnBadRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newRequest = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(-1), // Past date
                PassengerCount = 1,
                LuggageCount = 2,
                OfferedAmount = 50.00m
            };

            // Act
            var response = await _client.PostAsync("/api/pickup/requests", CreateJsonContent(newRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task GetOffers_ShouldReturnActivePickupOffers()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a pickup request first
            var request = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 1",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(3),
                PassengerCount = 2,
                LuggageCount = 4,
                OfferedAmount = 75.00m,
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create test offers
            var activeOffer = new PickupOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                VehicleType = "SUV",
                Capacity = 6,
                BaseRate = 60.00m,
                Message = "Professional driver with clean vehicle",
                IsActive = true,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            var inactiveOffer = new PickupOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                VehicleType = "Sedan",
                Capacity = 4,
                BaseRate = 45.00m,
                Message = "Another offer",
                IsActive = false,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupOffers.AddRange(activeOffer, inactiveOffer);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync("/api/pickup/offers");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var offers = await DeserializeResponseAsync<List<PickupOffer>>(response);
            offers.Should().NotBeNull();
            offers.Should().HaveCount(1); // Only active offer should be returned
            offers![0].Id.Should().Be(activeOffer.Id);
            offers[0].IsActive.Should().BeTrue();
            offers[0].VehicleType.Should().Be("SUV");
        }

        [TestMethod]
        public async Task CreateOffer_WithValidData_ShouldCreatePickupOffer()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a pickup request first
            var request = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 1",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(3),
                PassengerCount = 2,
                LuggageCount = 4,
                OfferedAmount = 75.00m,
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupRequests.Add(request);
            await _context.SaveChangesAsync();

            var newOffer = new PickupOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                VehicleType = "Minivan",
                Capacity = 8,
                BaseRate = 80.00m,
                Message = "Spacious vehicle perfect for families with luggage",
                LicenseNumber = "ABC123",
                Insurance = "Full coverage insurance"
            };

            // Act
            var response = await _client.PostAsync("/api/pickup/offers", CreateJsonContent(newOffer));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var createdOffer = await DeserializeResponseAsync<PickupOffer>(response);
            createdOffer.Should().NotBeNull();
            createdOffer!.Id.Should().BeGreaterThan(0);
            createdOffer.RequestId.Should().Be(request.Id);
            createdOffer.VehicleType.Should().Be("Minivan");
            createdOffer.Capacity.Should().Be(8);
            createdOffer.BaseRate.Should().Be(80.00m);
            createdOffer.IsActive.Should().BeTrue();
            createdOffer.IsAccepted.Should().BeFalse();

            // Verify in database
            var dbOffer = await _context.PickupOffers.FindAsync(createdOffer.Id);
            dbOffer.Should().NotBeNull();
            dbOffer!.UserId.Should().Be(user.Id);
        }

        [TestMethod]
        public async Task CreateOffer_WithInvalidRequestId_ShouldReturnBadRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var newOffer = new PickupOffer
            {
                RequestId = 999, // Non-existent request
                UserId = user.Id,
                VehicleType = "SUV",
                Capacity = 6,
                BaseRate = 60.00m,
                Message = "Professional service"
            };

            // Act
            var response = await _client.PostAsync("/api/pickup/offers", CreateJsonContent(newOffer));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task MatchRequest_WithValidData_ShouldUpdateMatchStatus()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a pickup request
            var request = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 1",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(3),
                PassengerCount = 2,
                LuggageCount = 4,
                OfferedAmount = 75.00m,
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create an offer
            var offer = new PickupOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                VehicleType = "SUV",
                Capacity = 6,
                BaseRate = 60.00m,
                Message = "Professional driver",
                IsActive = true,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupOffers.Add(offer);
            await _context.SaveChangesAsync();

            var matchRequest = new
            {
                OfferId = offer.Id
            };

            // Act
            var response = await _client.PutAsync($"/api/pickup/match/{request.Id}", CreateJsonContent(matchRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            // Verify the match was created in database
            var updatedRequest = await _context.PickupRequests.FindAsync(request.Id);
            var updatedOffer = await _context.PickupOffers.FindAsync(offer.Id);

            updatedRequest.Should().NotBeNull();
            updatedOffer.Should().NotBeNull();
            updatedRequest!.IsMatched.Should().BeTrue();
            updatedOffer!.IsAccepted.Should().BeTrue();
        }

        [TestMethod]
        public async Task GetMatchingOffers_WithValidRequestId_ShouldReturnCompatibleOffers()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a pickup request
            var request = new PickupRequest
            {
                UserId = user.Id,
                PickupLocation = "Auckland Airport Terminal 1",
                DropoffLocation = "Auckland CBD",
                PickupDate = DateTime.UtcNow.AddDays(3),
                PassengerCount = 3,
                LuggageCount = 6,
                OfferedAmount = 100.00m,
                IsActive = true,
                IsMatched = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create compatible and incompatible offers
            var compatibleOffer = new PickupOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                VehicleType = "SUV",
                Capacity = 6, // Can handle 3 passengers
                BaseRate = 90.00m, // Within budget
                Message = "Large vehicle available",
                IsActive = true,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            var incompatibleOffer = new PickupOffer
            {
                RequestId = request.Id,
                UserId = user.Id,
                VehicleType = "Compact",
                Capacity = 2, // Cannot handle 3 passengers
                BaseRate = 50.00m,
                Message = "Small car",
                IsActive = true,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PickupOffers.AddRange(compatibleOffer, incompatibleOffer);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync($"/api/pickup/match/{request.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var matchingOffers = await DeserializeResponseAsync<List<PickupOffer>>(response);
            matchingOffers.Should().NotBeNull();
            
            // The matching logic should filter offers based on capacity and other criteria
            matchingOffers.Should().Contain(o => o.Id == compatibleOffer.Id);
        }
    }
}
