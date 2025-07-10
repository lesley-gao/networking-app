using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NetworkingApp.Data;
using NetworkingApp.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Base class for integration tests that provides a configured TestServer and InMemory database.
    /// </summary>
    public class IntegrationTestBase : IDisposable
    {
        protected readonly WebApplicationFactory<Program> _factory;
        protected readonly HttpClient _client;
        protected readonly ApplicationDbContext _context;
        protected readonly UserManager<User> _userManager;
        protected readonly SignInManager<User> _signInManager;

        protected IntegrationTestBase()
        {
            _factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Remove the existing ApplicationDbContext registration
                        var descriptor = services.SingleOrDefault(
                            d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                        if (descriptor != null)
                        {
                            services.Remove(descriptor);
                        }

                        // Add InMemory database for testing
                        services.AddDbContext<ApplicationDbContext>(options =>
                        {
                            options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}");
                        });

                        // Override email service with mock for testing
                        services.AddTransient<NetworkingApp.Services.IEmailService, MockEmailService>();
                    });

                    builder.UseEnvironment("Testing");
                });

            _client = _factory.CreateClient();

            // Get services from the test container
            var scope = _factory.Services.CreateScope();
            _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            _userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            _signInManager = scope.ServiceProvider.GetRequiredService<SignInManager<User>>();

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        /// <summary>
        /// Creates a test user and returns the user object.
        /// </summary>
        /// <param name="email">User email</param>
        /// <param name="password">User password</param>
        /// <returns>Created user</returns>
        protected async Task<User> CreateTestUserAsync(string email = "test@example.com", string password = "TestPassword123!")
        {
            var user = new User
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to create test user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            return user;
        }

        /// <summary>
        /// Creates a JWT token for the specified user.
        /// </summary>
        /// <param name="user">User to create token for</param>
        /// <returns>JWT token string</returns>
        protected async Task<string> GetJwtTokenAsync(User user)
        {
            var scope = _factory.Services.CreateScope();
            var jwtTokenService = scope.ServiceProvider.GetRequiredService<NetworkingApp.Services.IJwtTokenService>();
            return await jwtTokenService.GenerateTokenAsync(user);
        }

        /// <summary>
        /// Sets the Authorization header with a JWT token for the specified user.
        /// </summary>
        /// <param name="user">User to authenticate</param>
        protected async Task AuthenticateAsync(User user)
        {
            var token = await GetJwtTokenAsync(user);
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        /// <summary>
        /// Serializes an object to JSON for HTTP requests.
        /// </summary>
        /// <param name="obj">Object to serialize</param>
        /// <returns>StringContent with JSON data</returns>
        protected StringContent CreateJsonContent(object obj)
        {
            var json = JsonSerializer.Serialize(obj, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        /// <summary>
        /// Deserializes JSON response content to the specified type.
        /// </summary>
        /// <typeparam name="T">Type to deserialize to</typeparam>
        /// <param name="response">HTTP response</param>
        /// <returns>Deserialized object</returns>
        protected async Task<T?> DeserializeResponseAsync<T>(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
        }

        /// <summary>
        /// Clears all data from the test database.
        /// </summary>
        protected async Task ClearDatabaseAsync()
        {
            // Clear all entities in dependency order
            _context.Disputes.RemoveRange(_context.Disputes);
            _context.Escrows.RemoveRange(_context.Escrows);
            _context.Messages.RemoveRange(_context.Messages);
            _context.Notifications.RemoveRange(_context.Notifications);
            _context.Ratings.RemoveRange(_context.Ratings);
            _context.Payments.RemoveRange(_context.Payments);
            _context.FlightCompanionOffers.RemoveRange(_context.FlightCompanionOffers);
            _context.FlightCompanionRequests.RemoveRange(_context.FlightCompanionRequests);
            _context.PickupOffers.RemoveRange(_context.PickupOffers);
            _context.PickupRequests.RemoveRange(_context.PickupRequests);
            _context.VerificationDocuments.RemoveRange(_context.VerificationDocuments);
            _context.UserSettings.RemoveRange(_context.UserSettings);
            _context.Users.RemoveRange(_context.Users);

            await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _client?.Dispose();
            _context?.Dispose();
            _factory?.Dispose();
        }
    }

    /// <summary>
    /// Mock email service for testing that doesn't actually send emails.
    /// </summary>
    public class MockEmailService : NetworkingApp.Services.IEmailService
    {
        public List<(string To, string Subject, string Body)> SentEmails { get; } = new();

        public Task SendEmailAsync(string to, string subject, string body)
        {
            SentEmails.Add((to, subject, body));
            return Task.CompletedTask;
        }

        public Task SendEmailWithTemplateAsync(string to, string subject, string templateName, object model)
        {
            SentEmails.Add((to, subject, $"Template: {templateName}"));
            return Task.CompletedTask;
        }

        public Task SendMatchConfirmationEmailAsync(string requesterEmail, string requesterName, string helperEmail, string helperName, string serviceType, string serviceDetails)
        {
            SentEmails.Add((requesterEmail, "Match Confirmation", $"Match confirmed with {helperName}"));
            SentEmails.Add((helperEmail, "Match Confirmation", $"Match confirmed with {requesterName}"));
            return Task.CompletedTask;
        }

        public Task SendBookingConfirmationEmailAsync(string userEmail, string userName, string serviceType, string bookingDetails, string bookingReference)
        {
            SentEmails.Add((userEmail, "Booking Confirmation", $"Booking confirmed: {bookingReference}"));
            return Task.CompletedTask;
        }

        public Task SendPaymentConfirmationEmailAsync(string userEmail, string userName, decimal amount, string transactionId, string serviceDetails)
        {
            SentEmails.Add((userEmail, "Payment Confirmation", $"Payment of {amount} confirmed"));
            return Task.CompletedTask;
        }

        public Task SendAccountVerificationEmailAsync(string userEmail, string userName, string verificationLink)
        {
            SentEmails.Add((userEmail, "Account Verification", "Please verify your account"));
            return Task.CompletedTask;
        }

        public Task SendSecurityAlertEmailAsync(string userEmail, string userName, string alertType, string alertDetails)
        {
            SentEmails.Add((userEmail, "Security Alert", $"Security alert: {alertType}"));
            return Task.CompletedTask;
        }

        public Task SendPasswordResetEmailAsync(string userEmail, string userName, string resetLink)
        {
            SentEmails.Add((userEmail, "Password Reset", "Password reset requested"));
            return Task.CompletedTask;
        }

        public Task SendServiceReminderEmailAsync(string userEmail, string userName, string serviceType, string reminderDetails, DateTime serviceDate)
        {
            SentEmails.Add((userEmail, "Service Reminder", $"Reminder for {serviceType} on {serviceDate}"));
            return Task.CompletedTask;
        }

        public Task SendServiceCompletionEmailAsync(string userEmail, string userName, string serviceType, string partnerName, string ratingLink)
        {
            SentEmails.Add((userEmail, "Service Completion", $"Please rate your {serviceType} with {partnerName}"));
            return Task.CompletedTask;
        }

        public Task SendReceiptEmailAsync(string toEmail, NetworkingApp.Models.DTOs.ReceiptDto receipt)
        {
            SentEmails.Add((toEmail, "Receipt", $"Receipt for transaction {receipt.TransactionId}"));
            return Task.CompletedTask;
        }
    }
}
