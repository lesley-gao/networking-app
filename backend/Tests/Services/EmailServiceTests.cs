// Tests/Services/EmailServiceTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Moq;
using NetworkingApp.Services;
using NetworkingApp.Models;

namespace Tests.Services
{
    [TestClass]
    public class EmailServiceTests
    {
        private Mock<IOptions<EmailConfiguration>> _mockEmailConfig;
        private Mock<ILogger<EmailService>> _mockLogger;
        private Mock<IWebHostEnvironment> _mockEnvironment;
        private EmailService _emailService;
        private EmailConfiguration _emailConfiguration;

        [TestInitialize]
        public void Setup()
        {
            _mockEmailConfig = new Mock<IOptions<EmailConfiguration>>();
            _mockLogger = new Mock<ILogger<EmailService>>();
            _mockEnvironment = new Mock<IWebHostEnvironment>();

            _emailConfiguration = new EmailConfiguration
            {
                IsEnabled = false, // Disabled for testing to avoid actual email sending
                SmtpServer = "test.smtp.com",
                SmtpPort = 587,
                UseSsl = true,
                SmtpUsername = "test@test.com",
                SmtpPassword = "testpassword",
                FromEmail = "noreply@test.com",
                FromName = "Test Platform",
                ReplyToEmail = "support@test.com",
                Templates = new EmailTemplateConfiguration
                {
                    BaseTemplateDirectory = "Templates/Email",
                    CompanyName = "Test Platform",
                    LogoUrl = "https://test.com/logo.png",
                    SupportEmail = "support@test.com",
                    WebsiteUrl = "https://test.com",
                    UnsubscribeUrl = "https://test.com/unsubscribe"
                }
            };

            _mockEmailConfig.Setup(x => x.Value).Returns(_emailConfiguration);
            _mockEnvironment.Setup(x => x.ContentRootPath).Returns("C:\\TestProject");

            _emailService = new EmailService(_mockEmailConfig.Object, _mockLogger.Object, _mockEnvironment.Object);
        }

        [TestMethod]
        public async Task SendMatchConfirmationEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var requesterEmail = "requester@test.com";
            var requesterName = "John Doe";
            var helperEmail = "helper@test.com";
            var helperName = "Jane Smith";
            var serviceType = "Flight Companion";
            var serviceDetails = "Flight ABC123 from AKL to PVG";

            // Act & Assert
            await _emailService.SendMatchConfirmationEmailAsync(
                requesterEmail, requesterName, helperEmail, helperName, serviceType, serviceDetails);

            // Verify logging occurred (since email is disabled in test)
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Match confirmation emails sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendBookingConfirmationEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var serviceType = "Airport Pickup";
            var bookingDetails = "Pickup from AKL to City Center";
            var bookingReference = "BK123456";

            // Act & Assert
            await _emailService.SendBookingConfirmationEmailAsync(
                userEmail, userName, serviceType, bookingDetails, bookingReference);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Booking confirmation email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendPaymentConfirmationEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var amount = 50.00m;
            var transactionId = "TXN123456";
            var serviceDetails = "Flight companion service";

            // Act & Assert
            await _emailService.SendPaymentConfirmationEmailAsync(
                userEmail, userName, amount, transactionId, serviceDetails);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Payment confirmation email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendAccountVerificationEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var verificationLink = "https://test.com/verify/123";

            // Act & Assert
            await _emailService.SendAccountVerificationEmailAsync(userEmail, userName, verificationLink);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Account verification email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendSecurityAlertEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var alertType = "Suspicious Login";
            var alertDetails = "Login from unknown device detected";

            // Act & Assert
            await _emailService.SendSecurityAlertEmailAsync(userEmail, userName, alertType, alertDetails);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Security alert email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendPasswordResetEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var resetLink = "https://test.com/reset/123";

            // Act & Assert
            await _emailService.SendPasswordResetEmailAsync(userEmail, userName, resetLink);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Password reset email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendServiceReminderEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var serviceType = "Flight Companion";
            var reminderDetails = "Your flight companion service is tomorrow";
            var serviceDate = DateTime.UtcNow.AddDays(1);

            // Act & Assert
            await _emailService.SendServiceReminderEmailAsync(
                userEmail, userName, serviceType, reminderDetails, serviceDate);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Service reminder email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendServiceCompletionEmailAsync_WithValidParameters_ShouldComplete()
        {
            // Arrange
            var userEmail = "user@test.com";
            var userName = "John Doe";
            var serviceType = "Airport Pickup";
            var partnerName = "Jane Smith";
            var ratingLink = "https://test.com/rate/123";

            // Act & Assert
            await _emailService.SendServiceCompletionEmailAsync(
                userEmail, userName, serviceType, partnerName, ratingLink);

            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Service completion email sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [TestMethod]
        public void EmailConfiguration_ShouldBeProperlyConfigured()
        {
            // Arrange & Act
            var config = _emailConfiguration;

            // Assert
            Assert.IsNotNull(config);
            Assert.IsFalse(config.IsEnabled); // Disabled for testing
            Assert.AreEqual("test.smtp.com", config.SmtpServer);
            Assert.AreEqual(587, config.SmtpPort);
            Assert.IsTrue(config.UseSsl);
            Assert.AreEqual("noreply@test.com", config.FromEmail);
            Assert.AreEqual("Test Platform", config.FromName);
            Assert.IsNotNull(config.Templates);
            Assert.AreEqual("Test Platform", config.Templates.CompanyName);
        }
    }
}
