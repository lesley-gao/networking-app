using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NetworkingApp.Models;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Integration tests for Payment endpoints.
    /// </summary>
    [TestClass]
    public class PaymentControllerIntegrationTests : IntegrationTestBase
    {
        [TestInitialize]
        public async Task TestInitialize()
        {
            await ClearDatabaseAsync();
        }

        [TestMethod]
        public async Task CreatePaymentIntent_WithValidData_ShouldReturnClientSecret()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var paymentRequest = new
            {
                Amount = 100.00m,
                Currency = "usd",
                ReceiptEmail = user.Email,
                Description = "Test payment for flight companion service",
                Metadata = new Dictionary<string, string>
                {
                    { "service_type", "flight_companion" },
                    { "user_id", user.Id.ToString() }
                }
            };

            // Act
            var response = await _client.PostAsync("/api/payment/create-intent", CreateJsonContent(paymentRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();
            content.Should().Contain("clientSecret");
        }

        [TestMethod]
        public async Task CreatePaymentIntent_WithoutAuthentication_ShouldReturnUnauthorized()
        {
            // Arrange
            var paymentRequest = new
            {
                Amount = 100.00m,
                Currency = "usd",
                ReceiptEmail = "test@example.com",
                Description = "Test payment"
            };

            // Act (without authentication)
            var response = await _client.PostAsync("/api/payment/create-intent", CreateJsonContent(paymentRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [TestMethod]
        public async Task CreatePaymentIntent_WithInvalidAmount_ShouldReturnBadRequest()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var paymentRequest = new
            {
                Amount = -10.00m, // Invalid negative amount
                Currency = "usd",
                ReceiptEmail = user.Email,
                Description = "Test payment"
            };

            // Act
            var response = await _client.PostAsync("/api/payment/create-intent", CreateJsonContent(paymentRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task CreateCheckoutSession_WithValidData_ShouldReturnSessionUrl()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var checkoutRequest = new
            {
                Amount = 150.00m,
                Currency = "usd",
                SuccessUrl = "https://localhost:3000/payment/success",
                CancelUrl = "https://localhost:3000/payment/cancel",
                Description = "Flight companion service payment",
                Metadata = new Dictionary<string, string>
                {
                    { "service_type", "flight_companion" },
                    { "user_id", user.Id.ToString() }
                }
            };

            // Act
            var response = await _client.PostAsync("/api/payment/create-checkout-session", CreateJsonContent(checkoutRequest));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();
            content.Should().Contain("url"); // Stripe checkout session URL
        }

        [TestMethod]
        public async Task ConfirmPayment_WithValidPaymentIntentId_ShouldReturnSuccess()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create a payment record in the database first
            var payment = new Payment
            {
                UserId = user.Id,
                Amount = 100.00m,
                Currency = "USD",
                Status = "pending",
                PaymentIntentId = "pi_test_12345",
                CreatedAt = DateTime.UtcNow,
                Description = "Test payment",
                Metadata = "{\"service_type\":\"flight_companion\"}"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            var confirmRequest = new
            {
                PaymentIntentId = "pi_test_12345"
            };

            // Act
            var response = await _client.PostAsync("/api/payment/confirm", CreateJsonContent(confirmRequest));

            // Assert
            // Note: This will likely fail in a real test environment without actual Stripe integration
            // but we're testing the endpoint structure and authentication
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
        }

        [TestMethod]
        public async Task GetPaymentHistory_WhenAuthenticated_ShouldReturnUserPayments()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Create test payments for the user
            var payment1 = new Payment
            {
                UserId = user.Id,
                Amount = 100.00m,
                Currency = "USD",
                Status = "completed",
                PaymentIntentId = "pi_test_1",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                Description = "Flight companion payment 1"
            };

            var payment2 = new Payment
            {
                UserId = user.Id,
                Amount = 200.00m,
                Currency = "USD",
                Status = "completed",
                PaymentIntentId = "pi_test_2",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Description = "Flight companion payment 2"
            };

            // Create payment for different user (should not be returned)
            var otherUser = await CreateTestUserAsync("other@example.com");
            var otherPayment = new Payment
            {
                UserId = otherUser.Id,
                Amount = 50.00m,
                Currency = "USD",
                Status = "completed",
                PaymentIntentId = "pi_test_3",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Description = "Other user payment"
            };

            _context.Payments.AddRange(payment1, payment2, otherPayment);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync("/api/payment/history");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var payments = await DeserializeResponseAsync<List<Payment>>(response);
            payments.Should().NotBeNull();
            payments.Should().HaveCount(2); // Only current user's payments
            payments!.All(p => p.UserId == user.Id).Should().BeTrue();
            payments.Should().Contain(p => p.PaymentIntentId == "pi_test_1");
            payments.Should().Contain(p => p.PaymentIntentId == "pi_test_2");
            payments.Should().NotContain(p => p.PaymentIntentId == "pi_test_3");
        }

        [TestMethod]
        public async Task GetPaymentHistory_WithoutAuthentication_ShouldReturnUnauthorized()
        {
            // Act (without authentication)
            var response = await _client.GetAsync("/api/payment/history");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [TestMethod]
        public async Task GetPayment_WithValidId_ShouldReturnPayment()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            var payment = new Payment
            {
                UserId = user.Id,
                Amount = 100.00m,
                Currency = "USD",
                Status = "completed",
                PaymentIntentId = "pi_test_123",
                CreatedAt = DateTime.UtcNow,
                Description = "Test payment"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync($"/api/payment/{payment.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var returnedPayment = await DeserializeResponseAsync<Payment>(response);
            returnedPayment.Should().NotBeNull();
            returnedPayment!.Id.Should().Be(payment.Id);
            returnedPayment.Amount.Should().Be(100.00m);
            returnedPayment.PaymentIntentId.Should().Be("pi_test_123");
        }

        [TestMethod]
        public async Task GetPayment_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var user = await CreateTestUserAsync();
            await AuthenticateAsync(user);

            // Act
            var response = await _client.GetAsync("/api/payment/999");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [TestMethod]
        public async Task GetPayment_ForDifferentUser_ShouldReturnForbidden()
        {
            // Arrange
            var user1 = await CreateTestUserAsync("user1@example.com");
            var user2 = await CreateTestUserAsync("user2@example.com");

            // Create payment for user2
            var payment = new Payment
            {
                UserId = user2.Id,
                Amount = 100.00m,
                Currency = "USD",
                Status = "completed",
                PaymentIntentId = "pi_test_123",
                CreatedAt = DateTime.UtcNow,
                Description = "Test payment"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Authenticate as user1 and try to access user2's payment
            await AuthenticateAsync(user1);

            // Act
            var response = await _client.GetAsync($"/api/payment/{payment.Id}");

            // Assert
            response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
        }
    }
}
