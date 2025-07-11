using NetworkingApp.Models;
using System.Text.Json;

namespace NetworkingApp.Data.SeedData
{
    public static class UserSettingsSeedDataFactory
    {
        public static List<UserSettings> CreateUserSettings()
        {
            var userSettings = new List<UserSettings>
            {
                // Default settings for user 1 (John Doe)
                new UserSettings
                {
                    Id = 1,
                    UserId = 1,
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
                    RequirePhoneVerification = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                    {
                        { "compactView", false },
                        { "autoRefreshInterval", 60 },
                        { "notificationSound", "default" }
                    })
                },

                // Custom settings for user 2 (Jane Smith) - Dark theme, Chinese language
                new UserSettings
                {
                    Id = 2,
                    UserId = 2,
                    Theme = "dark",
                    Language = "zh",
                    TimeZone = "Pacific/Auckland",
                    Currency = "NZD",
                    EmailNotifications = true,
                    PushNotifications = false,
                    SmsNotifications = true,
                    EmailMatches = true,
                    EmailMessages = false,
                    EmailReminders = true,
                    EmailMarketing = false,
                    ShowOnlineStatus = false,
                    ShowLastSeen = false,
                    AllowDirectMessages = true,
                    DefaultSearchRadius = "25km",
                    AutoAcceptMatches = false,
                    RequirePhoneVerification = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    UpdatedAt = DateTime.UtcNow.AddHours(-6),
                    CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                    {
                        { "darkModeStartTime", "18:00" },
                        { "darkModeEndTime", "06:00" },
                        { "preferredMapView", "satellite" },
                        { "compactView", true }
                    })
                },

                // Minimal privacy settings for user 3 (Mike Wang)
                new UserSettings
                {
                    Id = 3,
                    UserId = 3,
                    Theme = "system",
                    Language = "en",
                    TimeZone = "Pacific/Auckland",
                    Currency = "NZD",
                    EmailNotifications = false,
                    PushNotifications = true,
                    SmsNotifications = false,
                    EmailMatches = true,
                    EmailMessages = false,
                    EmailReminders = false,
                    EmailMarketing = false,
                    ShowOnlineStatus = false,
                    ShowLastSeen = false,
                    AllowDirectMessages = false,
                    DefaultSearchRadius = "100km",
                    AutoAcceptMatches = false,
                    RequirePhoneVerification = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5),
                    CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                    {
                        { "privacyMode", "strict" },
                        { "autoRefreshInterval", 300 },
                        { "showProfileImage", false }
                    })
                },

                // Notification-heavy settings for user 4 (Lisa Chen)
                new UserSettings
                {
                    Id = 4,
                    UserId = 4,
                    Theme = "light",
                    Language = "zh",
                    TimeZone = "Pacific/Auckland",
                    Currency = "NZD",
                    EmailNotifications = true,
                    PushNotifications = true,
                    SmsNotifications = true,
                    EmailMatches = true,
                    EmailMessages = true,
                    EmailReminders = true,
                    EmailMarketing = true,
                    ShowOnlineStatus = true,
                    ShowLastSeen = true,
                    AllowDirectMessages = true,
                    DefaultSearchRadius = "75km",
                    AutoAcceptMatches = false,
                    RequirePhoneVerification = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddHours(-12),
                    CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                    {
                        { "emailDigestFrequency", "daily" },
                        { "pushNotificationTimes", new[] { "09:00", "13:00", "18:00" } },
                        { "languagePreference", "bilingual" }
                    })
                },

                // Auto-accept enabled for user 5 (David Kim)
                new UserSettings
                {
                    Id = 5,
                    UserId = 5,
                    Theme = "dark",
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
                    AutoAcceptMatches = true, // Only user with auto-accept enabled
                    RequirePhoneVerification = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddHours(-3),
                    CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                    {
                        { "autoAcceptConditions", new Dictionary<string, object>
                            {
                                { "minRating", 4.0 },
                                { "maxDistance", "30km" },
                                { "verifiedUsersOnly", true }
                            }
                        },
                        { "quickMatchEnabled", true }
                    })
                }
            };

            return userSettings;
        }

        /// <summary>
        /// Creates default user settings for a new user
        /// </summary>
        /// <param name="userId">The user ID to create settings for</param>
        /// <returns>Default UserSettings object</returns>
        public static UserSettings CreateDefaultUserSettings(int userId)
        {
            return new UserSettings
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
                RequirePhoneVerification = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CustomPreferences = null
            };
        }

        /// <summary>
        /// Creates settings optimized for Chinese language users
        /// </summary>
        /// <param name="userId">The user ID to create settings for</param>
        /// <returns>Chinese-optimized UserSettings object</returns>
        public static UserSettings CreateChineseUserSettings(int userId)
        {
            return new UserSettings
            {
                UserId = userId,
                Theme = "light",
                Language = "zh",
                TimeZone = "Pacific/Auckland",
                Currency = "NZD",
                EmailNotifications = true,
                PushNotifications = true,
                SmsNotifications = true, // SMS more popular in China
                EmailMatches = true,
                EmailMessages = true,
                EmailReminders = true,
                EmailMarketing = false,
                ShowOnlineStatus = true,
                ShowLastSeen = true,
                AllowDirectMessages = true,
                DefaultSearchRadius = "50km",
                AutoAcceptMatches = false,
                RequirePhoneVerification = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                {
                    { "preferredContactMethod", "wechat" },
                    { "showChineseCalendar", true },
                    { "timeFormat", "24h" },
                    { "currency", "CNY_NZD" } // Show both currencies
                })
            };
        }

        /// <summary>
        /// Creates privacy-focused settings for security-conscious users
        /// </summary>
        /// <param name="userId">The user ID to create settings for</param>
        /// <returns>Privacy-focused UserSettings object</returns>
        public static UserSettings CreatePrivacyFocusedSettings(int userId)
        {
            return new UserSettings
            {
                UserId = userId,
                Theme = "dark", // Dark theme for privacy preference
                Language = "en",
                TimeZone = "Pacific/Auckland",
                Currency = "NZD",
                EmailNotifications = false, // Minimal notifications
                PushNotifications = false,
                SmsNotifications = false,
                EmailMatches = true, // Only essential match notifications
                EmailMessages = false,
                EmailReminders = false,
                EmailMarketing = false,
                ShowOnlineStatus = false, // Hide online status
                ShowLastSeen = false, // Hide last seen
                AllowDirectMessages = false, // No direct messages
                DefaultSearchRadius = "25km", // Smaller search radius
                AutoAcceptMatches = false,
                RequirePhoneVerification = true, // Require verification for security
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                {
                    { "privacyMode", "strict" },
                    { "dataRetentionDays", 30 },
                    { "showProfileImage", false },
                    { "allowLocationSharing", false }
                })
            };
        }
    }
}
