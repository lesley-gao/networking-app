namespace NetworkingApp.Models
{
    /// <summary>
    /// JWT configuration settings.
    /// </summary>
    public class JwtSettings
    {
        public required string Issuer { get; set; }
        public required string Audience { get; set; }
        public required string SecretKey { get; set; }
        public int TokenLifetimeMinutes { get; set; }
    }
}
