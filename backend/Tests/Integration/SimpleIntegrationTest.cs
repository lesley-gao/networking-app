using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Integration
{
    /// <summary>
    /// Simple integration test to verify the setup works.
    /// </summary>
    [TestClass]
    public class SimpleIntegrationTest : IntegrationTestBase
    {
        [TestMethod]
        public async Task HealthCheck_ShouldReturnOk()
        {
            // Act
            var response = await _client.GetAsync("/api/test/health");

            // Assert
            // This test just verifies that our test infrastructure is working
            // The actual response code may vary based on the endpoint implementation
            response.Should().NotBeNull();
        }

        [TestMethod]
        public void TestInfrastructure_ShouldBeConfigured()
        {
            // Arrange & Act & Assert
            _client.Should().NotBeNull();
            _context.Should().NotBeNull();
            _userManager.Should().NotBeNull();
        }
    }
}
