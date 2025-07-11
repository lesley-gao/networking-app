using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace NetworkingApp.Models
{
    public class FlightCompanionOffer
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
        public string DepartureAirport { get; set; } = string.Empty;
        
        [Required]
        [StringLength(10)]
        public string ArrivalAirport { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string? AvailableServices { get; set; } // "Translation, Navigation, General Help"
        
        [StringLength(50)]
        public string? Languages { get; set; } // "Chinese, English"
        
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 500)]
        public decimal RequestedAmount { get; set; }
        
        public bool IsAvailable { get; set; } = true;
        
        [StringLength(1000)]
        public string? AdditionalInfo { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Experience tracking
        public int HelpedCount { get; set; } = 0;
        
        // Navigation properties
        public virtual ICollection<FlightCompanionRequest> MatchedRequests { get; set; } = new List<FlightCompanionRequest>();
    }
}
