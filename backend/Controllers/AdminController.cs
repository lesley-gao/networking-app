using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;
using System.Security.Claims;

namespace NetworkingApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            _logger.LogInformation("Admin health check requested by user: {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                admin = true,
                message = "Admin API is working correctly"
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.Id,
                        u.UserName,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.PhoneNumber,
                        u.PreferredLanguage,
                        u.CreatedAt,
                        u.LastLoginAt,
                        u.IsVerified,
                        u.IsActive,
                        u.Rating,
                        u.TotalRatings
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users for admin");
                return StatusCode(500, new { message = "Error retrieving users" });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var verifiedUsers = await _context.Users.CountAsync(u => u.IsVerified);
                var activeUsers = await _context.Users.CountAsync(u => u.IsActive);

                return Ok(new
                {
                    totalUsers,
                    verifiedUsers,
                    activeUsers,
                    verificationRate = totalUsers > 0 ? (double)verifiedUsers / totalUsers * 100 : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin stats");
                return StatusCode(500, new { message = "Error retrieving stats" });
            }
        }

        [HttpGet("me")]
        public IActionResult GetAdminInfo()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            return Ok(new
            {
                userId,
                email,
                roles,
                isAdmin = roles.Contains("Admin"),
                timestamp = DateTime.UtcNow
            });
        }
    }
} 