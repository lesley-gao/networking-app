using System;
using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models
{
    /// <summary>
    /// Represents an escrow holding for a payment until service completion.
    /// </summary>
    public class Escrow
    {
        [Key]
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "nzd";
        public string StripePaymentIntentId { get; set; } = string.Empty;
        public EscrowStatus Status { get; set; } = EscrowStatus.Held;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReleasedAt { get; set; }
        public int? PaymentId { get; set; }
        public Payment? Payment { get; set; }
    }

    public enum EscrowStatus
    {
        Held,
        Released,
        Refunded
    }
}
