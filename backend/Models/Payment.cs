using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    /// <summary>
    /// Represents a payment transaction in the platform.
    /// </summary>
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        
        public int PayerId { get; set; }
        public virtual User Payer { get; set; } = null!;
        
        public int ReceiverId { get; set; }
        public virtual User Receiver { get; set; } = null!;
        
        public int RequestId { get; set; }
        
        [Required]
        [StringLength(20)]
        public string RequestType { get; set; } = string.Empty; // "FlightCompanion" or "Pickup"
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        [StringLength(3)]
        public string Currency { get; set; } = "NZD";
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // "Pending", "Held", "Released", "Disputed", "Refunded"
        
        [StringLength(100)]
        public string? StripePaymentIntentId { get; set; }
        
        public DateTime? EscrowReleaseDate { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal PlatformFeeAmount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedAt { get; set; }
        
        public int? EscrowId { get; set; }
        [ForeignKey("EscrowId")]
        public Escrow? Escrow { get; set; }
    }

    public enum PaymentStatus
    {
        Pending,
        HeldInEscrow,
        Released,
        Refunded,
        Failed
    }
}
