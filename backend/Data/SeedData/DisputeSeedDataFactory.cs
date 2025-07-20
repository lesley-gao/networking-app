// Data/SeedData/DisputeSeedDataFactory.cs
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class DisputeSeedDataFactory
    {
        public static List<Dispute> CreateSeedDisputes()
        {
            return new List<Dispute>
            {
                new Dispute
                {
                    Id = 1,
                    PaymentId = 1,
                    RaisedByUserId = 3,
                    Reason = "Service not provided as agreed. Driver was late and unprofessional.",
                    EvidenceUrl = "https://example.com/evidence/photos.jpg",
                    Status = "Open",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new Dispute
                {
                    Id = 2,
                    PaymentId = 2,
                    RaisedByUserId = 5,
                    Reason = "Payment charged twice for same service. Need refund for duplicate charge.",
                    Status = "UnderReview",
                    AdminNotes = "Reviewing evidence provided by both parties. Checking payment records.",
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new Dispute
                {
                    Id = 3,
                    PaymentId = 1,
                    RaisedByUserId = 2,
                    Reason = "Service quality was poor. Driver did not follow agreed route.",
                    Status = "Resolved",
                    AdminNotes = "Dispute resolved in favor of user. Partial refund issued.",
                    ResolvedByAdminId = 1,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    ResolvedAt = DateTime.UtcNow.AddDays(-8)
                }
            };
        }
    }
} 