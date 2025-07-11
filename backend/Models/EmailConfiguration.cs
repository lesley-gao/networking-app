// Models/EmailConfiguration.cs
namespace NetworkingApp.Models
{
    public class EmailConfiguration
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string SmtpUsername { get; set; } = string.Empty;
        public string SmtpPassword { get; set; } = string.Empty;
        public bool UseSsl { get; set; } = true;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
        public string ReplyToEmail { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
        
        // Templates configuration
        public EmailTemplateConfiguration Templates { get; set; } = new();
    }

    public class EmailTemplateConfiguration
    {
        public string BaseTemplateDirectory { get; set; } = "Templates/Email";
        public string LogoUrl { get; set; } = string.Empty;
        public string CompanyName { get; set; } = "Flight Companion Platform";
        public string SupportEmail { get; set; } = string.Empty;
        public string WebsiteUrl { get; set; } = string.Empty;
        public string UnsubscribeUrl { get; set; } = string.Empty;
    }
}
