// Models/DTOs/ConfirmPaymentRequest.cs
namespace NetworkingApp.Models.DTOs
{
    public class ConfirmPaymentRequest
    {
        public required string PaymentIntentId { get; set; }
        public required string UserId { get; set; }
    }
}