# Email Notification Service Documentation

## Overview

The Email Notification Service provides comprehensive email functionality for WingCompanion, sending critical updates and confirmations to users. The service is integrated with the NotificationService to automatically send emails when important events occur.

## Features

### Email Types Supported

1. **Match Confirmation Emails** - Sent when users are matched for services
2. **Booking Confirmation Emails** - Sent when bookings are confirmed
3. **Payment Confirmation Emails** - Sent when payments are processed
4. **Account Verification Emails** - Sent for email verification
5. **Security Alert Emails** - Sent for security-related events
6. **Password Reset Emails** - Sent for password reset requests
7. **Service Reminder Emails** - Sent before scheduled services
8. **Service Completion Emails** - Sent after services with rating links

### Key Components

#### EmailService (`Services/EmailService.cs`)
- Implements `IEmailService` interface
- Uses SMTP for email delivery
- Template-based email generation
- Configurable email settings
- Comprehensive error handling and logging

#### EmailConfiguration (`Models/EmailConfiguration.cs`)
- SMTP server configuration
- Email template settings
- Company branding configuration
- Security settings

#### Email Templates (`Templates/Email/`)
- HTML email templates with responsive design
- Professional styling and branding
- Placeholder substitution system
- Multiple language support ready

## Configuration

### appsettings.json
```json
{
  "EmailConfiguration": {
    "IsEnabled": true,
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "UseSsl": true,
    "SmtpUsername": "",
    "SmtpPassword": "",
    "FromEmail": "noreply@flightcompanion.com",
    "FromName": "WingCompanion",
    "ReplyToEmail": "support@flightcompanion.com",
    "Templates": {
      "BaseTemplateDirectory": "Templates/Email",
      "CompanyName": "WingCompanion",
      "LogoUrl": "https://flightcompanion.com/images/logo.png",
      "SupportEmail": "support@flightcompanion.com",
      "WebsiteUrl": "https://flightcompanion.com",
      "UnsubscribeUrl": "https://flightcompanion.com/unsubscribe"
    }
  }
}
```

### Development Configuration
In development mode, email sending is disabled by default to prevent accidental emails. Set `IsEnabled: false` in `appsettings.Development.json`.

## Usage

### Dependency Injection
The EmailService is registered in `Program.cs` and can be injected into any service:

```csharp
builder.Services.Configure<EmailConfiguration>(builder.Configuration.GetSection("EmailConfiguration"));
builder.Services.AddScoped<IEmailService, EmailService>();
```

### Sending Emails
```csharp
// Inject IEmailService into your service
public class YourService
{
    private readonly IEmailService _emailService;
    
    public YourService(IEmailService emailService)
    {
        _emailService = emailService;
    }
    
    public async Task SendWelcomeEmail(string userEmail, string userName)
    {
        await _emailService.SendAccountVerificationEmailAsync(
            userEmail, userName, "https://example.com/verify?token=abc123");
    }
}
```

## Integration with NotificationService

The EmailService is automatically integrated with the NotificationService. When critical notifications are sent via SignalR, corresponding emails are also sent:

- **Match Found Notifications** → **Match Confirmation Emails**
- **Service Notifications** → **Service Reminder Emails**
- **Payment Notifications** → **Payment Confirmation Emails**

## Email Templates

### Template Structure
All email templates follow a consistent structure:
- Responsive HTML design
- Company branding (logo, colors, fonts)
- Professional styling
- Clear call-to-action buttons
- Footer with unsubscribe links

### Template Variables
Templates use placeholder substitution:
- `{{UserName}}` - Recipient's name
- `{{CompanyName}}` - Platform name
- `{{WebsiteUrl}}` - Main website URL
- `{{SupportEmail}}` - Support contact
- `{{Year}}` - Current year

### Available Templates
1. `base-template.html` - Base template structure
2. `match-confirmation.html` - Service match notifications
3. `booking-confirmation.html` - Booking confirmations
4. `payment-confirmation.html` - Payment receipts
5. `account-verification.html` - Email verification
6. `security-alert.html` - Security notifications
7. `password-reset.html` - Password reset links
8. `service-reminder.html` - Service reminders
9. `service-completion.html` - Post-service rating requests

## Security Features

- **SMTP Authentication** - Secure server authentication
- **SSL/TLS Encryption** - Encrypted email transmission
- **Input Validation** - Validates all email inputs
- **Template Sanitization** - Prevents injection attacks
- **Rate Limiting Ready** - Designed for rate limiting integration

## Error Handling

- **Graceful Degradation** - Email failures don't break notifications
- **Comprehensive Logging** - All operations are logged
- **Retry Logic Ready** - Designed for retry mechanisms
- **Fallback Templates** - Basic templates if files are missing

## Testing

### Unit Tests (`Tests/Services/EmailServiceTests.cs`)
- Tests all email sending methods
- Mocks external dependencies
- Validates configuration
- Tests error scenarios

### Integration Testing
- Email service integrates with NotificationService
- Templates are properly loaded
- Configuration is correctly applied

## Production Deployment

### SMTP Configuration
For production, configure with a reliable SMTP provider:
- **Gmail SMTP** - For small scale
- **SendGrid** - For larger scale
- **Amazon SES** - For AWS deployments
- **Azure Communication Services** - For Azure deployments

### Environment Variables
Store sensitive SMTP credentials as environment variables:
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `FROM_EMAIL`

### Monitoring
- Monitor email delivery rates
- Track bounce rates
- Log failed deliveries
- Set up alerts for service issues

## Future Enhancements

- **Email Analytics** - Track open rates and click-through rates
- **Template Editor** - Admin interface for template management
- **A/B Testing** - Test different email designs
- **Localization** - Multi-language email templates
- **Rich Content** - Support for rich media and attachments

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP configuration
   - Verify firewall settings
   - Check SMTP provider limits

2. **Templates not loading**
   - Verify template file paths
   - Check file permissions
   - Ensure template directory exists

3. **Authentication failures**
   - Verify SMTP credentials
   - Check two-factor authentication settings
   - Verify SSL/TLS settings

### Logs
All email operations are logged with appropriate log levels:
- `Information` - Successful operations
- `Warning` - Non-critical issues
- `Error` - Failed operations with stack traces

## Summary

The Email Notification Service provides a robust, scalable, and secure foundation for all email communications in WingCompanion. It's fully integrated with the existing notification system and ready for production deployment with proper SMTP configuration.
