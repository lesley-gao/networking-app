// Services/MatchingService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NetworkingApp.Data;
using NetworkingApp.Models;

namespace NetworkingApp.Services
{
    /// <summary>
    /// Simple matching service that finds compatible offers for requests
    /// </summary>
    public class MatchingService : IMatchingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MatchingService> _logger;

        public MatchingService(ApplicationDbContext context, ILogger<MatchingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Find flight companion offers that match basic criteria
        /// </summary>
        public async Task<List<FlightCompanionMatchResult>> FindFlightCompanionMatchesAsync(
            int requestId, 
            int maxResults = 10)
        {
            _logger.LogInformation("Finding flight companion matches for request {RequestId}", requestId);

            var request = await _context.FlightCompanionRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
            {
                throw new ArgumentException($"Flight companion request with ID {requestId} not found", nameof(requestId));
            }

            if (request.IsMatched)
            {
                return new List<FlightCompanionMatchResult>();
            }

            // Simple matching: same flight details and available offers
            var matches = await _context.FlightCompanionOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.FlightNumber == request.FlightNumber &&
                           o.FlightDate.Date == request.FlightDate.Date &&
                           o.DepartureAirport == request.DepartureAirport &&
                           o.ArrivalAirport == request.ArrivalAirport &&
                           o.UserId != request.UserId)
                .OrderBy(o => o.RequestedAmount) // Cheapest first
                .Take(maxResults)
                .ToListAsync();

            var results = matches.Select(offer => new FlightCompanionMatchResult
            {
                Offer = offer,
                Request = request,
                CompatibilityScore = new CompatibilityScore { OverallScore = 100 }, // Simple: all matches are 100%
                RecommendationReason = GenerateSimpleFlightCompanionReason(offer)
            }).ToList();

            _logger.LogInformation("Found {Count} flight companion matches", results.Count);
            return results;
        }

        /// <summary>
        /// Find pickup offers that match basic criteria
        /// </summary>
        public async Task<List<PickupMatchResult>> FindPickupMatchesAsync(int requestId, int maxResults = 10)
        {
            _logger.LogInformation("Finding pickup matches for request {RequestId}", requestId);

            var request = await _context.PickupRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
            {
                throw new ArgumentException($"Pickup request with ID {requestId} not found", nameof(requestId));
            }

            if (request.IsMatched)
            {
                return new List<PickupMatchResult>();
            }

            // Simple matching: same airport, can handle passengers and luggage
            var matches = await _context.PickupOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.Airport == request.Airport &&
                           o.MaxPassengers >= request.PassengerCount &&
                           (!request.HasLuggage || o.CanHandleLuggage) &&
                           o.UserId != request.UserId)
                .OrderBy(o => o.BaseRate) // Cheapest first
                .Take(maxResults)
                .ToListAsync();

            var results = matches.Select(offer => new PickupMatchResult
            {
                Offer = offer,
                Request = request,
                CompatibilityScore = new CompatibilityScore { OverallScore = 100 }, // Simple: all matches are 100%
                RecommendationReason = GenerateSimplePickupReason(offer)
            }).ToList();

            _logger.LogInformation("Found {Count} pickup matches", results.Count);
            return results;
        }

        /// <summary>
        /// Generate simple reason for flight companion match
        /// </summary>
        private string GenerateSimpleFlightCompanionReason(FlightCompanionOffer offer)
        {
            var reasons = new List<string>();

            if (offer.User.Rating > 0)
                reasons.Add($"{offer.User.Rating:F1} star rating");

            if (offer.HelpedCount > 0)
                reasons.Add($"{offer.HelpedCount} trips helped");

            if (offer.User.IsVerified)
                reasons.Add("Verified user");

            if (reasons.Any())
                return string.Join(", ", reasons);

            return "Available for your flight";
        }

        /// <summary>
        /// Generate simple reason for pickup match
        /// </summary>
        private string GenerateSimplePickupReason(PickupOffer offer)
        {
            var reasons = new List<string>();

            if (offer.AverageRating > 0)
                reasons.Add($"{offer.AverageRating:F1} star rating");

            if (offer.TotalPickups > 0)
                reasons.Add($"{offer.TotalPickups} pickups completed");

            if (offer.User.IsVerified)
                reasons.Add("Verified driver");

            if (reasons.Any())
                return string.Join(", ", reasons);

            return "Available for pickup";
        }
    }

    /// <summary>
    /// Interface for the matching service
    /// </summary>
    public interface IMatchingService
    {
        Task<List<FlightCompanionMatchResult>> FindFlightCompanionMatchesAsync(int requestId, int maxResults = 10);
        Task<List<PickupMatchResult>> FindPickupMatchesAsync(int requestId, int maxResults = 10);
    }

    /// <summary>
    /// Represents a flight companion match result
    /// </summary>
    public class FlightCompanionMatchResult
    {
        public FlightCompanionRequest Request { get; set; } = null!;
        public FlightCompanionOffer Offer { get; set; } = null!;
        public CompatibilityScore CompatibilityScore { get; set; } = null!;
        public string RecommendationReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents a pickup match result
    /// </summary>
    public class PickupMatchResult
    {
        public PickupRequest Request { get; set; } = null!;
        public PickupOffer Offer { get; set; } = null!;
        public CompatibilityScore CompatibilityScore { get; set; } = null!;
        public string RecommendationReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Simple compatibility score
    /// </summary>
    public class CompatibilityScore
    {
        /// <summary>
        /// Overall compatibility score (0-100)
        /// </summary>
        public decimal OverallScore { get; set; }
    }
}