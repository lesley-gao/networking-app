namespace NetworkingApp.Models
{
    public class StripeSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string PublishableKey { get; set; } = string.Empty;
        public string WebhookSecret { get; set; } = string.Empty;
    }
}
