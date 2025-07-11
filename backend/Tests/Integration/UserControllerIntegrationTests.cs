using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NetworkingApp.Models;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Integration tests for User management endpoints.
    /// </summary>
    [TestClass]
    public class UserControllerIntegrationTests : IntegrationTestBase
    {
        [TestInitialize]
        public async Task TestInitialize()
        {
            await ClearDatabaseAsync();
        }

        [TestMethod]
        public async Task Register_WithValidData_ShouldCreateUser()
        {
            // Arrange
            var registrationRequest = new
            {
                Email = "newuser@example.com",
                Password = "NewPassword123!",
                FirstName = "John",
                LastName = "Doe",
                PhoneNumber = "+1234567890",
                PreferredLanguage = "English",
                EmergencyContact = "Jane Doe",
                EmergencyPhone = "+1234567891"
            };

            // Act
            var response = await _client.PostAsync("/api/user/register", CreateJsonContent(registrationRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();

            // Verify user was created in database
            var user = await _userManager.FindByEmailAsync(registrationRequest.Email);
            user.Should().NotBeNull();
            user!.Email.Should().Be(registrationRequest.Email);
            user.FirstName.Should().Be(registrationRequest.FirstName);
            user.LastName.Should().Be(registrationRequest.LastName);
            user.IsVerified.Should().BeFalse(); // New users should not be verified initially
            user.IsActive.Should().BeTrue();
        }

        [TestMethod]
        public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
        {
            // Arrange
            var existingUser = await CreateTestUserAsync("existing@example.com");
            
            var registrationRequest = new
            {
                Email = "existing@example.com",
                Password = "NewPassword123!",
                FirstName = "John",
                LastName = "Doe",
                PhoneNumber = "+1234567890"
            };

            // Act
            var response = await _client.PostAsync("/api/user/register", CreateJsonContent(registrationRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task GetProfile_WhenAuthenticated_ShouldReturnUserProfile()
        {
            // Arrange
            var user = await CreateTestUserAsync("profile@example.com");
            user.FirstName = "Test";
            user.LastName = "User";
            user.PhoneNumber = "+1234567890";
            await _userManager.UpdateAsync(user);
            await AuthenticateAsync(user);

            // Act
            var response = await _client.GetAsync($"/api/user/profile/{user.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("profile@example.com");
            content.Should().Contain("Test");
            content.Should().Contain("User");
        }

        [TestMethod]
        public async Task GetProfile_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Act
            var response = await _client.GetAsync("/api/user/profile/999");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [TestMethod]
        public async Task UpdateProfile_WithValidData_ShouldUpdateUser()
        {
            // Arrange
            var user = await CreateTestUserAsync("update@example.com");
            await AuthenticateAsync(user);

            var updateRequest = new
            {
                FirstName = "Updated",
                LastName = "Name",
                PhoneNumber = "+9876543210",
                PreferredLanguage = "Spanish",
                EmergencyContact = "Updated Contact",
                EmergencyPhone = "+9876543211"
            };

            // Act
            var response = await _client.PutAsync($"/api/user/profile/{user.Id}", CreateJsonContent(updateRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            // Verify in database
            var updatedUser = await _userManager.FindByIdAsync(user.Id.ToString());
            updatedUser.Should().NotBeNull();
            updatedUser!.FirstName.Should().Be("Updated");
            updatedUser.LastName.Should().Be("Name");
            updatedUser.PhoneNumber.Should().Be("+9876543210");
        }

        [TestMethod]
        public async Task UpdateProfile_WithoutAuthentication_ShouldReturnUnauthorized()
        {
            // Arrange
            var user = await CreateTestUserAsync();

            var updateRequest = new
            {
                FirstName = "Updated",
                LastName = "Name"
            };

            // Act (without authentication)
            var response = await _client.PutAsync($"/api/user/profile/{user.Id}", CreateJsonContent(updateRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [TestMethod]
        public async Task GetUsers_WhenAuthenticated_ShouldReturnUserList()
        {
            // Arrange
            var user1 = await CreateTestUserAsync("user1@example.com");
            var user2 = await CreateTestUserAsync("user2@example.com");
            var user3 = await CreateTestUserAsync("user3@example.com");

            await AuthenticateAsync(user1);

            // Act
            var response = await _client.GetAsync("/api/user");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("user1@example.com");
            content.Should().Contain("user2@example.com");
            content.Should().Contain("user3@example.com");
        }

        [TestMethod]
        public async Task ChangePassword_WithValidData_ShouldUpdatePassword()
        {
            // Arrange
            var originalPassword = "OriginalPassword123!";
            var newPassword = "NewPassword123!";
            var user = await CreateTestUserAsync("changepass@example.com", originalPassword);
            await AuthenticateAsync(user);

            var changePasswordRequest = new
            {
                CurrentPassword = originalPassword,
                NewPassword = newPassword,
                ConfirmPassword = newPassword
            };

            // Act
            var response = await _client.PostAsync("/api/user/change-password", CreateJsonContent(changePasswordRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            // Verify password was changed by trying to sign in with new password
            var signInResult = await _signInManager.PasswordSignInAsync(user.Email!, newPassword, false, false);
            signInResult.Succeeded.Should().BeTrue();
        }

        [TestMethod]
        public async Task ChangePassword_WithIncorrectCurrentPassword_ShouldReturnBadRequest()
        {
            // Arrange
            var originalPassword = "OriginalPassword123!";
            var user = await CreateTestUserAsync("changepass@example.com", originalPassword);
            await AuthenticateAsync(user);

            var changePasswordRequest = new
            {
                CurrentPassword = "WrongPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            // Act
            var response = await _client.PostAsync("/api/user/change-password", CreateJsonContent(changePasswordRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task ChangePassword_WithMismatchedConfirmation_ShouldReturnBadRequest()
        {
            // Arrange
            var originalPassword = "OriginalPassword123!";
            var user = await CreateTestUserAsync("changepass@example.com", originalPassword);
            await AuthenticateAsync(user);

            var changePasswordRequest = new
            {
                CurrentPassword = originalPassword,
                NewPassword = "NewPassword123!",
                ConfirmPassword = "DifferentPassword123!"
            };

            // Act
            var response = await _client.PostAsync("/api/user/change-password", CreateJsonContent(changePasswordRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task DeactivateAccount_WhenAuthenticated_ShouldDeactivateUser()
        {
            // Arrange
            var user = await CreateTestUserAsync("deactivate@example.com");
            await AuthenticateAsync(user);

            // Act
            var response = await _client.PostAsync("/api/user/deactivate", new StringContent(""));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            // Verify user was deactivated in database
            var deactivatedUser = await _userManager.FindByIdAsync(user.Id.ToString());
            deactivatedUser.Should().NotBeNull();
            deactivatedUser!.IsActive.Should().BeFalse();
        }

        [TestMethod]
        public async Task DeactivateAccount_WithoutAuthentication_ShouldReturnUnauthorized()
        {
            // Act (without authentication)
            var response = await _client.PostAsync("/api/user/deactivate", new StringContent(""));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
