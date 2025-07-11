using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    /// <summary>
    /// Represents a payment/service dispute between users, with admin intervention capability.
    /// </summary>
    public class Dispute
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PaymentId { get; set; }
        [ForeignKey("PaymentId")]
        public Payment Payment { get; set; } = null!;

        [Required]
        public int RaisedByUserId { get; set; }
        public User RaisedByUser { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string Reason { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? EvidenceUrl { get; set; } // Link to uploaded evidence (optional)

        [StringLength(20)]
        public string Status { get; set; } = "Open"; // Open, UnderReview, Resolved, Refunded, Rejected

        [StringLength(1000)]
        public string? AdminNotes { get; set; }

        public int? ResolvedByAdminId { get; set; }
        public User? ResolvedByAdmin { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
    }
}
