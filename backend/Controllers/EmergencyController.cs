using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NetworkingApp.Models.DTOs;
using NetworkingApp.Services;
using System.Security.Claims;

namespace NetworkingApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmergencyController : ControllerBase
    {
        private readonly IEmergencyService _emergencyService;
        private readonly ILogger<EmergencyController> _logger;

        public EmergencyController(IEmergencyService emergencyService, ILogger<EmergencyController> logger)
        {
            _emergencyService = emergencyService;
            _logger = logger;
        }

        /// <summary>
        /// Trigger an emergency alert
        /// </summary>
        [HttpPost("trigger")]
        public async Task<ActionResult<EmergencyResponseDto>> TriggerEmergency([FromBody] CreateEmergencyDto emergencyDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Invalid user identification");
                }

                var emergency = await _emergencyService.CreateEmergencyAsync(userId, emergencyDto);
                
                _logger.LogWarning("Emergency triggered by User: {UserId}, Type: {Type}", userId, emergencyDto.Type);
                
                return Ok(emergency);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering emergency");
                return StatusCode(500, "An error occurred while processing the emergency");
            }
        }

        /// <summary>
        /// Quick SOS trigger with location
        /// </summary>
        [HttpPost("sos")]
        public async Task<ActionResult<EmergencyResponseDto>> TriggerSOS([FromBody] SOSRequestDto sosRequest)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Invalid user identification");
                }

                var emergencyDto = new CreateEmergencyDto
                {
                    Type = "SOS",
                    Description = sosRequest.Description ?? "SOS - Immediate assistance needed",
                    Location = sosRequest.Location
                };

                var emergency = await _emergencyService.CreateEmergencyAsync(userId, emergencyDto);
                
                _logger.LogWarning("SOS triggered by User: {UserId} at Location: {Location}", userId, sosRequest.Location);
                
                return Ok(emergency);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering SOS");
                return StatusCode(500, "An error occurred while processing the SOS");
            }
        }

        /// <summary>
        /// Resolve an emergency (admin or user)
        /// </summary>
        [HttpPut("{emergencyId}/resolve")]
        public async Task<ActionResult<EmergencyResponseDto>> ResolveEmergency(int emergencyId, [FromBody] ResolveEmergencyDto resolveDto)
        {
            try
            {
                var emergency = await _emergencyService.ResolveEmergencyAsync(emergencyId, resolveDto);
                return Ok(emergency);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resolving emergency {EmergencyId}", emergencyId);
                return StatusCode(500, "An error occurred while resolving the emergency");
            }
        }

        /// <summary>
        /// Cancel an emergency (user only)
        /// </summary>
        [HttpPut("{emergencyId}/cancel")]
        public async Task<ActionResult> CancelEmergency(int emergencyId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Invalid user identification");
                }

                var result = await _emergencyService.CancelEmergencyAsync(emergencyId, userId);
                if (!result)
                {
                    return NotFound("Emergency not found or cannot be cancelled");
                }

                return Ok(new { message = "Emergency cancelled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling emergency {EmergencyId}", emergencyId);
                return StatusCode(500, "An error occurred while cancelling the emergency");
            }
        }

        /// <summary>
        /// Get user's emergency history
        /// </summary>
        [HttpGet("my-emergencies")]
        public async Task<ActionResult<IEnumerable<EmergencyResponseDto>>> GetMyEmergencies()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Invalid user identification");
                }

                var emergencies = await _emergencyService.GetUserEmergenciesAsync(userId);
                return Ok(emergencies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user emergencies");
                return StatusCode(500, "An error occurred while retrieving emergencies");
            }
        }

        /// <summary>
        /// Get all active emergencies (admin only)
        /// </summary>
        [HttpGet("active")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<EmergencyResponseDto>>> GetActiveEmergencies()
        {
            try
            {
                var emergencies = await _emergencyService.GetActiveEmergenciesAsync();
                return Ok(emergencies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active emergencies");
                return StatusCode(500, "An error occurred while retrieving active emergencies");
            }
        }

        /// <summary>
        /// Resend emergency notifications (admin only)
        /// </summary>
        [HttpPost("{emergencyId}/resend-notifications")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ResendNotifications(int emergencyId)
        {
            try
            {
                var result = await _emergencyService.SendEmergencyNotificationsAsync(emergencyId);
                if (!result)
                {
                    return NotFound("Emergency not found or notifications cannot be sent");
                }

                return Ok(new { message = "Emergency notifications resent successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending emergency notifications for {EmergencyId}", emergencyId);
                return StatusCode(500, "An error occurred while resending notifications");
            }
        }
    }

    public class SOSRequestDto
    {
        public string? Description { get; set; }
        public string? Location { get; set; }
    }
}
