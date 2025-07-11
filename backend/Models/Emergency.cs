using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    public class Emergency
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // "SOS", "Medical", "Safety", "Travel"

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Location { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Active"; // "Active", "Resolved", "Cancelled"

        public DateTime? ResolvedAt { get; set; }

        [StringLength(500)]
        public string? Resolution { get; set; }

        // Related service information (optional)
        public int? FlightCompanionRequestId { get; set; }
        [ForeignKey("FlightCompanionRequestId")]
        public virtual FlightCompanionRequest? FlightCompanionRequest { get; set; }

        public int? PickupRequestId { get; set; }
        [ForeignKey("PickupRequestId")]
        public virtual PickupRequest? PickupRequest { get; set; }

        // Emergency response tracking
        public bool EmergencyContactNotified { get; set; } = false;
        public bool AdminNotified { get; set; } = false;
        public DateTime? LastNotificationSent { get; set; }
    }
}
