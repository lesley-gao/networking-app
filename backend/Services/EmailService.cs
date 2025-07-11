// Services/EmailService.cs
using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;
using System.Threading.Tasks;

namespace NetworkingApp.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailConfiguration _emailConfig;
        private readonly ILogger<EmailService> _logger;
        private readonly IWebHostEnvironment _environment;

        public EmailService(IOptions<EmailConfiguration> emailConfig, 
            ILogger<EmailService> logger, 
            IWebHostEnvironment environment)
        {
            _emailConfig = emailConfig.Value;
            _logger = logger;
            _environment = environment;
        }

        public async Task SendMatchConfirmationEmailAsync(string requesterEmail, string requesterName, 
            string helperEmail, string helperName, string serviceType, string serviceDetails)
        {
            try
            {
                // Send email to requester
                var requesterSubject = $"Great News! Your {serviceType} Request Has Been Matched";
                var requesterBody = await BuildMatchConfirmationEmailBody(requesterName, helperName, 
                    serviceType, serviceDetails, isRequester: true);
                
                await SendEmailAsync(requesterEmail, requesterSubject, requesterBody);

                // Send email to helper
                var helperSubject = $"New {serviceType} Service Assignment";
                var helperBody = await BuildMatchConfirmationEmailBody(helperName, requesterName, 
                    serviceType, serviceDetails, isRequester: false);
                
                await SendEmailAsync(helperEmail, helperSubject, helperBody);

                _logger.LogInformation("Match confirmation emails sent for {ServiceType} between {RequesterEmail} and {HelperEmail}", 
                    serviceType, requesterEmail, helperEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send match confirmation emails for {ServiceType}", serviceType);
                throw;
            }
        }

        public async Task SendBookingConfirmationEmailAsync(string userEmail, string userName, 
            string serviceType, string bookingDetails, string bookingReference)
        {
            try
            {
                var subject = $"Booking Confirmed - {serviceType} Service";
                var body = await BuildBookingConfirmationEmailBody(userName, serviceType, 
                    bookingDetails, bookingReference);
                
                await SendEmailAsync(userEmail, subject, body);

                _logger.LogInformation("Booking confirmation email sent to {UserEmail} for booking {BookingReference}", 
                    userEmail, bookingReference);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send booking confirmation email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendPaymentConfirmationEmailAsync(string userEmail, string userName, 
            decimal amount, string transactionId, string serviceDetails)
        {
            try
            {
                var subject = "Payment Confirmation - Flight Companion Platform";
                var body = await BuildPaymentConfirmationEmailBody(userName, amount, transactionId, serviceDetails);
                
                await SendEmailAsync(userEmail, subject, body);

                _logger.LogInformation("Payment confirmation email sent to {UserEmail} for transaction {TransactionId}", 
                    userEmail, transactionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send payment confirmation email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendAccountVerificationEmailAsync(string userEmail, string userName, string verificationLink)
        {
            try
            {
                var subject = "Verify Your Flight Companion Platform Account";
                var body = await BuildAccountVerificationEmailBody(userName, verificationLink);
                
                await SendEmailAsync(userEmail, subject, body);

                _logger.LogInformation("Account verification email sent to {UserEmail}", userEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send account verification email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendSecurityAlertEmailAsync(string userEmail, string userName, 
            string alertType, string alertDetails)
        {
            try
            {
                var subject = $"Security Alert - {alertType}";
                var body = await BuildSecurityAlertEmailBody(userName, alertType, alertDetails);
                
                await SendEmailAsync(userEmail, subject, body, isHighPriority: true);

                _logger.LogInformation("Security alert email sent to {UserEmail} for {AlertType}", userEmail, alertType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send security alert email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendPasswordResetEmailAsync(string userEmail, string userName, string resetLink)
        {
            try
            {
                var subject = "Password Reset Request - Flight Companion Platform";
                var body = await BuildPasswordResetEmailBody(userName, resetLink);
                
                await SendEmailAsync(userEmail, subject, body);

                _logger.LogInformation("Password reset email sent to {UserEmail}", userEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendServiceReminderEmailAsync(string userEmail, string userName, 
            string serviceType, string reminderDetails, DateTime serviceDate)
        {
            try
            {
                var subject = $"Reminder: Upcoming {serviceType} Service";
                var body = await BuildServiceReminderEmailBody(userName, serviceType, reminderDetails, serviceDate);
                
                await SendEmailAsync(userEmail, subject, body);

                _logger.LogInformation("Service reminder email sent to {UserEmail} for {ServiceType}", userEmail, serviceType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service reminder email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendServiceCompletionEmailAsync(string userEmail, string userName, 
            string serviceType, string partnerName, string ratingLink)
        {
            try
            {
                var subject = $"Service Complete - Please Rate Your {serviceType} Experience";
                var body = await BuildServiceCompletionEmailBody(userName, serviceType, partnerName, ratingLink);
                
                await SendEmailAsync(userEmail, subject, body);

                _logger.LogInformation("Service completion email sent to {UserEmail} for {ServiceType}", userEmail, serviceType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send service completion email to {UserEmail}", userEmail);
                throw;
            }
        }

        public async Task SendReceiptEmailAsync(string toEmail, ReceiptDto receipt)
        {
            var subject = "Your Payment Receipt";
            var body = $@"
                <h2>Payment Receipt</h2>
                <p>Receipt ID: {receipt.ReceiptId}</p>
                <p>Amount: {receipt.Amount} {receipt.Currency}</p>
                <p>Paid At: {receipt.PaidAt.ToLocalTime()}</p>
                <p>Service: {receipt.ServiceType}</p>
            ";
            // Use your existing email sending logic
            await SendEmailAsync(toEmail, subject, body, false);
        }

        public async Task SendEmailAsync(string toEmail, string htmlContent, string subject)
        {
            await SendEmailAsync(toEmail, subject, htmlContent, false);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string body, bool isHighPriority = false)
        {
            if (!_emailConfig.IsEnabled)
            {
                _logger.LogInformation("Email service is disabled. Would have sent email to {ToEmail} with subject: {Subject}", 
                    toEmail, subject);
                return;
            }

            if (string.IsNullOrEmpty(_emailConfig.SmtpServer))
            {
                _logger.LogWarning("SMTP server not configured. Cannot send email to {ToEmail}", toEmail);
                return;
            }

            using var client = new SmtpClient(_emailConfig.SmtpServer, _emailConfig.SmtpPort);
            client.EnableSsl = _emailConfig.UseSsl;
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(_emailConfig.SmtpUsername, _emailConfig.SmtpPassword);

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailConfig.FromEmail, _emailConfig.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
                Priority = isHighPriority ? MailPriority.High : MailPriority.Normal
            };

            mailMessage.To.Add(toEmail);

            if (!string.IsNullOrEmpty(_emailConfig.ReplyToEmail))
            {
                mailMessage.ReplyToList.Add(_emailConfig.ReplyToEmail);
            }

            await client.SendMailAsync(mailMessage);
        }

        private async Task<string> BuildMatchConfirmationEmailBody(string recipientName, string partnerName, 
            string serviceType, string serviceDetails, bool isRequester)
        {
            var template = await GetEmailTemplate("match-confirmation");
            
            return template
                .Replace("{{RecipientName}}", recipientName)
                .Replace("{{PartnerName}}", partnerName)
                .Replace("{{ServiceType}}", serviceType)
                .Replace("{{ServiceDetails}}", serviceDetails)
                .Replace("{{Role}}", isRequester ? "requester" : "helper")
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildBookingConfirmationEmailBody(string userName, string serviceType, 
            string bookingDetails, string bookingReference)
        {
            var template = await GetEmailTemplate("booking-confirmation");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{ServiceType}}", serviceType)
                .Replace("{{BookingDetails}}", bookingDetails)
                .Replace("{{BookingReference}}", bookingReference)
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildPaymentConfirmationEmailBody(string userName, decimal amount, 
            string transactionId, string serviceDetails)
        {
            var template = await GetEmailTemplate("payment-confirmation");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{Amount}}", amount.ToString("C", new System.Globalization.CultureInfo("en-NZ")))
                .Replace("{{TransactionId}}", transactionId)
                .Replace("{{ServiceDetails}}", serviceDetails)
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildAccountVerificationEmailBody(string userName, string verificationLink)
        {
            var template = await GetEmailTemplate("account-verification");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{VerificationLink}}", verificationLink)
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildSecurityAlertEmailBody(string userName, string alertType, string alertDetails)
        {
            var template = await GetEmailTemplate("security-alert");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{AlertType}}", alertType)
                .Replace("{{AlertDetails}}", alertDetails)
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildPasswordResetEmailBody(string userName, string resetLink)
        {
            var template = await GetEmailTemplate("password-reset");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{ResetLink}}", resetLink)
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildServiceReminderEmailBody(string userName, string serviceType, 
            string reminderDetails, DateTime serviceDate)
        {
            var template = await GetEmailTemplate("service-reminder");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{ServiceType}}", serviceType)
                .Replace("{{ReminderDetails}}", reminderDetails)
                .Replace("{{ServiceDate}}", serviceDate.ToString("dddd, MMMM dd, yyyy 'at' HH:mm"))
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> BuildServiceCompletionEmailBody(string userName, string serviceType, 
            string partnerName, string ratingLink)
        {
            var template = await GetEmailTemplate("service-completion");
            
            return template
                .Replace("{{UserName}}", userName)
                .Replace("{{ServiceType}}", serviceType)
                .Replace("{{PartnerName}}", partnerName)
                .Replace("{{RatingLink}}", ratingLink)
                .Replace("{{Year}}", DateTime.UtcNow.Year.ToString());
        }

        private async Task<string> GetEmailTemplate(string templateName)
        {
            try
            {
                var templatePath = Path.Combine(_environment.ContentRootPath, 
                    _emailConfig.Templates.BaseTemplateDirectory, $"{templateName}.html");
                
                if (File.Exists(templatePath))
                {
                    var template = await File.ReadAllTextAsync(templatePath);
                    return ApplyBaseTemplateVariables(template);
                }
                else
                {
                    _logger.LogWarning("Email template not found: {TemplatePath}", templatePath);
                    return GetFallbackTemplate(templateName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading email template: {TemplateName}", templateName);
                return GetFallbackTemplate(templateName);
            }
        }

        private string ApplyBaseTemplateVariables(string template)
        {
            return template
                .Replace("{{CompanyName}}", _emailConfig.Templates.CompanyName)
                .Replace("{{LogoUrl}}", _emailConfig.Templates.LogoUrl)
                .Replace("{{SupportEmail}}", _emailConfig.Templates.SupportEmail)
                .Replace("{{WebsiteUrl}}", _emailConfig.Templates.WebsiteUrl)
                .Replace("{{UnsubscribeUrl}}", _emailConfig.Templates.UnsubscribeUrl);
        }

        private string GetFallbackTemplate(string templateName)
        {
            // Basic HTML template as fallback
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>{_emailConfig.Templates.CompanyName}</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <h2 style='color: #2563eb;'>{_emailConfig.Templates.CompanyName}</h2>
        <p>This is a notification from {_emailConfig.Templates.CompanyName}.</p>
        <p>Template: {templateName}</p>
        <hr style='margin: 20px 0;'>
        <p style='font-size: 12px; color: #666;'>
            If you need assistance, please contact us at {_emailConfig.Templates.SupportEmail}
        </p>
    </div>
</body>
</html>";
        }
    }
}
