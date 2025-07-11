using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NetworkingApp.Models.DTOs;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Integration tests for authentication endpoints.
    /// </summary>
    [TestClass]
    public class AuthControllerIntegrationTests : IntegrationTestBase
    {
        [TestInitialize]
        public async Task TestInitialize()
        {
            await ClearDatabaseAsync();
        }

        [TestMethod]
        public async Task Register_WithValidData_ShouldReturnSuccess()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "newuser@example.com",
                Password = "NewPassword123!",
                ConfirmPassword = "NewPassword123!",
                FullName = "New User"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/register", CreateJsonContent(registerDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();

            // Verify user was created in database
            var user = await _userManager.FindByEmailAsync(registerDto.Email);
            user.Should().NotBeNull();
            user!.Email.Should().Be(registerDto.Email);
        }

        [TestMethod]
        public async Task Register_WithInvalidEmail_ShouldReturnBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "invalid-email",
                Password = "NewPassword123!",
                ConfirmPassword = "NewPassword123!",
                FullName = "Test User"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/register", CreateJsonContent(registerDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task Register_WithWeakPassword_ShouldReturnBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "user@example.com",
                Password = "weak",
                ConfirmPassword = "weak",
                FullName = "Test User"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/register", CreateJsonContent(registerDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task Register_WithMismatchedPasswords_ShouldReturnBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "user@example.com",
                Password = "Password123!",
                ConfirmPassword = "DifferentPassword123!",
                FullName = "Test User"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/register", CreateJsonContent(registerDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
        {
            // Arrange
            var existingUser = await CreateTestUserAsync("existing@example.com");
            
            var registerDto = new RegisterDto
            {
                Email = "existing@example.com",
                Password = "NewPassword123!",
                ConfirmPassword = "NewPassword123!",
                FullName = "Test User"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/register", CreateJsonContent(registerDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task Login_WithValidCredentials_ShouldReturnToken()
        {
            // Arrange
            var email = "logintest@example.com";
            var password = "LoginPassword123!";
            var user = await CreateTestUserAsync(email, password);

            var loginDto = new LoginDto
            {
                Email = email,
                Password = password
            };

            // Act
            var response = await _client.PostAsync("/api/auth/login", CreateJsonContent(loginDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();
            content.Should().Contain("token"); // Assuming the response contains a token field
        }

        [TestMethod]
        public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
        {
            // Arrange
            var email = "logintest@example.com";
            var user = await CreateTestUserAsync(email, "CorrectPassword123!");

            var loginDto = new LoginDto
            {
                Email = email,
                Password = "WrongPassword123!"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/login", CreateJsonContent(loginDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [TestMethod]
        public async Task Login_WithNonExistentUser_ShouldReturnUnauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "nonexistent@example.com",
                Password = "SomePassword123!"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/login", CreateJsonContent(loginDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [TestMethod]
        public async Task ForgotPassword_WithExistingEmail_ShouldReturnOk()
        {
            // Arrange
            var email = "forgotpassword@example.com";
            var user = await CreateTestUserAsync(email);

            var forgotPasswordDto = new ForgotPasswordDto
            {
                Email = email
            };

            // Act
            var response = await _client.PostAsync("/api/auth/forgot-password", CreateJsonContent(forgotPasswordDto));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            // Verify email was sent (through mock service)
            var emailService = _factory.Services.GetService(typeof(NetworkingApp.Services.IEmailService)) as MockEmailService;
            emailService?.SentEmails.Should().HaveCount(1);
            emailService?.SentEmails[0].To.Should().Be(email);
        }

        [TestMethod]
        public async Task ForgotPassword_WithNonExistentEmail_ShouldReturnOk()
        {
            // Arrange
            var forgotPasswordDto = new ForgotPasswordDto
            {
                Email = "nonexistent@example.com"
            };

            // Act
            var response = await _client.PostAsync("/api/auth/forgot-password", CreateJsonContent(forgotPasswordDto));

            // Assert
            // Should return OK even for non-existent emails for security reasons
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [TestMethod]
        public async Task Logout_WhenAuthenticated_ShouldReturnOk()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Act
            var response = await _client.PostAsync("/api/auth/logout", new StringContent(""));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
