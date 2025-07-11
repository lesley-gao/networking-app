// Tests/Services/NotificationServiceTests.cs
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using NetworkingApp.Data;
using NetworkingApp.Hubs;
using NetworkingApp.Models;
using NetworkingApp.Services;
using NetworkingApp.Tests.Services.TestHelpers;

namespace NetworkingApp.Tests.Services
{
    [TestClass]
    public class NotificationServiceTests : ServiceTestBase
    {
        private ApplicationDbContext _context = null!;
        private Mock<IHubContext<NotificationHub>> _mockHubContext = null!;
        private Mock<IEmailService> _mockEmailService = null!;
        private Mock<ILogger<NotificationService>> _mockLogger = null!;
        private Mock<IClientProxy> _mockClientProxy = null!;
        private Mock<IHubClients> _mockClients = null!;
        private NotificationService _notificationService = null!;

        [TestInitialize]
        public void Setup()
        {
            _context = CreateInMemoryContext();
            _mockHubContext = new Mock<IHubContext<NotificationHub>>();
            _mockEmailService = new Mock<IEmailService>();
            _mockLogger = CreateMockLogger<NotificationService>();
            _mockClientProxy = new Mock<IClientProxy>();
            _mockClients = new Mock<IHubClients>();

            // Setup SignalR mocks
            _mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);

            _notificationService = new NotificationService(_context, _mockHubContext.Object, _mockEmailService.Object, _mockLogger.Object);
            SeedTestData(_context);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _context?.Dispose();
        }

        #region SendMatchFoundNotificationAsync Tests

        [TestMethod]
        public async Task SendMatchFoundNotificationAsync_ValidParameters_CreatesNotifications()
        {
            // Act
            await _notificationService.SendMatchFoundNotificationAsync(1, "PickupRequest", 1, 2);

            // Assert
            var notifications = _context.Notifications.ToList();
            notifications.Should().HaveCount(2);
            
            var requesterNotification = notifications.First(n => n.UserId == 1);
            requesterNotification.Title.Should().Be("Match Found!");
            requesterNotification.Type.Should().Be("MatchFound");
            
            var matchedUserNotification = notifications.First(n => n.UserId == 2);
            matchedUserNotification.Title.Should().Be("Service Assignment");
            matchedUserNotification.Type.Should().Be("ServiceAssignment");
        }

        [TestMethod]
        public async Task SendMatchFoundNotificationAsync_ValidParameters_SendsSignalRNotifications()
        {
            // Act
            await _notificationService.SendMatchFoundNotificationAsync(1, "FlightCompanionRequest", 1, 2);

            // Assert
            _mockClients.Verify(c => c.Group("User_1"), Times.Once);
            _mockClients.Verify(c => c.Group("User_2"), Times.Once);
            _mockClientProxy.Verify(
                c => c.SendCoreAsync("ReceiveNotification", It.IsAny<object[]>(), default),
                Times.Exactly(2));
        }

        [TestMethod]
        public async Task SendMatchFoundNotificationAsync_CreatesCorrectActionUrls()
        {
            // Act
            await _notificationService.SendMatchFoundNotificationAsync(1, "PickupRequest", 5, 2);

            // Assert
            var notifications = _context.Notifications.ToList();
            var requesterNotification = notifications.First(n => n.UserId == 1);
            var matchedUserNotification = notifications.First(n => n.UserId == 2);
            
            requesterNotification.ActionUrl.Should().Be("/pickup/matches/5");
            matchedUserNotification.ActionUrl.Should().Be("/pickup/service/5");
        }

        [TestMethod]
        public async Task SendMatchFoundNotificationAsync_SetsCorrectExpiration()
        {
            // Arrange
            var beforeCall = DateTime.UtcNow;

            // Act
            await _notificationService.SendMatchFoundNotificationAsync(1, "PickupRequest", 1, 2);

            // Assert
            var notifications = _context.Notifications.ToList();
            foreach (var notification in notifications)
            {
                notification.ExpiresAt.Should().BeAfter(beforeCall.AddDays(6));
                notification.ExpiresAt.Should().BeBefore(DateTime.UtcNow.AddDays(8));
            }
        }

        #endregion

        #region SendServiceNotificationAsync Tests

        [TestMethod]
        public async Task SendServiceNotificationAsync_ValidParameters_CreatesNotification()
        {
            // Act
            await _notificationService.SendServiceNotificationAsync(
                1, "ServiceConfirmed", "Your service has been confirmed", "/service/1");

            // Assert
            var notification = _context.Notifications.Single();
            notification.UserId.Should().Be(1);
            notification.Title.Should().Be("Service Confirmed");
            notification.Message.Should().Be("Your service has been confirmed");
            notification.Type.Should().Be("ServiceConfirmed");
            notification.ActionUrl.Should().Be("/service/1");
        }

        [TestMethod]
        public async Task SendServiceNotificationAsync_DifferentNotificationTypes_SetsCorrectTitles()
        {
            // Test various notification types
            var testCases = new[]
            {
                ("ServiceConfirmed", "Service Confirmed"),
                ("ServiceCancelled", "Service Cancelled"),
                ("PaymentReceived", "Payment Received"),
                ("PaymentFailed", "Payment Failed"),
                ("ServiceCompleted", "Service Completed"),
                ("RatingRequest", "Please Rate Your Experience"),
                ("CustomType", "Service Update")
            };

            foreach (var (type, expectedTitle) in testCases)
            {
                // Arrange
                _context.Notifications.RemoveRange(_context.Notifications);
                await _context.SaveChangesAsync();

                // Act
                await _notificationService.SendServiceNotificationAsync(1, type, "Test message");

                // Assert
                var notification = _context.Notifications.Single();
                notification.Title.Should().Be(expectedTitle, $"for notification type {type}");
            }
        }

        [TestMethod]
        public async Task SendServiceNotificationAsync_DifferentTypes_SetsCorrectExpirationDays()
        {
            var testCases = new[]
            {
                ("ServiceConfirmed", 7),
                ("ServiceCancelled", 3),
                ("PaymentReceived", 30),
                ("PaymentFailed", 7),
                ("ServiceCompleted", 14),
                ("RatingRequest", 14),
                ("UnknownType", 7)
            };

            foreach (var (type, expectedDays) in testCases)
            {
                // Arrange
                _context.Notifications.RemoveRange(_context.Notifications);
                await _context.SaveChangesAsync();
                var beforeCall = DateTime.UtcNow;

                // Act
                await _notificationService.SendServiceNotificationAsync(1, type, "Test message");

                // Assert
                var notification = _context.Notifications.Single();
                var expectedExpiration = beforeCall.AddDays(expectedDays);
                notification.ExpiresAt.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
            }
        }

        [TestMethod]
        public async Task SendServiceNotificationAsync_SendsSignalRNotification()
        {
            // Act
            await _notificationService.SendServiceNotificationAsync(1, "ServiceConfirmed", "Test message");

            // Assert
            _mockClients.Verify(c => c.Group("User_1"), Times.Once);
            _mockClientProxy.Verify(
                c => c.SendCoreAsync("ReceiveNotification", It.IsAny<object[]>(), default),
                Times.Once);
        }

        #endregion

        #region SendMessageNotificationAsync Tests

        [TestMethod]
        public async Task SendMessageNotificationAsync_ValidParameters_CreatesNotification()
        {
            // Act
            await _notificationService.SendMessageNotificationAsync(1, 2, "John Doe", "Hello there!");

            // Assert
            var notification = _context.Notifications.Single();
            notification.UserId.Should().Be(1);
            notification.Title.Should().Be("New Message");
            notification.Message.Should().Be("New message from John Doe: Hello there!");
            notification.Type.Should().Be("Message");
            notification.ActionUrl.Should().Be("/messages/2");
            notification.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromMinutes(1));
        }

        [TestMethod]
        public async Task SendMessageNotificationAsync_SendsSignalRMessage()
        {
            // Act
            await _notificationService.SendMessageNotificationAsync(1, 2, "John Doe", "Hello!");

            // Assert
            _mockClients.Verify(c => c.Group("User_1"), Times.Once);
            _mockClientProxy.Verify(
                c => c.SendCoreAsync("ReceiveMessage", It.IsAny<object[]>(), default),
                Times.Once);
        }

        [TestMethod]
        public async Task SendMessageNotificationAsync_LongMessagePreview_HandlesCorrectly()
        {
            // Arrange
            var longMessage = new string('A', 200);

            // Act
            await _notificationService.SendMessageNotificationAsync(1, 2, "John Doe", longMessage);

            // Assert
            var notification = _context.Notifications.Single();
            notification.Message.Should().Contain(longMessage);
        }

        #endregion

        #region SendSystemNotificationAsync Tests

        [TestMethod]
        public async Task SendSystemNotificationAsync_ValidParameters_CreatesNotification()
        {
            // Act
            await _notificationService.SendSystemNotificationAsync(
                1, "System Maintenance", "Scheduled maintenance tonight", "Maintenance", "/maintenance");

            // Assert
            var notification = _context.Notifications.Single();
            notification.UserId.Should().Be(1);
            notification.Title.Should().Be("System Maintenance");
            notification.Message.Should().Be("Scheduled maintenance tonight");
            notification.Type.Should().Be("Maintenance");
            notification.ActionUrl.Should().Be("/maintenance");
        }

        [TestMethod]
        public async Task SendSystemNotificationAsync_DefaultType_UsesInfo()
        {
            // Act
            await _notificationService.SendSystemNotificationAsync(1, "Test", "Test message");

            // Assert
            var notification = _context.Notifications.Single();
            notification.Type.Should().Be("Info");
        }

        [TestMethod]
        public async Task SendSystemNotificationAsync_SendsSignalRNotification()
        {
            // Act
            await _notificationService.SendSystemNotificationAsync(1, "Test", "Test message");

            // Assert
            _mockClients.Verify(c => c.Group("User_1"), Times.Once);
            _mockClientProxy.Verify(
                c => c.SendCoreAsync("ReceiveSystemNotification", It.IsAny<object[]>(), default),
                Times.Once);
        }

        [TestMethod]
        public async Task SendSystemNotificationAsync_DifferentTypes_SetsCorrectExpiration()
        {
            var testCases = new[]
            {
                ("error", 30),
                ("warning", 7),
                ("success", 3),
                ("UnknownType", 7) // Default case
            };

            foreach (var (type, expectedDays) in testCases)
            {
                // Arrange
                _context.Notifications.RemoveRange(_context.Notifications);
                await _context.SaveChangesAsync();
                var beforeCall = DateTime.UtcNow;

                // Act
                await _notificationService.SendSystemNotificationAsync(1, "Test", "Test message", type);

                // Assert
                var notification = _context.Notifications.Single();
                var expectedExpiration = beforeCall.AddDays(expectedDays);
                notification.ExpiresAt?.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
            }
        }

        #endregion

        #region Error Handling Tests

        [TestMethod]
        public async Task SendMatchFoundNotificationAsync_DatabaseError_LogsErrorAndRethrows()
        {
            // Arrange
            _context.Dispose(); // Force database error
            _context = CreateInMemoryContext();
            _context.Database.EnsureDeleted(); // Ensure database doesn't exist

            // Act & Assert
            await FluentActions.Invoking(async () =>
                await _notificationService.SendMatchFoundNotificationAsync(1, "Test", 1, 2))
                .Should().ThrowAsync<Exception>();

            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error sending match found notification")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendServiceNotificationAsync_SignalRError_LogsErrorButDoesNotRethrow()
        {
            // Arrange
            _mockClientProxy.Setup(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default))
                .ThrowsAsync(new Exception("SignalR error"));

            // Act & Assert
            await FluentActions.Invoking(async () =>
                await _notificationService.SendServiceNotificationAsync(1, "Test", "Test message"))
                .Should().ThrowAsync<Exception>();
        }

        #endregion

        #region Logging Verification Tests

        [TestMethod]
        public async Task SendServiceNotificationAsync_LogsInformation()
        {
            // Act
            await _notificationService.SendServiceNotificationAsync(1, "ServiceConfirmed", "Test");

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Service notification sent to user")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendMessageNotificationAsync_LogsInformation()
        {
            // Act
            await _notificationService.SendMessageNotificationAsync(1, 2, "John", "Hello");

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Message notification sent")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [TestMethod]
        public async Task SendSystemNotificationAsync_LogsInformation()
        {
            // Act
            await _notificationService.SendSystemNotificationAsync(1, "Test", "Test message", "Info");

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("System notification sent to user")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        #endregion

        #region Integration Tests

        [TestMethod]
        public async Task NotificationWorkflow_CompleteFlow_WorksCorrectly()
        {
            // Test complete notification workflow
            
            // 1. Send match found notification
            await _notificationService.SendMatchFoundNotificationAsync(1, "PickupRequest", 1, 2);
            
            // 2. Send service confirmation
            await _notificationService.SendServiceNotificationAsync(2, "ServiceConfirmed", "Service confirmed");
            
            // 3. Send message notification
            await _notificationService.SendMessageNotificationAsync(1, 2, "John", "Service details");
            
            // 4. Send system notification
            await _notificationService.SendSystemNotificationAsync(1, "Payment", "Payment processed", "Payment");

            // Assert
            var notifications = _context.Notifications.ToList();
            notifications.Should().HaveCount(5); // 2 from match found + 1 service + 1 message + 1 system
            
            // Verify SignalR calls
            _mockClientProxy.Verify(
                c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default),
                Times.AtLeast(5));
        }

        #endregion
    }
}