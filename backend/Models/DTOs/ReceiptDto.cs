// Models/DTOs/ReceiptDto.cs
namespace NetworkingApp.Models.DTOs
{
    public class ReceiptDto
    {
        public required string ReceiptId { get; set; }
        public required string PaymentIntentId { get; set; }
        public required string UserEmail { get; set; }
        public required decimal Amount { get; set; }
        public required string Currency { get; set; }
        public required DateTime PaidAt { get; set; }
        public required string ServiceType { get; set; }
        public string? PdfUrl { get; set; } // Optional: for downloadable PDF
    }
}