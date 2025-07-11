using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NetworkingApp.Models
{
    /// <summary>
    /// Stores metadata for user verification documents.
    /// </summary>
    public class VerificationDocument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(200)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string BlobUri { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ContentType { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public bool IsApproved { get; set; } = false;
        public bool IsRejected { get; set; } = false;
        public string? AdminComment { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
