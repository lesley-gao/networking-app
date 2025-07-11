using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;
using NetworkingApp.Services;
using System.Threading.Tasks;

namespace NetworkingApp.Controllers
{
    /// <summary>
    /// Handles user authentication: registration, login, logout, and password reset.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IEmailService _emailService;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, IEmailService emailService, IJwtTokenService jwtTokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
            _jwtTokenService = jwtTokenService;
        }

        /// <summary>
        /// Registers a new user.
        /// </summary>
        /// <param name="dto">Registration data</param>
        /// <returns>Result of registration</returns>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new User
            {
                UserName = dto.Email,
                Email = dto.Email,
                // Add additional properties if needed
            };
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            // Optionally assign default role
            await _userManager.AddToRoleAsync(user, "User");
            return Ok(new { message = "Registration successful." });
        }

        /// <summary>
        /// Logs in a user.
        /// </summary>
        /// <param name="dto">Login data</param>
        /// <returns>Result of login</returns>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials." });

            var result = await _signInManager.PasswordSignInAsync(user, dto.Password, dto.RememberMe, lockoutOnFailure: true);
            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid credentials or account locked." });

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwtTokenService.GenerateToken(user, roles);
            return Ok(new { token });
        }

        /// <summary>
        /// Logs out the current user.
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Logout successful." });
        }

        /// <summary>
        /// Initiates password reset by sending a reset email.
        /// </summary>
        /// <param name="dto">Password reset request data</param>
        /// <returns>Result of password reset request</returns>
        [HttpPost("password-reset")]
        [AllowAnonymous]
        public async Task<IActionResult> PasswordReset([FromBody] PasswordResetRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return Ok(new { message = "If the email is registered, a reset link will be sent." });

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            // Compose reset link (to be handled by frontend)
            var resetLink = $"{dto.ResetUrlBase}?email={user.Email}&token={System.Net.WebUtility.UrlEncode(token)}";
            await _emailService.SendPasswordResetEmailAsync(user.Email!, user.UserName!, resetLink);
            return Ok(new { message = "If the email is registered, a reset link will be sent." });
        }
    }
}
