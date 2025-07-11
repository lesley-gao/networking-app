using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    public class FlightCompanionRequest
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        
        [Required]
        [StringLength(100)]
        public string FlightNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Airline { get; set; } = string.Empty;
        
        [Required]
        public DateTime FlightDate { get; set; }
        
        [Required]
        [StringLength(10)]
        public string DepartureAirport { get; set; } = string.Empty; // AKL, PVG, etc.
        
        [Required]
        [StringLength(10)]
        public string ArrivalAirport { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? TravelerName { get; set; } // Name of person needing help (e.g., "My parents")
        
        [StringLength(20)]
        public string? TravelerAge { get; set; } // "Elderly", "Adult", etc.
        
        [StringLength(500)]
        public string? SpecialNeeds { get; set; } // Wheelchair, medical, language help, etc.
        
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 500)]
        public decimal OfferedAmount { get; set; }
        
        [StringLength(1000)]
        public string? AdditionalNotes { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public bool IsMatched { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties for matching
        public int? MatchedOfferId { get; set; }
        public virtual FlightCompanionOffer? MatchedOffer { get; set; }
    }
}
