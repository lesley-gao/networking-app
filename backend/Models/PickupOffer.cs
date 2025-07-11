using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace NetworkingApp.Models
{
    public class PickupOffer
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        
        [Required]
        [StringLength(10)]
        public string Airport { get; set; } = string.Empty; // AKL
        
        [StringLength(100)]
        public string? VehicleType { get; set; } // "Sedan", "SUV", "Van"
        
        public int MaxPassengers { get; set; } = 4;
        
        public bool CanHandleLuggage { get; set; } = true;
        
        [StringLength(200)]
        public string? ServiceArea { get; set; } // "Auckland City", "North Shore", "All Auckland"
        
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 200)]
        public decimal BaseRate { get; set; }
        
        [StringLength(100)]
        public string? Languages { get; set; } // "Chinese, English"
        
        [StringLength(500)]
        public string? AdditionalServices { get; set; } // "Can help with shopping", "Know Chinese areas"
        
        public bool IsAvailable { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Experience tracking
        public int TotalPickups { get; set; } = 0;
        
        [Column(TypeName = "decimal(3,2)")]
        public decimal AverageRating { get; set; } = 0;
        
        // Navigation properties
        public virtual ICollection<PickupRequest> MatchedRequests { get; set; } = new List<PickupRequest>();
    }
}
