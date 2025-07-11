using System;
using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models
{
    public class Rating
    {
        public int Id { get; set; }
        
        public int RaterId { get; set; }
        public virtual User Rater { get; set; } = null!;
        
        public int RatedUserId { get; set; }
        public virtual User RatedUser { get; set; } = null!;
        
        public int RequestId { get; set; }
        
        [Required]
        [StringLength(20)]
        public string RequestType { get; set; } = string.Empty; // "FlightCompanion" or "Pickup"
        
        [Range(1, 5)]
        public int Score { get; set; }
        
        [StringLength(500)]
        public string? Comment { get; set; }
        
        public bool IsPublic { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
