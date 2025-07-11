using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    public class UserSettings
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        
        [StringLength(20)]
        public string Theme { get; set; } = "light"; // "light", "dark", "system"
        
        [StringLength(10)]
        public string Language { get; set; } = "en"; // "en", "zh"
        
        [StringLength(50)]
        public string TimeZone { get; set; } = "Pacific/Auckland";
        
        [StringLength(10)]
        public string Currency { get; set; } = "NZD";
        
        public bool EmailNotifications { get; set; } = true;
        public bool PushNotifications { get; set; } = true;
        public bool SmsNotifications { get; set; } = false;
        
        public bool EmailMatches { get; set; } = true;
        public bool EmailMessages { get; set; } = true;
        public bool EmailReminders { get; set; } = true;
        public bool EmailMarketing { get; set; } = false;
        
        public bool ShowOnlineStatus { get; set; } = true;
        public bool ShowLastSeen { get; set; } = true;
        public bool AllowDirectMessages { get; set; } = true;
        
        [StringLength(20)]
        public string DefaultSearchRadius { get; set; } = "50km";
        
        public bool AutoAcceptMatches { get; set; } = false;
        public bool RequirePhoneVerification { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [StringLength(1000)]
        public string? CustomPreferences { get; set; } // JSON for extensible custom settings
    }
}
