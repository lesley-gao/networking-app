using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace NetworkingApp.Models
{
    public class User : IdentityUser<int>
    {
        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;
        
        [StringLength(10)]
        public string PreferredLanguage { get; set; } = "English"; // "English", "Chinese"
        
        public bool IsVerified { get; set; } = false;
        
        [StringLength(500)]
        public string? VerificationDocuments { get; set; }
        
        [StringLength(200)]
        public string? ProfilePictureUrl { get; set; }
        
        [StringLength(100)]
        public string? EmergencyContact { get; set; }
        
        [StringLength(20)]
        public string? EmergencyPhone { get; set; }
        
        public decimal Rating { get; set; } = 0.0m;
        
        public int TotalRatings { get; set; } = 0;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastLoginAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<FlightCompanionRequest> FlightCompanionRequests { get; set; } = new List<FlightCompanionRequest>();
        public virtual ICollection<FlightCompanionOffer> FlightCompanionOffers { get; set; } = new List<FlightCompanionOffer>();
        public virtual ICollection<PickupRequest> PickupRequests { get; set; } = new List<PickupRequest>();
        public virtual ICollection<PickupOffer> PickupOffers { get; set; } = new List<PickupOffer>();
        public virtual ICollection<Payment> PaymentsAsPayer { get; set; } = new List<Payment>();
        public virtual ICollection<Payment> PaymentsAsReceiver { get; set; } = new List<Payment>();
        public virtual ICollection<Rating> RatingsGiven { get; set; } = new List<Rating>();
        public virtual ICollection<Rating> RatingsReceived { get; set; } = new List<Rating>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public virtual ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
    }
}
