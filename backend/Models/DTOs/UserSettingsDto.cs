using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models.DTOs
{
    public class UserSettingsDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Theme { get; set; } = "light";
        
        [Required]
        [StringLength(10)]
        public string Language { get; set; } = "en";
        
        [Required]
        [StringLength(50)]
        public string TimeZone { get; set; } = "Pacific/Auckland";
        
        [Required]
        [StringLength(10)]
        public string Currency { get; set; } = "NZD";
        
        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        
        public bool EmailMatches { get; set; }
        public bool EmailMessages { get; set; }
        public bool EmailReminders { get; set; }
        public bool EmailMarketing { get; set; }
        
        public bool ShowOnlineStatus { get; set; }
        public bool ShowLastSeen { get; set; }
        public bool AllowDirectMessages { get; set; }
        
        [Required]
        [StringLength(20)]
        public string DefaultSearchRadius { get; set; } = "50km";
        
        public bool AutoAcceptMatches { get; set; }
        public bool RequirePhoneVerification { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public Dictionary<string, object>? CustomPreferences { get; set; }
    }
    
    public class UpdateUserSettingsDto
    {
        [StringLength(20)]
        public string? Theme { get; set; }
        
        [StringLength(10)]
        public string? Language { get; set; }
        
        [StringLength(50)]
        public string? TimeZone { get; set; }
        
        [StringLength(10)]
        public string? Currency { get; set; }
        
        public bool? EmailNotifications { get; set; }
        public bool? PushNotifications { get; set; }
        public bool? SmsNotifications { get; set; }
        
        public bool? EmailMatches { get; set; }
        public bool? EmailMessages { get; set; }
        public bool? EmailReminders { get; set; }
        public bool? EmailMarketing { get; set; }
        
        public bool? ShowOnlineStatus { get; set; }
        public bool? ShowLastSeen { get; set; }
        public bool? AllowDirectMessages { get; set; }
        
        [StringLength(20)]
        public string? DefaultSearchRadius { get; set; }
        
        public bool? AutoAcceptMatches { get; set; }
        public bool? RequirePhoneVerification { get; set; }
        
        public Dictionary<string, object>? CustomPreferences { get; set; }
    }
    
    public class ThemePreferenceDto
    {
        [Required]
        [StringLength(20)]
        public string Theme { get; set; } = "light";
    }
    
    public class LanguagePreferenceDto
    {
        [Required]
        [StringLength(10)]
        public string Language { get; set; } = "en";
    }
    
    public class NotificationPreferencesDto
    {
        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool EmailMatches { get; set; }
        public bool EmailMessages { get; set; }
        public bool EmailReminders { get; set; }
        public bool EmailMarketing { get; set; }
    }
    
    public class PrivacyPreferencesDto
    {
        public bool ShowOnlineStatus { get; set; }
        public bool ShowLastSeen { get; set; }
        public bool AllowDirectMessages { get; set; }
        public bool RequirePhoneVerification { get; set; }
    }
}
