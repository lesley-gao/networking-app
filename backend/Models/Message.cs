// Models/Message.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Models
{
    public class Message
    {
        public int Id { get; set; }
        
        public int SenderId { get; set; }
        public virtual User Sender { get; set; } = null!;
        
        public int ReceiverId { get; set; }
        public virtual User Receiver { get; set; } = null!;
        
        public int? RequestId { get; set; }
        
        [Required]
        [StringLength(20)]
        public string RequestType { get; set; } = string.Empty; // "FlightCompanion", "Pickup", "General"
        
        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string Type { get; set; } = "Text"; // "Text", "System", "Match", "Offer"
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ReadAt { get; set; }
        
        // Thread/conversation grouping
        [StringLength(50)]
        public string? ThreadId { get; set; }
        
        // Reference to parent message for replies
        public int? ParentMessageId { get; set; }
        public virtual Message? ParentMessage { get; set; }
        
        public virtual ICollection<Message> Replies { get; set; } = new List<Message>();
        
        // Metadata for system messages
        [StringLength(500)]
        public string? Metadata { get; set; } // JSON string for additional data
    }
}