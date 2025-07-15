using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models.DTOs
{
    public class CreateFlightCompanionRequestDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string FlightNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string Airline { get; set; } = string.Empty;
        
        [Required]
        public DateTime FlightDate { get; set; }
        
        [Required]
        [StringLength(10, MinimumLength = 3)]
        public string DepartureAirport { get; set; } = string.Empty;
        
        [Required]
        [StringLength(10, MinimumLength = 3)]
        public string ArrivalAirport { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? TravelerName { get; set; }
        
        [StringLength(20)]
        public string? TravelerAge { get; set; }
        
        [StringLength(500)]
        public string? SpecialNeeds { get; set; }
        
        [Range(0, 500)]
        public decimal OfferedAmount { get; set; }
        
        [StringLength(1000)]
        public string? AdditionalNotes { get; set; }
    }
} 