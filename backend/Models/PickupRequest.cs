using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    public class PickupRequest
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        
        [Required]
        [StringLength(100)]
        public string FlightNumber { get; set; } = string.Empty;
        
        [Required]
        public DateTime ArrivalDate { get; set; }
        
        [Required]
        public TimeSpan ArrivalTime { get; set; }
        
        [Required]
        [StringLength(10)]
        public string Airport { get; set; } = string.Empty; // AKL
        
        [Required]
        [StringLength(200)]
        public string DestinationAddress { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? PassengerName { get; set; }
        
        [StringLength(20)]
        public string? PassengerPhone { get; set; }
        
        public int PassengerCount { get; set; } = 1;
        
        public bool HasLuggage { get; set; } = true;
        
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 200)]
        public decimal OfferedAmount { get; set; }
        
        [StringLength(500)]
        public string? SpecialRequests { get; set; } // "Elderly passengers", "Large luggage", etc.
        
        public bool IsActive { get; set; } = true;
        
        public bool IsMatched { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties for matching
        public int? MatchedOfferId { get; set; }
        public virtual PickupOffer? MatchedOffer { get; set; }
    }
}
