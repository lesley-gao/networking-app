// Tests/Performance/LoadTests/MatchingServiceLoadTests.cs
using NBomber.CSharp;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Tests.Performance.Common;
using NetworkingApp.Services;
using System.Text.Json;
using System.Text;

namespace NetworkingApp.Tests.Performance.LoadTests
{
    /// <summary>
    /// Load tests for matching service using NBomber
    /// </summary>
    public class MatchingServiceLoadTests : PerformanceTestBase
    {
        private WebApplicationFactory<Program> _factory = null!;
        private HttpClient _httpClient = null!;

        protected override void SetupServices()
        {
            base.SetupServices();
            _factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Use the same in-memory database
                        services.AddDbContext<NetworkingApp.Data.ApplicationDbContext>(options =>
                            options.UseInMemoryDatabase(_databaseName));
                    });
                });
            _httpClient = _factory.CreateClient();
        }

        public async Task RunFlightCompanionMatchingLoadTest()
        {
            // Get some test request IDs
            var requestIds = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .Take(20)
                .Select(r => r.Id)
                .ToList();

            var scenario = Scenario.Create("flight_companion_matching", async context =>
            {
                var requestId = requestIds[context.ScenarioInfo.ThreadId % requestIds.Count];
                var response = await _httpClient.GetAsync($"/api/flightcompanion/match/{requestId}");
                
                return response.IsSuccessStatusCode ? Response.Ok() : Response.Fail();
            })
            .WithLoadSimulations(
                Simulation.InjectPerSec(rate: 10, during: TimeSpan.FromMinutes(2)),
                Simulation.KeepConstant(copies: 5, during: TimeSpan.FromMinutes(1))
            );

            var stats = NBomberRunner
                .RegisterScenarios(scenario)
                .WithReportFolder("LoadTestReports")
                .WithReportFormats(ReportFormat.Html, ReportFormat.Csv)
                .Run();

            // Verify performance criteria
            var okCount = stats.AllOkCount;
            var failCount = stats.AllFailCount;
            var avgResponseTime = stats.ScenarioStats[0].Ok.Response.Mean;
            
            Console.WriteLine($"Flight Companion Matching Load Test Results:");
            Console.WriteLine($"Total Requests: {okCount + failCount}");
            Console.WriteLine($"Successful: {okCount} ({(double)okCount / (okCount + failCount) * 100:F1}%)");
            Console.WriteLine($"Failed: {failCount}");
            Console.WriteLine($"Average Response Time: {avgResponseTime:F0}ms");
            
            // Performance assertions
            if (avgResponseTime > 2000) // Should respond within 2 seconds
                throw new Exception($"Average response time {avgResponseTime}ms exceeds threshold of 2000ms");
                
            if ((double)failCount / (okCount + failCount) > 0.05) // Less than 5% failure rate
                throw new Exception($"Failure rate {(double)failCount / (okCount + failCount) * 100:F1}% exceeds threshold of 5%");
        }

        public async Task RunPickupMatchingLoadTest()
        {
            // Get some test request IDs
            var requestIds = _context.PickupRequests
                .Where(r => !r.IsMatched)
                .Take(20)
                .Select(r => r.Id)
                .ToList();

            var scenario = Scenario.Create("pickup_matching", async context =>
            {
                var requestId = requestIds[context.ScenarioInfo.ThreadId % requestIds.Count];
                var response = await _httpClient.GetAsync($"/api/pickup/match/{requestId}");
                
                return response.IsSuccessStatusCode ? Response.Ok() : Response.Fail();
            })
            .WithLoadSimulations(
                Simulation.InjectPerSec(rate: 15, during: TimeSpan.FromMinutes(2)),
                Simulation.KeepConstant(copies: 8, during: TimeSpan.FromMinutes(1))
            );

            var stats = NBomberRunner
                .RegisterScenarios(scenario)
                .WithReportFolder("LoadTestReports")
                .WithReportFormats(ReportFormat.Html, ReportFormat.Csv)
                .Run();

            // Verify performance criteria
            var okCount = stats.AllOkCount;
            var failCount = stats.AllFailCount;
            var avgResponseTime = stats.ScenarioStats[0].Ok.Response.Mean;
            
            Console.WriteLine($"Pickup Matching Load Test Results:");
            Console.WriteLine($"Total Requests: {okCount + failCount}");
            Console.WriteLine($"Successful: {okCount} ({(double)okCount / (okCount + failCount) * 100:F1}%)");
            Console.WriteLine($"Failed: {failCount}");
            Console.WriteLine($"Average Response Time: {avgResponseTime:F0}ms");
            
            // Performance assertions
            if (avgResponseTime > 1500) // Should respond within 1.5 seconds
                throw new Exception($"Average response time {avgResponseTime}ms exceeds threshold of 1500ms");
                
            if ((double)failCount / (okCount + failCount) > 0.05) // Less than 5% failure rate
                throw new Exception($"Failure rate {(double)failCount / (okCount + failCount) * 100:F1}% exceeds threshold of 5%");
        }

        public async Task RunMixedWorkloadLoadTest()
        {
            var flightRequestIds = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .Take(15)
                .Select(r => r.Id)
                .ToList();
                
            var pickupRequestIds = _context.PickupRequests
                .Where(r => !r.IsMatched)
                .Take(15)
                .Select(r => r.Id)
                .ToList();

            var flightScenario = Scenario.Create("flight_matching", async context =>
            {
                var requestId = flightRequestIds[context.ScenarioInfo.ThreadId % flightRequestIds.Count];
                var response = await _httpClient.GetAsync($"/api/flightcompanion/match/{requestId}");
                
                return response.IsSuccessStatusCode ? Response.Ok() : Response.Fail();
            })
            .WithWeight(60) // 60% of traffic
            .WithLoadSimulations(
                Simulation.InjectPerSec(rate: 12, during: TimeSpan.FromMinutes(3))
            );

            var pickupScenario = Scenario.Create("pickup_matching", async context =>
            {
                var requestId = pickupRequestIds[context.ScenarioInfo.ThreadId % pickupRequestIds.Count];
                var response = await _httpClient.GetAsync($"/api/pickup/match/{requestId}");
                
                return response.IsSuccessStatusCode ? Response.Ok() : Response.Fail();
            })
            .WithWeight(40) // 40% of traffic
            .WithLoadSimulations(
                Simulation.InjectPerSec(rate: 8, during: TimeSpan.FromMinutes(3))
            );

            var stats = NBomberRunner
                .RegisterScenarios(flightScenario, pickupScenario)
                .WithReportFolder("LoadTestReports")
                .WithReportFormats(ReportFormat.Html, ReportFormat.Csv, ReportFormat.Md)
                .Run();

            // Verify overall performance
            var totalOkCount = stats.AllOkCount;
            var totalFailCount = stats.AllFailCount;
            var overallThroughput = (double)totalOkCount / stats.TestSuite.ExecutionTime.TotalSeconds;
            
            Console.WriteLine($"Mixed Workload Load Test Results:");
            Console.WriteLine($"Total Requests: {totalOkCount + totalFailCount}");
            Console.WriteLine($"Successful: {totalOkCount} ({(double)totalOkCount / (totalOkCount + totalFailCount) * 100:F1}%)");
            Console.WriteLine($"Failed: {totalFailCount}");
            Console.WriteLine($"Overall Throughput: {overallThroughput:F1} requests/second");
            
            // Performance assertions
            if (overallThroughput < 15) // Should handle at least 15 requests/second
                throw new Exception($"Overall throughput {overallThroughput:F1} req/s is below threshold of 15 req/s");
                
            if ((double)totalFailCount / (totalOkCount + totalFailCount) > 0.05)
                throw new Exception($"Overall failure rate exceeds 5% threshold");

            // Individual scenario checks
            foreach (var scenario in stats.ScenarioStats)
            {
                var avgResponseTime = scenario.Ok.Response.Mean;
                if (avgResponseTime > 2000)
                    throw new Exception($"Scenario '{scenario.ScenarioName}' average response time {avgResponseTime}ms exceeds 2000ms");
            }
        }

        public override void Dispose()
        {
            _httpClient?.Dispose();
            _factory?.Dispose();
            base.Dispose();
        }
    }
}
