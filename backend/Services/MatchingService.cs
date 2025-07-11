// Services/MatchingService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NetworkingApp.Data;
using NetworkingApp.Models;

namespace NetworkingApp.Services
{
    /// <summary>
    /// Advanced matching service that considers user ratings, experience, preferences, and business rules
    /// to provide intelligent matching between service requests and offers.
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
        /// Find the best flight companion offers for a given request using advanced matching algorithms
        /// </summary>
        /// <param name="requestId">The flight companion request ID</param>
        /// <param name="maxResults">Maximum number of results to return (default: 10)</param>
        /// <returns>List of matched offers ordered by compatibility score</returns>
        public async Task<List<FlightCompanionMatchResult>> FindFlightCompanionMatchesAsync(
            int requestId, 
            int maxResults = 10)
        {
            _logger.LogInformation("Starting flight companion matching for request {RequestId}", requestId);

            var request = await _context.FlightCompanionRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
            {
                throw new ArgumentException($"Flight companion request with ID {requestId} not found", nameof(requestId));
            }

            if (request.IsMatched)
            {
                _logger.LogWarning("Request {RequestId} is already matched", requestId);
                return new List<FlightCompanionMatchResult>();
            }

            // Get potential offers based on core criteria
            var potentialOffers = await _context.FlightCompanionOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.FlightNumber == request.FlightNumber &&
                           o.FlightDate.Date == request.FlightDate.Date &&
                           o.DepartureAirport == request.DepartureAirport &&
                           o.ArrivalAirport == request.ArrivalAirport &&
                           o.UserId != request.UserId) // Don't match with self
                .ToListAsync();

            _logger.LogInformation("Found {Count} potential flight companion offers for request {RequestId}", 
                potentialOffers.Count, requestId);

            var matchResults = new List<FlightCompanionMatchResult>();

            foreach (var offer in potentialOffers)
            {
                var score = await CalculateFlightCompanionCompatibilityScore(request, offer);
                
                if (score.OverallScore > 0) // Only include viable matches
                {
                    matchResults.Add(new FlightCompanionMatchResult
                    {
                        Offer = offer,
                        Request = request,
                        CompatibilityScore = score,
                        RecommendationReason = GenerateFlightCompanionRecommendationReason(request, offer, score)
                    });
                }
            }

            // Sort by overall compatibility score (highest first)
            var sortedResults = matchResults
                .OrderByDescending(m => m.CompatibilityScore.OverallScore)
                .ThenByDescending(m => m.CompatibilityScore.UserReputationScore)
                .ThenByDescending(m => m.CompatibilityScore.ExperienceScore)
                .Take(maxResults)
                .ToList();

            _logger.LogInformation("Returning {Count} flight companion matches for request {RequestId}", 
                sortedResults.Count, requestId);

            return sortedResults;
        }

        /// <summary>
        /// Find the best pickup offers for a given request using advanced matching algorithms
        /// </summary>
        /// <param name="requestId">The pickup request ID</param>
        /// <param name="maxResults">Maximum number of results to return (default: 10)</param>
        /// <returns>List of matched offers ordered by compatibility score</returns>
        public async Task<List<PickupMatchResult>> FindPickupMatchesAsync(int requestId, int maxResults = 10)
        {
            _logger.LogInformation("Starting pickup matching for request {RequestId}", requestId);

            var request = await _context.PickupRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
            {
                throw new ArgumentException($"Pickup request with ID {requestId} not found", nameof(requestId));
            }

            if (request.IsMatched)
            {
                _logger.LogWarning("Request {RequestId} is already matched", requestId);
                return new List<PickupMatchResult>();
            }

            // Get potential offers based on core criteria
            var potentialOffers = await _context.PickupOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.Airport == request.Airport &&
                           o.MaxPassengers >= request.PassengerCount &&
                           (!request.HasLuggage || o.CanHandleLuggage) &&
                           o.UserId != request.UserId) // Don't match with self
                .ToListAsync();

            _logger.LogInformation("Found {Count} potential pickup offers for request {RequestId}", 
                potentialOffers.Count, requestId);

            var matchResults = new List<PickupMatchResult>();

            foreach (var offer in potentialOffers)
            {
                var score = await CalculatePickupCompatibilityScore(request, offer);
                
                if (score.OverallScore > 0) // Only include viable matches
                {
                    matchResults.Add(new PickupMatchResult
                    {
                        Offer = offer,
                        Request = request,
                        CompatibilityScore = score,
                        RecommendationReason = GeneratePickupRecommendationReason(request, offer, score)
                    });
                }
            }

            // Sort by overall compatibility score (highest first)
            var sortedResults = matchResults
                .OrderByDescending(m => m.CompatibilityScore.OverallScore)
                .ThenByDescending(m => m.CompatibilityScore.UserReputationScore)
                .ThenByDescending(m => m.CompatibilityScore.ServiceAreaScore)
                .Take(maxResults)
                .ToList();

            _logger.LogInformation("Returning {Count} pickup matches for request {RequestId}", 
                sortedResults.Count, requestId);

            return sortedResults;
        }

        /// <summary>
        /// Calculate comprehensive compatibility score for flight companion matching
        /// </summary>
        private async Task<CompatibilityScore> CalculateFlightCompanionCompatibilityScore(
            FlightCompanionRequest request, 
            FlightCompanionOffer offer)
        {
            var score = new CompatibilityScore();

            // 1. User Reputation Score (30% of total)
            score.UserReputationScore = CalculateUserReputationScore(offer.User);

            // 2. Experience Score (25% of total)
            score.ExperienceScore = CalculateFlightCompanionExperienceScore(offer);

            // 3. Language Compatibility Score (20% of total)
            score.LanguageCompatibilityScore = CalculateLanguageCompatibilityScore(request, offer);

            // 4. Special Needs Compatibility Score (15% of total)
            score.SpecialNeedsCompatibilityScore = CalculateSpecialNeedsCompatibilityScore(request, offer);

            // 5. Pricing Compatibility Score (10% of total)
            score.PricingCompatibilityScore = CalculatePricingCompatibilityScore(
                request.OfferedAmount, offer.RequestedAmount);

            // Calculate weighted overall score
            score.OverallScore = (
                score.UserReputationScore * 0.30m +
                score.ExperienceScore * 0.25m +
                score.LanguageCompatibilityScore * 0.20m +
                score.SpecialNeedsCompatibilityScore * 0.15m +
                score.PricingCompatibilityScore * 0.10m
            );

            // Apply bonus factors
            ApplyFlightCompanionBonusFactors(request, offer, score);

            return score;
        }

        /// <summary>
        /// Calculate comprehensive compatibility score for pickup matching
        /// </summary>
        private async Task<CompatibilityScore> CalculatePickupCompatibilityScore(
            PickupRequest request, 
            PickupOffer offer)
        {
            var score = new CompatibilityScore();

            // 1. User Reputation Score (35% of total)
            score.UserReputationScore = CalculateUserReputationScore(offer.User);

            // 2. Service Experience Score (25% of total)
            score.ExperienceScore = CalculatePickupExperienceScore(offer);

            // 3. Service Area Compatibility Score (20% of total)
            score.ServiceAreaScore = CalculateServiceAreaCompatibilityScore(request, offer);

            // 4. Language Compatibility Score (10% of total)
            score.LanguageCompatibilityScore = CalculateLanguageCompatibilityScore(request, offer);

            // 5. Pricing Compatibility Score (10% of total)
            score.PricingCompatibilityScore = CalculatePricingCompatibilityScore(
                request.OfferedAmount, offer.BaseRate);

            // Calculate weighted overall score
            score.OverallScore = (
                score.UserReputationScore * 0.35m +
                score.ExperienceScore * 0.25m +
                score.ServiceAreaScore * 0.20m +
                score.LanguageCompatibilityScore * 0.10m +
                score.PricingCompatibilityScore * 0.10m
            );

            // Apply bonus factors
            ApplyPickupBonusFactors(request, offer, score);

            return score;
        }

        /// <summary>
        /// Calculate user reputation score based on ratings and verification status
        /// </summary>
        private decimal CalculateUserReputationScore(User user)
        {
            decimal score = 0;

            // Base score from ratings (0-80 points)
            if (user.TotalRatings > 0)
            {
                // Convert 5-star rating to 0-80 scale
                score += (user.Rating / 5.0m) * 80;
                
                // Bonus for having more ratings (reliability indicator)
                if (user.TotalRatings >= 10) score += 5;
                else if (user.TotalRatings >= 5) score += 3;
                else if (user.TotalRatings >= 3) score += 1;
            }
            else
            {
                // New users get a moderate score
                score = 40;
            }

            // Verification bonus (up to 15 points)
            if (user.IsVerified) score += 15;

            // Account age bonus (up to 5 points)
            var accountAge = DateTime.UtcNow - user.CreatedAt;
            if (accountAge.TotalDays >= 365) score += 5;
            else if (accountAge.TotalDays >= 180) score += 3;
            else if (accountAge.TotalDays >= 30) score += 1;

            return Math.Min(score, 100); // Cap at 100
        }

        /// <summary>
        /// Calculate experience score for flight companion offers
        /// </summary>
        private decimal CalculateFlightCompanionExperienceScore(FlightCompanionOffer offer)
        {
            decimal score = 0;

            // Base score from help count (0-70 points)
            if (offer.HelpedCount >= 20) score += 70;
            else if (offer.HelpedCount >= 10) score += 50;
            else if (offer.HelpedCount >= 5) score += 30;
            else if (offer.HelpedCount >= 1) score += 15;
            else score += 5; // New helpers get some credit

            // Service variety bonus (0-20 points)
            if (!string.IsNullOrEmpty(offer.AvailableServices))
            {
                var serviceCount = offer.AvailableServices.Split(',').Length;
                score += Math.Min(serviceCount * 5, 20);
            }

            // Recent activity bonus (0-10 points)
            var daysSinceCreated = (DateTime.UtcNow - offer.CreatedAt).TotalDays;
            if (daysSinceCreated <= 7) score += 10;
            else if (daysSinceCreated <= 30) score += 5;

            return Math.Min(score, 100); // Cap at 100
        }

        /// <summary>
        /// Calculate experience score for pickup offers
        /// </summary>
        private decimal CalculatePickupExperienceScore(PickupOffer offer)
        {
            decimal score = 0;

            // Base score from pickup count (0-60 points)
            if (offer.TotalPickups >= 50) score += 60;
            else if (offer.TotalPickups >= 20) score += 45;
            else if (offer.TotalPickups >= 10) score += 30;
            else if (offer.TotalPickups >= 5) score += 20;
            else if (offer.TotalPickups >= 1) score += 10;
            else score += 5; // New drivers get some credit

            // Rating-based bonus (0-25 points)
            if (offer.AverageRating > 0)
            {
                score += (offer.AverageRating / 5.0m) * 25;
            }

            // Vehicle capacity bonus (0-10 points)
            if (offer.MaxPassengers >= 6) score += 10;
            else if (offer.MaxPassengers >= 4) score += 5;

            // Additional services bonus (0-5 points)
            if (!string.IsNullOrEmpty(offer.AdditionalServices)) score += 5;

            return Math.Min(score, 100); // Cap at 100
        }

        /// <summary>
        /// Calculate language compatibility score
        /// </summary>
        private decimal CalculateLanguageCompatibilityScore(FlightCompanionRequest request, FlightCompanionOffer offer)
        {
            return CalculateLanguageCompatibilityScore(request.User?.PreferredLanguage, offer.Languages);
        }

        private decimal CalculateLanguageCompatibilityScore(PickupRequest request, PickupOffer offer)
        {
            return CalculateLanguageCompatibilityScore(request.User?.PreferredLanguage, offer.Languages);
        }

        private decimal CalculateLanguageCompatibilityScore(string? userLanguage, string? offerLanguages)
        {
            if (string.IsNullOrEmpty(userLanguage) || string.IsNullOrEmpty(offerLanguages))
                return 50; // Neutral score when information is missing

            var userLang = userLanguage.ToLowerInvariant();
            var availableLanguages = offerLanguages.ToLowerInvariant().Split(',').Select(l => l.Trim()).ToList();

            // Perfect match
            if (availableLanguages.Contains(userLang)) return 100;

            // Check for language family compatibility
            if ((userLang.Contains("chinese") || userLang.Contains("mandarin") || userLang.Contains("cantonese")) &&
                availableLanguages.Any(l => l.Contains("chinese") || l.Contains("mandarin") || l.Contains("cantonese")))
                return 90;

            // English is generally useful
            if (availableLanguages.Contains("english")) return 70;

            return 30; // Some penalty for language mismatch
        }

        /// <summary>
        /// Calculate special needs compatibility score
        /// </summary>
        private decimal CalculateSpecialNeedsCompatibilityScore(FlightCompanionRequest request, FlightCompanionOffer offer)
        {
            if (string.IsNullOrEmpty(request.SpecialNeeds))
                return 100; // No special needs = perfect match

            if (string.IsNullOrEmpty(offer.AvailableServices))
                return 40; // Has needs but offer doesn't specify services

            var needs = request.SpecialNeeds.ToLowerInvariant();
            var services = offer.AvailableServices.ToLowerInvariant();

            decimal score = 50; // Base score

            // Check for specific service matches
            if (needs.Contains("translation") && services.Contains("translation")) score += 25;
            if (needs.Contains("navigation") && services.Contains("navigation")) score += 20;
            if (needs.Contains("wheelchair") && services.Contains("wheelchair")) score += 30;
            if (needs.Contains("elderly") && services.Contains("elderly")) score += 25;
            if (needs.Contains("medical") && services.Contains("medical")) score += 30;
            if (needs.Contains("language") && services.Contains("language")) score += 20;

            return Math.Min(score, 100); // Cap at 100
        }

        /// <summary>
        /// Calculate service area compatibility score for pickup requests
        /// </summary>
        private decimal CalculateServiceAreaCompatibilityScore(PickupRequest request, PickupOffer offer)
        {
            if (string.IsNullOrEmpty(offer.ServiceArea))
                return 50; // No specified area = neutral score

            var destination = request.DestinationAddress.ToLowerInvariant();
            var serviceArea = offer.ServiceArea.ToLowerInvariant();

            // Check for specific area matches
            if (serviceArea.Contains("all auckland") || serviceArea.Contains("all aucklabd"))
                return 90;

            decimal score = 50; // Base score

            // Check for area matches
            if (destination.Contains("city") && serviceArea.Contains("city")) score += 30;
            if (destination.Contains("north shore") && serviceArea.Contains("north shore")) score += 40;
            if (destination.Contains("east auckland") && serviceArea.Contains("east")) score += 35;
            if (destination.Contains("west auckland") && serviceArea.Contains("west")) score += 35;
            if (destination.Contains("south auckland") && serviceArea.Contains("south")) score += 35;
            if (destination.Contains("cbd") && serviceArea.Contains("cbd")) score += 35;

            return Math.Min(score, 100); // Cap at 100
        }

        /// <summary>
        /// Calculate pricing compatibility score
        /// </summary>
        private decimal CalculatePricingCompatibilityScore(decimal offeredAmount, decimal requestedAmount)
        {
            if (requestedAmount == 0) return 100; // Free service = perfect
            if (offeredAmount == 0) return 0; // No budget = incompatible

            var ratio = offeredAmount / requestedAmount;

            if (ratio >= 1.2m) return 100; // Generous budget
            if (ratio >= 1.0m) return 90;  // Exact match
            if (ratio >= 0.8m) return 70;  // Close match
            if (ratio >= 0.6m) return 50;  // Tight but possible
            if (ratio >= 0.4m) return 30;  // Very tight
            
            return 10; // Probably insufficient
        }

        /// <summary>
        /// Apply bonus factors for flight companion matching
        /// </summary>
        private void ApplyFlightCompanionBonusFactors(
            FlightCompanionRequest request, 
            FlightCompanionOffer offer, 
            CompatibilityScore score)
        {
            // Elderly traveler priority (guideline GUD-001)
            if (request.TravelerAge?.ToLowerInvariant().Contains("elderly") == true)
            {
                score.OverallScore *= 1.15m; // 15% boost for elderly assistance
                _logger.LogDebug("Applied elderly priority bonus for request {RequestId}", request.Id);
            }

            // Time sensitivity bonus (within 24 hours)
            var timeToFlight = request.FlightDate - DateTime.UtcNow;
            if (timeToFlight.TotalHours <= 24 && timeToFlight.TotalHours > 0)
            {
                score.OverallScore *= 1.10m; // 10% boost for urgent requests
                _logger.LogDebug("Applied time sensitivity bonus for request {RequestId}", request.Id);
            }

            // First-time traveler assistance bonus
            if (request.SpecialNeeds?.ToLowerInvariant().Contains("first time") == true)
            {
                score.OverallScore *= 1.08m; // 8% boost for first-time travelers
                _logger.LogDebug("Applied first-time traveler bonus for request {RequestId}", request.Id);
            }
        }

        /// <summary>
        /// Apply bonus factors for pickup matching
        /// </summary>
        private void ApplyPickupBonusFactors(
            PickupRequest request, 
            PickupOffer offer, 
            CompatibilityScore score)
        {
            // Large group accommodation bonus
            if (request.PassengerCount >= 4 && offer.MaxPassengers >= request.PassengerCount)
            {
                score.OverallScore *= 1.12m; // 12% boost for accommodating large groups
                _logger.LogDebug("Applied large group bonus for request {RequestId}", request.Id);
            }

            // Time sensitivity bonus (arrival within 6 hours)
            var arrivalDateTime = request.ArrivalDate.Date + request.ArrivalTime;
            var timeToArrival = arrivalDateTime - DateTime.UtcNow;
            if (timeToArrival.TotalHours <= 6 && timeToArrival.TotalHours > 0)
            {
                score.OverallScore *= 1.10m; // 10% boost for urgent pickups
                _logger.LogDebug("Applied time sensitivity bonus for request {RequestId}", request.Id);
            }

            // Special requirements accommodation bonus
            if (request.HasLuggage && offer.CanHandleLuggage && 
                request.SpecialRequests?.ToLowerInvariant().Contains("large luggage") == true)
            {
                score.OverallScore *= 1.08m; // 8% boost for special luggage handling
                _logger.LogDebug("Applied special luggage bonus for request {RequestId}", request.Id);
            }
        }

        /// <summary>
        /// Generate recommendation reason for flight companion matches
        /// </summary>
        private string GenerateFlightCompanionRecommendationReason(
            FlightCompanionRequest request, 
            FlightCompanionOffer offer, 
            CompatibilityScore score)
        {
            var reasons = new List<string>();

            if (score.UserReputationScore >= 80)
                reasons.Add($"Highly rated helper ({offer.User.Rating:F1}/5.0 stars)");
            
            if (offer.HelpedCount >= 10)
                reasons.Add($"Experienced companion ({offer.HelpedCount} trips helped)");
            
            if (score.LanguageCompatibilityScore >= 90)
                reasons.Add("Perfect language match");
            
            if (score.SpecialNeedsCompatibilityScore >= 80)
                reasons.Add("Excellent match for your specific needs");
            
            if (score.PricingCompatibilityScore >= 90)
                reasons.Add("Great value within your budget");

            if (offer.User.IsVerified)
                reasons.Add("Verified community member");

            return reasons.Any() ? string.Join(", ", reasons) : "Good overall compatibility";
        }

        /// <summary>
        /// Generate recommendation reason for pickup matches
        /// </summary>
        private string GeneratePickupRecommendationReason(
            PickupRequest request, 
            PickupOffer offer, 
            CompatibilityScore score)
        {
            var reasons = new List<string>();

            if (score.UserReputationScore >= 80)
                reasons.Add($"Highly rated driver ({offer.User.Rating:F1}/5.0 stars)");
            
            if (offer.TotalPickups >= 20)
                reasons.Add($"Experienced driver ({offer.TotalPickups} successful pickups)");
            
            if (score.ServiceAreaScore >= 80)
                reasons.Add("Perfect location match");
            
            if (offer.MaxPassengers > request.PassengerCount)
                reasons.Add("Spacious vehicle available");
            
            if (score.PricingCompatibilityScore >= 90)
                reasons.Add("Competitive pricing");

            if (offer.User.IsVerified)
                reasons.Add("Verified driver");

            return reasons.Any() ? string.Join(", ", reasons) : "Good overall compatibility";
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
    /// Represents a flight companion match result with compatibility scoring
    /// </summary>
    public class FlightCompanionMatchResult
    {
        public FlightCompanionRequest Request { get; set; } = null!;
        public FlightCompanionOffer Offer { get; set; } = null!;
        public CompatibilityScore CompatibilityScore { get; set; } = null!;
        public string RecommendationReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents a pickup match result with compatibility scoring
    /// </summary>
    public class PickupMatchResult
    {
        public PickupRequest Request { get; set; } = null!;
        public PickupOffer Offer { get; set; } = null!;
        public CompatibilityScore CompatibilityScore { get; set; } = null!;
        public string RecommendationReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Comprehensive compatibility scoring breakdown
    /// </summary>
    public class CompatibilityScore
    {
        /// <summary>
        /// Overall weighted compatibility score (0-100)
        /// </summary>
        public decimal OverallScore { get; set; }

        /// <summary>
        /// User reputation score based on ratings and verification (0-100)
        /// </summary>
        public decimal UserReputationScore { get; set; }

        /// <summary>
        /// Experience score based on service history (0-100)
        /// </summary>
        public decimal ExperienceScore { get; set; }

        /// <summary>
        /// Language compatibility score (0-100)
        /// </summary>
        public decimal LanguageCompatibilityScore { get; set; }

        /// <summary>
        /// Special needs compatibility score (0-100)
        /// </summary>
        public decimal SpecialNeedsCompatibilityScore { get; set; }

        /// <summary>
        /// Service area compatibility score for pickup services (0-100)
        /// </summary>
        public decimal ServiceAreaScore { get; set; }

        /// <summary>
        /// Pricing compatibility score (0-100)
        /// </summary>
        public decimal PricingCompatibilityScore { get; set; }
    }
}