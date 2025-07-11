// Controllers/RatingController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace NetworkingApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RatingController> _logger;

        public RatingController(ApplicationDbContext context, ILogger<RatingController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Submit a rating for a completed service
        /// POST: api/rating
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Rating>> SubmitRating(SubmitRatingRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var raterId = GetCurrentUserId();
                if (raterId == null)
                {
                    return Unauthorized();
                }

                // Validate business rules
                if (raterId == request.RatedUserId)
                {
                    throw ApiException.BadRequest("You cannot rate yourself.", 
                        $"RaterId: {raterId}, RatedUserId: {request.RatedUserId}");
                }

                // Check if rating already exists for this request
                var existingRating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.RaterId == raterId && 
                                            r.RequestId == request.RequestId && 
                                            r.RequestType == request.RequestType);

                if (existingRating != null)
                {
                    throw ApiException.Conflict("You have already rated this service.",
                        $"Existing rating ID: {existingRating.Id}");
                }

                // Verify the request exists and validate the relationship
                await ValidateServiceRequest(request, raterId.Value);

                // Verify the rated user exists
                var ratedUser = await _context.Users.FindAsync(request.RatedUserId);
                if (ratedUser == null || !ratedUser.IsActive)
                {
                    throw ApiException.NotFound("User", request.RatedUserId.ToString());
                }

                // Create the rating
                var rating = new Rating
                {
                    RaterId = raterId.Value,
                    RatedUserId = request.RatedUserId,
                    RequestId = request.RequestId,
                    RequestType = request.RequestType,
                    Score = request.Score,
                    Comment = request.Comment?.Trim(),
                    IsPublic = request.IsPublic,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Ratings.Add(rating);
                await _context.SaveChangesAsync();

                // Update user's average rating and total count
                await UpdateUserRatingStats(request.RatedUserId);

                _logger.LogInformation("Rating submitted: User {RaterId} rated User {RatedUserId} with score {Score} for {RequestType} {RequestId}", 
                    raterId, request.RatedUserId, request.Score, request.RequestType, request.RequestId);

                // Return the created rating with navigation properties
                var createdRating = await _context.Ratings
                    .Include(r => r.Rater)
                    .Include(r => r.RatedUser)
                    .FirstOrDefaultAsync(r => r.Id == rating.Id);

                return CreatedAtAction(nameof(GetRating), new { id = rating.Id }, createdRating);
            }
            catch (Exception ex) when (!(ex is ApiException))
            {
                _logger.LogError(ex, "Error submitting rating");
                throw; // Will be handled by middleware
            }
        }

        /// <summary>
        /// Get a specific rating by ID
        /// GET: api/rating/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Rating>> GetRating(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid rating ID.");
            }

            try
            {
                var rating = await _context.Ratings
                    .Include(r => r.Rater)
                    .Include(r => r.RatedUser)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (rating == null)
                {
                    throw ApiException.NotFound("Rating", id.ToString());
                }

                // Check if rating is public or if current user is involved
                var currentUserId = GetCurrentUserId();
                if (!rating.IsPublic && currentUserId != rating.RaterId && currentUserId != rating.RatedUserId)
                {
                    throw ApiException.Forbidden("You don't have permission to view this rating.");
                }

                return Ok(rating);
            }
            catch (Exception ex) when (!(ex is ApiException))
            {
                _logger.LogError(ex, "Error retrieving rating {RatingId}", id);
                throw;
            }
        }

        /// <summary>
        /// Get all ratings for a specific user
        /// GET: api/rating/user/{userId}
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<UserRatingsResponse>> GetUserRatings(int userId, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] bool publicOnly = true)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID.");
            }

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 10;

            try
            {
                // Verify user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    throw ApiException.NotFound("User", userId.ToString());
                }

                var currentUserId = GetCurrentUserId();
                var canViewPrivate = currentUserId == userId; // Users can see their own private ratings

                var query = _context.Ratings
                    .Include(r => r.Rater)
                    .Where(r => r.RatedUserId == userId);

                // Apply privacy filter
                if (publicOnly && !canViewPrivate)
                {
                    query = query.Where(r => r.IsPublic);
                }
                else if (!canViewPrivate)
                {
                    query = query.Where(r => r.IsPublic);
                }

                var totalCount = await query.CountAsync();
                
                var ratings = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var response = new UserRatingsResponse
                {
                    UserId = userId,
                    UserName = $"{user.FirstName} {user.LastName}",
                    AverageRating = user.Rating,
                    TotalRatings = user.TotalRatings,
                    Ratings = ratings,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    HasNextPage = (page * pageSize) < totalCount
                };

                return Ok(response);
            }
            catch (Exception ex) when (!(ex is ApiException))
            {
                _logger.LogError(ex, "Error retrieving ratings for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Get ratings for a specific service request
        /// GET: api/rating/service/{requestType}/{requestId}
        /// </summary>
        [HttpGet("service/{requestType}/{requestId}")]
        public async Task<ActionResult<IEnumerable<Rating>>> GetServiceRatings(string requestType, int requestId)
        {
            if (string.IsNullOrWhiteSpace(requestType) || requestId <= 0)
            {
                return BadRequest("Invalid request type or ID.");
            }

            var validRequestTypes = new[] { "FlightCompanionRequest", "PickupRequest" };
            if (!validRequestTypes.Contains(requestType))
            {
                return BadRequest($"Invalid request type. Must be one of: {string.Join(", ", validRequestTypes)}");
            }

            try
            {
                var ratings = await _context.Ratings
                    .Include(r => r.Rater)
                    .Include(r => r.RatedUser)
                    .Where(r => r.RequestType == requestType && r.RequestId == requestId && r.IsPublic)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(ratings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ratings for {RequestType} {RequestId}", requestType, requestId);
                throw;
            }
        }

        /// <summary>
        /// Update an existing rating (only by the original rater within 24 hours)
        /// PUT: api/rating/{id}
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<Rating>> UpdateRating(int id, UpdateRatingRequest request)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid rating ID.");
            }

            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized();
                }

                var rating = await _context.Ratings.FindAsync(id);
                if (rating == null)
                {
                    throw ApiException.NotFound("Rating", id.ToString());
                }

                // Verify ownership
                if (rating.RaterId != currentUserId)
                {
                    throw ApiException.Forbidden("You can only update your own ratings.");
                }

                // Check if rating is still editable (within 24 hours)
                var hoursSinceCreation = (DateTime.UtcNow - rating.CreatedAt).TotalHours;
                if (hoursSinceCreation > 24)
                {
                    throw ApiException.BadRequest("Ratings can only be updated within 24 hours of creation.",
                        $"Rating was created {hoursSinceCreation:F1} hours ago.");
                }

                // Update the rating
                rating.Score = request.Score;
                rating.Comment = request.Comment?.Trim();
                rating.IsPublic = request.IsPublic;

                await _context.SaveChangesAsync();

                // Recalculate user's rating stats
                await UpdateUserRatingStats(rating.RatedUserId);

                _logger.LogInformation("Rating {RatingId} updated by User {UserId}", id, currentUserId);

                // Return updated rating with navigation properties
                var updatedRating = await _context.Ratings
                    .Include(r => r.Rater)
                    .Include(r => r.RatedUser)
                    .FirstOrDefaultAsync(r => r.Id == id);

                return Ok(updatedRating);
            }
            catch (Exception ex) when (!(ex is ApiException))
            {
                _logger.LogError(ex, "Error updating rating {RatingId}", id);
                throw;
            }
        }

        /// <summary>
        /// Get rating statistics summary
        /// GET: api/rating/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<RatingStatsResponse>> GetRatingStats()
        {
            try
            {
                var stats = new RatingStatsResponse
                {
                    TotalRatings = await _context.Ratings.CountAsync(),
                    AverageRating = await _context.Ratings.AverageAsync(r => (decimal)r.Score),
                    RatingDistribution = await _context.Ratings
                        .GroupBy(r => r.Score)
                        .Select(g => new RatingDistribution { Score = g.Key, Count = g.Count() })
                        .OrderBy(rd => rd.Score)
                        .ToListAsync(),
                    FlightCompanionRatings = await _context.Ratings
                        .CountAsync(r => r.RequestType == "FlightCompanionRequest"),
                    PickupRatings = await _context.Ratings
                        .CountAsync(r => r.RequestType == "PickupRequest"),
                    PublicRatings = await _context.Ratings.CountAsync(r => r.IsPublic),
                    RecentRatings = await _context.Ratings
                        .CountAsync(r => r.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rating statistics");
                throw;
            }
        }

        #region Private Helper Methods

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private async Task ValidateServiceRequest(SubmitRatingRequest request, int raterId)
        {
            switch (request.RequestType)
            {
                case "FlightCompanionRequest":
                    await ValidateFlightCompanionRequest(request, raterId);
                    break;
                case "PickupRequest":
                    await ValidatePickupRequest(request, raterId);
                    break;
                default:
                    throw ApiException.BadRequest("Invalid request type.", 
                        $"Supported types: FlightCompanionRequest, PickupRequest");
            }
        }

        private async Task ValidateFlightCompanionRequest(SubmitRatingRequest request, int raterId)
        {
            var fcRequest = await _context.FlightCompanionRequests
                .Include(r => r.MatchedOffer)
                .ThenInclude(o => o!.User)
                .FirstOrDefaultAsync(r => r.Id == request.RequestId);

            if (fcRequest == null)
            {
                throw ApiException.NotFound("FlightCompanionRequest", request.RequestId.ToString());
            }

            // Validate that the service is completed (has a match)
            if (!fcRequest.IsMatched || fcRequest.MatchedOffer == null)
            {
                throw ApiException.BadRequest("Cannot rate an incomplete service.",
                    "Flight companion request must be matched and completed.");
            }

            // Validate that the rater is involved in this service
            var isRequester = fcRequest.UserId == raterId;
            var isProvider = fcRequest.MatchedOffer.UserId == raterId;

            if (!isRequester && !isProvider)
            {
                throw ApiException.Forbidden("You can only rate services you were involved in.");
            }

            // Validate that the rated user is the other party
            var expectedRatedUserId = isRequester ? fcRequest.MatchedOffer.UserId : fcRequest.UserId;
            if (request.RatedUserId != expectedRatedUserId)
            {
                throw ApiException.BadRequest("Invalid rated user for this service.",
                    $"Expected rated user ID: {expectedRatedUserId}");
            }
        }

        private async Task ValidatePickupRequest(SubmitRatingRequest request, int raterId)
        {
            var pickupRequest = await _context.PickupRequests
                .Include(r => r.MatchedOffer)
                .ThenInclude(o => o!.User)
                .FirstOrDefaultAsync(r => r.Id == request.RequestId);

            if (pickupRequest == null)
            {
                throw ApiException.NotFound("PickupRequest", request.RequestId.ToString());
            }

            // Validate that the service is completed (has a match)
            if (!pickupRequest.IsMatched || pickupRequest.MatchedOffer == null)
            {
                throw ApiException.BadRequest("Cannot rate an incomplete service.",
                    "Pickup request must be matched and completed.");
            }

            // Validate that the rater is involved in this service
            var isRequester = pickupRequest.UserId == raterId;
            var isProvider = pickupRequest.MatchedOffer.UserId == raterId;

            if (!isRequester && !isProvider)
            {
                throw ApiException.Forbidden("You can only rate services you were involved in.");
            }

            // Validate that the rated user is the other party
            var expectedRatedUserId = isRequester ? pickupRequest.MatchedOffer.UserId : pickupRequest.UserId;
            if (request.RatedUserId != expectedRatedUserId)
            {
                throw ApiException.BadRequest("Invalid rated user for this service.",
                    $"Expected rated user ID: {expectedRatedUserId}");
            }
        }

        private async Task UpdateUserRatingStats(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                var ratings = await _context.Ratings
                    .Where(r => r.RatedUserId == userId)
                    .ToListAsync();

                if (ratings.Any())
                {
                    user.Rating = (decimal)ratings.Average(r => r.Score);
                    user.TotalRatings = ratings.Count;
                }
                else
                {
                    user.Rating = 0;
                    user.TotalRatings = 0;
                }

                await _context.SaveChangesAsync();
            }
        }

        #endregion
    }

    #region DTOs

    public class SubmitRatingRequest
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Rated user ID must be greater than 0.")]
        public int RatedUserId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Request ID must be greater than 0.")]
        public int RequestId { get; set; }

        [Required]
        [StringLength(20)]
        public string RequestType { get; set; } = string.Empty; // "FlightCompanionRequest" or "PickupRequest"

        [Required]
        [Range(1, 5, ErrorMessage = "Score must be between 1 and 5.")]
        public int Score { get; set; }

        [StringLength(500, ErrorMessage = "Comment cannot exceed 500 characters.")]
        public string? Comment { get; set; }

        public bool IsPublic { get; set; } = true;
    }

    public class UpdateRatingRequest
    {
        [Required]
        [Range(1, 5, ErrorMessage = "Score must be between 1 and 5.")]
        public int Score { get; set; }

        [StringLength(500, ErrorMessage = "Comment cannot exceed 500 characters.")]
        public string? Comment { get; set; }

        public bool IsPublic { get; set; } = true;
    }

    public class UserRatingsResponse
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public decimal AverageRating { get; set; }
        public int TotalRatings { get; set; }
        public List<Rating> Ratings { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public bool HasNextPage { get; set; }
    }

    public class RatingStatsResponse
    {
        public int TotalRatings { get; set; }
        public decimal AverageRating { get; set; }
        public List<RatingDistribution> RatingDistribution { get; set; } = new();
        public int FlightCompanionRatings { get; set; }
        public int PickupRatings { get; set; }
        public int PublicRatings { get; set; }
        public int RecentRatings { get; set; }
    }

    public class RatingDistribution
    {
        public int Score { get; set; }
        public int Count { get; set; }
    }

    #endregion
}