using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using NetworkingApp.Controllers;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;
using System.Text.Json;

namespace NetworkingApp.Tests.Controllers
{
    [TestClass]
    public class UserSettingsControllerTests
    {
        private ApplicationDbContext _context = null!;
        private UserSettingsController _controller = null!;
        private Mock<ILogger<UserSettingsController>> _mockLogger = null!;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockLogger = new Mock<ILogger<UserSettingsController>>();
            _controller = new UserSettingsController(_context, _mockLogger.Object);

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            var user = new User
            {
                Id = 1,
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                PhoneNumber = "+1234567890",
                IsVerified = true,
                Rating = 4.5m,
                TotalRatings = 10,
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                PreferredLanguage = "en",
                HasSpecialNeeds = false
            };

            var userSettings = new UserSettings
            {
                UserId = 1,
                User = user,
                Theme = "dark",
                Language = "en",
                EmailNotifications = true,
                PushNotifications = false,
                CustomPreferences = JsonSerializer.Serialize(new Dictionary<string, object>
                {
                    { "showTips", true },
                    { "autoRefresh", false }
                }),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            _context.Users.Add(user);
            _context.UserSettings.Add(userSettings);
            _context.SaveChanges();
        }

        [TestMethod]
        public async Task GetUserSettings_ExistingUser_ReturnsUserSettings()
        {
            // Act
            var result = await _controller.GetUserSettings(1);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result!;
            Assert.IsInstanceOfType(okResult.Value, typeof(UserSettingsDto));
            var userSettingsDto = (UserSettingsDto)okResult.Value!;

            Assert.AreEqual(1, userSettingsDto.UserId);
            Assert.AreEqual("dark", userSettingsDto.Theme);
            Assert.AreEqual("en", userSettingsDto.Language);
            Assert.IsTrue(userSettingsDto.EmailNotifications);
            Assert.IsFalse(userSettingsDto.PushNotifications);
            Assert.IsNotNull(userSettingsDto.CustomPreferences);
            Assert.AreEqual(2, userSettingsDto.CustomPreferences.Count);
        }

        [TestMethod]
        public async Task GetUserSettings_NonExistingUser_CreatesDefaultSettingsAndReturns()
        {
            // Act
            var result = await _controller.GetUserSettings(999);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result!;
            Assert.IsInstanceOfType(okResult.Value, typeof(UserSettingsDto));
            var userSettingsDto = (UserSettingsDto)okResult.Value!;

            Assert.AreEqual(999, userSettingsDto.UserId);
            Assert.AreEqual("light", userSettingsDto.Theme);
            Assert.AreEqual("en", userSettingsDto.Language);
            Assert.IsTrue(userSettingsDto.EmailNotifications);

            // Verify settings were saved to database
            var savedSettings = await _context.UserSettings.FirstOrDefaultAsync(us => us.UserId == 999);
            Assert.IsNotNull(savedSettings);
        }

        [TestMethod]
        public async Task UpdateUserSettings_ValidRequest_UpdatesAndReturnsSettings()
        {
            // Arrange
            var updateRequest = new UpdateUserSettingsRequest
            {
                Theme = "light",
                Language = "zh",
                EmailNotifications = false,
                PushNotifications = true,
                CustomPreferences = new Dictionary<string, object>
                {
                    { "showTips", false },
                    { "autoRefresh", true },
                    { "newSetting", "value" }
                }
            };

            // Act
            var result = await _controller.UpdateUserSettings(1, updateRequest);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result!;
            Assert.IsInstanceOfType(okResult.Value, typeof(UserSettingsDto));
            var userSettingsDto = (UserSettingsDto)okResult.Value!;

            Assert.AreEqual("light", userSettingsDto.Theme);
            Assert.AreEqual("zh", userSettingsDto.Language);
            Assert.IsFalse(userSettingsDto.EmailNotifications);
            Assert.IsTrue(userSettingsDto.PushNotifications);
            Assert.AreEqual(3, userSettingsDto.CustomPreferences.Count);

            // Verify database was updated
            var updatedSettings = await _context.UserSettings.FirstOrDefaultAsync(us => us.UserId == 1);
            Assert.IsNotNull(updatedSettings);
            Assert.AreEqual("light", updatedSettings.Theme);
            Assert.AreEqual("zh", updatedSettings.Language);
        }

        [TestMethod]
        public async Task UpdateUserSettings_NonExistingUser_CreatesNewSettingsAndReturns()
        {
            // Arrange
            var updateRequest = new UpdateUserSettingsRequest
            {
                Theme = "dark",
                Language = "zh",
                EmailNotifications = true,
                PushNotifications = false,
                CustomPreferences = new Dictionary<string, object>
                {
                    { "newUserSetting", "value" }
                }
            };

            // Act
            var result = await _controller.UpdateUserSettings(500, updateRequest);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result!;
            Assert.IsInstanceOfType(okResult.Value, typeof(UserSettingsDto));
            var userSettingsDto = (UserSettingsDto)okResult.Value!;

            Assert.AreEqual(500, userSettingsDto.UserId);
            Assert.AreEqual("dark", userSettingsDto.Theme);
            Assert.AreEqual("zh", userSettingsDto.Language);

            // Verify settings were created in database
            var newSettings = await _context.UserSettings.FirstOrDefaultAsync(us => us.UserId == 500);
            Assert.IsNotNull(newSettings);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _context.Dispose();
        }
    }
}
