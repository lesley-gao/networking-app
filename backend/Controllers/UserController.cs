// Controllers/UserController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            ApplicationDbContext context,
            ILogger<UserController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _logger = logger;
        }

        // POST: api/User/register
        [HttpPost("register")]
        public async Task<ActionResult<UserRegistrationResponse>> Register(UserRegistrationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { Message = "User with this email already exists" });
                }

                // Create new user
                var user = new User
                {
                    UserName = request.Email,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    PreferredLanguage = request.PreferredLanguage ?? "English",
                    EmergencyContact = request.EmergencyContact,
                    EmergencyPhone = request.EmergencyPhone,
                    IsVerified = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user, request.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation($"User {user.Email} registered successfully");

                    var response = new UserRegistrationResponse
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        IsVerified = user.IsVerified,
                        Message = "Registration successful. Please verify your account to access all features."
                    };

                    return CreatedAtAction(nameof(GetProfile), new { id = user.Id }, response);
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }

                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration");
                return StatusCode(500, new { Message = "An error occurred during registration" });
            }
        }

        // GET: api/User/profile
        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<UserProfileResponse>> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                var profile = new UserProfileResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    PreferredLanguage = user.PreferredLanguage,
                    IsVerified = user.IsVerified,
                    EmergencyContact = user.EmergencyContact,
                    EmergencyPhone = user.EmergencyPhone,
                    Rating = user.Rating,
                    TotalRatings = user.TotalRatings,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile");
                return StatusCode(500, new { Message = "An error occurred while retrieving profile" });
            }
        }

        // GET: api/User/profile/{id}
        [HttpGet("profile/{id}")]
        public async Task<ActionResult<PublicUserProfileResponse>> GetPublicProfile(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null || !user.IsActive)
                {
                    return NotFound();
                }

                // Return limited public information
                var publicProfile = new PublicUserProfileResponse
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PreferredLanguage = user.PreferredLanguage,
                    IsVerified = user.IsVerified,
                    Rating = user.Rating,
                    TotalRatings = user.TotalRatings,
                    MemberSince = user.CreatedAt
                };

                return Ok(publicProfile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving public profile for user {id}");
                return StatusCode(500, new { Message = "An error occurred while retrieving profile" });
            }
        }

        // PUT: api/User/profile
        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<UserProfileResponse>> UpdateProfile(UpdateUserProfileRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                // Update user properties
                user.FirstName = request.FirstName ?? user.FirstName;
                user.LastName = request.LastName ?? user.LastName;
                user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
                user.PreferredLanguage = request.PreferredLanguage ?? user.PreferredLanguage;
                user.EmergencyContact = request.EmergencyContact ?? user.EmergencyContact;
                user.EmergencyPhone = request.EmergencyPhone ?? user.EmergencyPhone;

                await _context.SaveChangesAsync();

                var updatedProfile = new UserProfileResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    PreferredLanguage = user.PreferredLanguage,
                    IsVerified = user.IsVerified,
                    EmergencyContact = user.EmergencyContact,
                    EmergencyPhone = user.EmergencyPhone,
                    Rating = user.Rating,
                    TotalRatings = user.TotalRatings,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                _logger.LogInformation($"Profile updated for user {user.Email}");
                return Ok(updatedProfile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new { Message = "An error occurred while updating profile" });
            }
        }

        // GET: api/User/verification-status
        [HttpGet("verification-status")]
        [Authorize]
        public async Task<ActionResult<UserVerificationStatusResponse>> GetVerificationStatus()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                var status = new UserVerificationStatusResponse
                {
                    IsVerified = user.IsVerified,
                    VerificationDocuments = user.VerificationDocuments,
                    CanOfferServices = user.IsVerified && user.IsActive,
                    Message = user.IsVerified 
                        ? "Account is verified and can offer services" 
                        : "Account verification required to offer services"
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving verification status");
                return StatusCode(500, new { Message = "An error occurred while retrieving verification status" });
            }
        }

        // POST: api/User/submit-verification
        [HttpPost("submit-verification")]
        [Authorize]
        public async Task<ActionResult> SubmitVerificationDocuments(SubmitVerificationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                if (user.IsVerified)
                {
                    return BadRequest(new { Message = "User is already verified" });
                }

                // Update verification documents (in a real app, you'd handle file uploads)
                user.VerificationDocuments = request.DocumentReferences;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Verification documents submitted for user {user.Email}");

                return Ok(new { Message = "Verification documents submitted successfully. Review is in progress." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting verification documents");
                return StatusCode(500, new { Message = "An error occurred while submitting verification documents" });
            }
        }

        // GET: api/User/stats
        [HttpGet("stats")]
        [Authorize]
        public async Task<ActionResult<UserStatsResponse>> GetUserStats()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var user = await _context.Users
                    .Include(u => u.FlightCompanionRequests)
                    .Include(u => u.FlightCompanionOffers)
                    .Include(u => u.PickupRequests)
                    .Include(u => u.PickupOffers)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound();
                }

                var stats = new UserStatsResponse
                {
                    TotalFlightCompanionRequests = user.FlightCompanionRequests.Count,
                    TotalFlightCompanionOffers = user.FlightCompanionOffers.Count,
                    TotalPickupRequests = user.PickupRequests.Count,
                    TotalPickupOffers = user.PickupOffers.Count,
                    CompletedServices = user.FlightCompanionOffers.Count(o => !o.IsAvailable) + 
                                     user.PickupOffers.Sum(o => o.TotalPickups),
                    AverageRating = user.Rating,
                    TotalRatings = user.TotalRatings
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user stats");
                return StatusCode(500, new { Message = "An error occurred while retrieving user statistics" });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
    }

    // DTOs for API requests and responses
    public class UserRegistrationRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [MaxLength(10)]
        public string? PreferredLanguage { get; set; }

        [MaxLength(100)]
        public string? EmergencyContact { get; set; }

        [Phone]
        public string? EmergencyPhone { get; set; }
    }

    public class UserRegistrationResponse
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string PreferredLanguage { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public string? EmergencyContact { get; set; }
        public string? EmergencyPhone { get; set; }
        public decimal Rating { get; set; }
        public int TotalRatings { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class PublicUserProfileResponse
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PreferredLanguage { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public decimal Rating { get; set; }
        public int TotalRatings { get; set; }
        public DateTime MemberSince { get; set; }
    }

    public class UpdateUserProfileRequest
    {
        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? LastName { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }

        [MaxLength(10)]
        public string? PreferredLanguage { get; set; }

        [MaxLength(100)]
        public string? EmergencyContact { get; set; }

        [Phone]
        public string? EmergencyPhone { get; set; }
    }

    public class UserVerificationStatusResponse
    {
        public bool IsVerified { get; set; }
        public string? VerificationDocuments { get; set; }
        public bool CanOfferServices { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class SubmitVerificationRequest
    {
        [Required]
        [MaxLength(500)]
        public string DocumentReferences { get; set; } = string.Empty;
    }

    public class UserStatsResponse
    {
        public int TotalFlightCompanionRequests { get; set; }
        public int TotalFlightCompanionOffers { get; set; }
        public int TotalPickupRequests { get; set; }
        public int TotalPickupOffers { get; set; }
        public int CompletedServices { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalRatings { get; set; }
    }
}