using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models.DTOs
{
    public class CreateEmergencyDto
    {
        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // "SOS", "Medical", "Safety", "Travel"

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Location { get; set; }

        // Optional - if emergency is related to an active service
        public int? FlightCompanionRequestId { get; set; }
        public int? PickupRequestId { get; set; }
    }

    public class EmergencyResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ResolvedAt { get; set; }
        public string? Resolution { get; set; }
        public bool EmergencyContactNotified { get; set; }
        public bool AdminNotified { get; set; }
    }

    public class ResolveEmergencyDto
    {
        [Required]
        [StringLength(500)]
        public string Resolution { get; set; } = string.Empty;
    }

    public class EmergencyNotificationDto
    {
        public int EmergencyId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string EmergencyContactName { get; set; } = string.Empty;
        public string EmergencyContactPhone { get; set; } = string.Empty;
        public string EmergencyType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
