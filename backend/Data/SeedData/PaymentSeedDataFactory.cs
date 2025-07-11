// Data/SeedData/PaymentSeedDataFactory.cs
using NetworkingApp.Models;

namespace NetworkingApp.Data.SeedData
{
    public static class PaymentSeedDataFactory
    {
        public static List<Payment> CreateSeedPayments()
        {
            return new List<Payment>
            {
                new Payment
                {
                    Id = 1,
                    PayerId = 3,
                    ReceiverId = 2,
                    RequestId = 2,
                    RequestType = "PickupRequest",
                    Amount = 35m,
                    Currency = "NZD",
                    Status = "Completed",
                    StripePaymentIntentId = "pi_1234567890abcdef",
                    PlatformFeeAmount = 3.50m,
                    CreatedAt = DateTime.UtcNow.AddDays(-11),
                    CompletedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Payment
                {
                    Id = 2,
                    PayerId = 5,
                    ReceiverId = 2,
                    RequestId = 3,
                    RequestType = "FlightCompanionRequest",
                    Amount = 80m,
                    Currency = "NZD",
                    Status = "EscrowHeld",
                    StripePaymentIntentId = "pi_abcdef1234567890",
                    EscrowReleaseDate = DateTime.UtcNow.AddDays(10),
                    PlatformFeeAmount = 8.00m,
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };
        }
    }
}