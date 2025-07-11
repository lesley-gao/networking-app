using System;
using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models
{
    public class Notification
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string Message { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string Type { get; set; } = "Info"; // "Info", "Warning", "Success", "Error", "Match", "Payment"
        
        public bool IsRead { get; set; } = false;
        
        [StringLength(200)]
        public string? ActionUrl { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiresAt { get; set; }
    }
}
