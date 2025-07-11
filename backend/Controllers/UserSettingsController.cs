using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;
using System.Text.Json;

namespace NetworkingApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserSettingsController> _logger;

        public UserSettingsController(ApplicationDbContext context, ILogger<UserSettingsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get user settings for the specified user
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<ActionResult<UserSettingsDto>> GetUserSettings(int userId)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    // Create default settings if none exist
                    userSettings = new UserSettings
                    {
                        UserId = userId,
                        Theme = "light",
                        Language = "en",
                        TimeZone = "Pacific/Auckland",
                        Currency = "NZD",
                        EmailNotifications = true,
                        PushNotifications = true,
                        SmsNotifications = false,
                        EmailMatches = true,
                        EmailMessages = true,
                        EmailReminders = true,
                        EmailMarketing = false,
                        ShowOnlineStatus = true,
                        ShowLastSeen = true,
                        AllowDirectMessages = true,
                        DefaultSearchRadius = "50km",
                        AutoAcceptMatches = false,
                        RequirePhoneVerification = true
                    };

                    _context.UserSettings.Add(userSettings);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Created default settings for user {UserId}", userId);
                }

                return Ok(MapToDto(userSettings));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user settings for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update user settings
        /// </summary>
        [HttpPut("{userId}")]
        public async Task<ActionResult<UserSettingsDto>> UpdateUserSettings(int userId, UpdateUserSettingsDto updateDto)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    return NotFound(new { message = "User settings not found" });
                }

                // Update only provided fields
                if (updateDto.Theme != null) userSettings.Theme = updateDto.Theme;
                if (updateDto.Language != null) userSettings.Language = updateDto.Language;
                if (updateDto.TimeZone != null) userSettings.TimeZone = updateDto.TimeZone;
                if (updateDto.Currency != null) userSettings.Currency = updateDto.Currency;
                
                if (updateDto.EmailNotifications.HasValue) userSettings.EmailNotifications = updateDto.EmailNotifications.Value;
                if (updateDto.PushNotifications.HasValue) userSettings.PushNotifications = updateDto.PushNotifications.Value;
                if (updateDto.SmsNotifications.HasValue) userSettings.SmsNotifications = updateDto.SmsNotifications.Value;
                
                if (updateDto.EmailMatches.HasValue) userSettings.EmailMatches = updateDto.EmailMatches.Value;
                if (updateDto.EmailMessages.HasValue) userSettings.EmailMessages = updateDto.EmailMessages.Value;
                if (updateDto.EmailReminders.HasValue) userSettings.EmailReminders = updateDto.EmailReminders.Value;
                if (updateDto.EmailMarketing.HasValue) userSettings.EmailMarketing = updateDto.EmailMarketing.Value;
                
                if (updateDto.ShowOnlineStatus.HasValue) userSettings.ShowOnlineStatus = updateDto.ShowOnlineStatus.Value;
                if (updateDto.ShowLastSeen.HasValue) userSettings.ShowLastSeen = updateDto.ShowLastSeen.Value;
                if (updateDto.AllowDirectMessages.HasValue) userSettings.AllowDirectMessages = updateDto.AllowDirectMessages.Value;
                
                if (updateDto.DefaultSearchRadius != null) userSettings.DefaultSearchRadius = updateDto.DefaultSearchRadius;
                if (updateDto.AutoAcceptMatches.HasValue) userSettings.AutoAcceptMatches = updateDto.AutoAcceptMatches.Value;
                if (updateDto.RequirePhoneVerification.HasValue) userSettings.RequirePhoneVerification = updateDto.RequirePhoneVerification.Value;

                if (updateDto.CustomPreferences != null)
                {
                    userSettings.CustomPreferences = JsonSerializer.Serialize(updateDto.CustomPreferences);
                }

                userSettings.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated settings for user {UserId}", userId);
                return Ok(MapToDto(userSettings));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user settings for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update theme preference only
        /// </summary>
        [HttpPut("{userId}/theme")]
        public async Task<ActionResult> UpdateThemePreference(int userId, ThemePreferenceDto themeDto)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    // Create default settings with the specified theme
                    userSettings = new UserSettings { UserId = userId, Theme = themeDto.Theme };
                    _context.UserSettings.Add(userSettings);
                }
                else
                {
                    userSettings.Theme = themeDto.Theme;
                    userSettings.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated theme preference to {Theme} for user {UserId}", themeDto.Theme, userId);
                return Ok(new { theme = userSettings.Theme });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating theme preference for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update language preference only
        /// </summary>
        [HttpPut("{userId}/language")]
        public async Task<ActionResult> UpdateLanguagePreference(int userId, LanguagePreferenceDto languageDto)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    // Create default settings with the specified language
                    userSettings = new UserSettings { UserId = userId, Language = languageDto.Language };
                    _context.UserSettings.Add(userSettings);
                }
                else
                {
                    userSettings.Language = languageDto.Language;
                    userSettings.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated language preference to {Language} for user {UserId}", languageDto.Language, userId);
                return Ok(new { language = userSettings.Language });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating language preference for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update notification preferences
        /// </summary>
        [HttpPut("{userId}/notifications")]
        public async Task<ActionResult> UpdateNotificationPreferences(int userId, NotificationPreferencesDto notificationDto)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    return NotFound(new { message = "User settings not found" });
                }

                userSettings.EmailNotifications = notificationDto.EmailNotifications;
                userSettings.PushNotifications = notificationDto.PushNotifications;
                userSettings.SmsNotifications = notificationDto.SmsNotifications;
                userSettings.EmailMatches = notificationDto.EmailMatches;
                userSettings.EmailMessages = notificationDto.EmailMessages;
                userSettings.EmailReminders = notificationDto.EmailReminders;
                userSettings.EmailMarketing = notificationDto.EmailMarketing;
                userSettings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated notification preferences for user {UserId}", userId);
                return Ok(new { message = "Notification preferences updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification preferences for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update privacy preferences
        /// </summary>
        [HttpPut("{userId}/privacy")]
        public async Task<ActionResult> UpdatePrivacyPreferences(int userId, PrivacyPreferencesDto privacyDto)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    return NotFound(new { message = "User settings not found" });
                }

                userSettings.ShowOnlineStatus = privacyDto.ShowOnlineStatus;
                userSettings.ShowLastSeen = privacyDto.ShowLastSeen;
                userSettings.AllowDirectMessages = privacyDto.AllowDirectMessages;
                userSettings.RequirePhoneVerification = privacyDto.RequirePhoneVerification;
                userSettings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated privacy preferences for user {UserId}", userId);
                return Ok(new { message = "Privacy preferences updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating privacy preferences for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Reset user settings to defaults
        /// </summary>
        [HttpPost("{userId}/reset")]
        public async Task<ActionResult<UserSettingsDto>> ResetUserSettings(int userId)
        {
            try
            {
                var userSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == userId);

                if (userSettings == null)
                {
                    return NotFound(new { message = "User settings not found" });
                }

                // Reset to defaults
                userSettings.Theme = "light";
                userSettings.Language = "en";
                userSettings.TimeZone = "Pacific/Auckland";
                userSettings.Currency = "NZD";
                userSettings.EmailNotifications = true;
                userSettings.PushNotifications = true;
                userSettings.SmsNotifications = false;
                userSettings.EmailMatches = true;
                userSettings.EmailMessages = true;
                userSettings.EmailReminders = true;
                userSettings.EmailMarketing = false;
                userSettings.ShowOnlineStatus = true;
                userSettings.ShowLastSeen = true;
                userSettings.AllowDirectMessages = true;
                userSettings.DefaultSearchRadius = "50km";
                userSettings.AutoAcceptMatches = false;
                userSettings.RequirePhoneVerification = true;
                userSettings.CustomPreferences = null;
                userSettings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Reset settings to defaults for user {UserId}", userId);
                return Ok(MapToDto(userSettings));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting user settings for user {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private UserSettingsDto MapToDto(UserSettings userSettings)
        {
            var dto = new UserSettingsDto
            {
                Id = userSettings.Id,
                UserId = userSettings.UserId,
                Theme = userSettings.Theme,
                Language = userSettings.Language,
                TimeZone = userSettings.TimeZone,
                Currency = userSettings.Currency,
                EmailNotifications = userSettings.EmailNotifications,
                PushNotifications = userSettings.PushNotifications,
                SmsNotifications = userSettings.SmsNotifications,
                EmailMatches = userSettings.EmailMatches,
                EmailMessages = userSettings.EmailMessages,
                EmailReminders = userSettings.EmailReminders,
                EmailMarketing = userSettings.EmailMarketing,
                ShowOnlineStatus = userSettings.ShowOnlineStatus,
                ShowLastSeen = userSettings.ShowLastSeen,
                AllowDirectMessages = userSettings.AllowDirectMessages,
                DefaultSearchRadius = userSettings.DefaultSearchRadius,
                AutoAcceptMatches = userSettings.AutoAcceptMatches,
                RequirePhoneVerification = userSettings.RequirePhoneVerification,
                CreatedAt = userSettings.CreatedAt,
                UpdatedAt = userSettings.UpdatedAt
            };

            if (!string.IsNullOrEmpty(userSettings.CustomPreferences))
            {
                try
                {
                    dto.CustomPreferences = JsonSerializer.Deserialize<Dictionary<string, object>>(userSettings.CustomPreferences);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize custom preferences for user {UserId}", userSettings.UserId);
                }
            }

            return dto;
        }
    }
}
