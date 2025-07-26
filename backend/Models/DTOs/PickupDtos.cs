using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models.DTOs
{
    public class CreatePickupOfferDto
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [StringLength(10)]
        public string Airport { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? VehicleType { get; set; }
        
        public int MaxPassengers { get; set; } = 4;
        
        public bool CanHandleLuggage { get; set; } = true;
        
        [StringLength(200)]
        public string? ServiceArea { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, 200)]
        public decimal BaseRate { get; set; }
        
        [StringLength(100)]
        public string? Languages { get; set; }
        
        [StringLength(500)]
        public string? AdditionalServices { get; set; }
    }
} 