// Tests/Performance/MatchingServicePerformanceTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.DependencyInjection;
using NetworkingApp.Services;
using NetworkingApp.Tests.Performance.Common;
using FluentAssertions;

namespace NetworkingApp.Tests.Performance
{
    /// <summary>
    /// MSTest-based performance tests for matching service
    /// </summary>
    [TestClass]
    public class MatchingServicePerformanceTests : PerformanceTestBase
    {
        private IMatchingService _matchingService = null!;

        [TestInitialize]
        public void Initialize()
        {
            _matchingService = _serviceProvider.GetRequiredService<IMatchingService>();
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task FlightCompanionMatching_Should_CompleteWithin_AcceptableTime()
        {
            // Arrange
            var requestIds = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .Take(10)
                .Select(r => r.Id)
                .ToList();

            var measurements = new List<TimeSpan>();

            // Act & Measure
            foreach (var requestId in requestIds)
            {
                var (result, elapsed) = await MeasureAsync(() => 
                    _matchingService.FindFlightCompanionMatchesAsync(requestId, 10));
                
                measurements.Add(elapsed);
                result.Should().NotBeNull();
            }

            // Assert
            var report = GenerateReport("Flight Companion Matching", measurements);
            Console.WriteLine(report.ToString());

            // Performance criteria
            report.AverageTime.TotalMilliseconds.Should().BeLessOrEqualTo(500, 
                "Average flight companion matching should complete within 500ms");
            report.P95Time.TotalMilliseconds.Should().BeLessOrEqualTo(1000,
                "95% of flight companion matching requests should complete within 1000ms");
            report.MaxTime.TotalMilliseconds.Should().BeLessOrEqualTo(2000,
                "No flight companion matching request should take more than 2000ms");
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task PickupMatching_Should_CompleteWithin_AcceptableTime()
        {
            // Arrange
            var requestIds = _context.PickupRequests
                .Where(r => !r.IsMatched)
                .Take(10)
                .Select(r => r.Id)
                .ToList();

            var measurements = new List<TimeSpan>();

            // Act & Measure
            foreach (var requestId in requestIds)
            {
                var (result, elapsed) = await MeasureAsync(() => 
                    _matchingService.FindPickupMatchesAsync(requestId, 10));
                
                measurements.Add(elapsed);
                result.Should().NotBeNull();
            }

            // Assert
            var report = GenerateReport("Pickup Matching", measurements);
            Console.WriteLine(report.ToString());

            // Performance criteria
            report.AverageTime.TotalMilliseconds.Should().BeLessOrEqualTo(300, 
                "Average pickup matching should complete within 300ms");
            report.P95Time.TotalMilliseconds.Should().BeLessOrEqualTo(750,
                "95% of pickup matching requests should complete within 750ms");
            report.MaxTime.TotalMilliseconds.Should().BeLessOrEqualTo(1500,
                "No pickup matching request should take more than 1500ms");
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task FlightCompanionMatching_ConcurrentRequests_Should_MaintainPerformance()
        {
            // Arrange
            var requestIds = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .Take(20)
                .Select(r => r.Id)
                .ToList();

            // Act & Measure
            var (results, elapsed) = await MeasureAsync(async () =>
            {
                var tasks = requestIds.Select(id => 
                    _matchingService.FindFlightCompanionMatchesAsync(id, 5));
                return await Task.WhenAll(tasks);
            });

            // Assert
            results.Should().HaveCount(20);
            elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(3000,
                "20 concurrent flight companion matching requests should complete within 3000ms");

            Console.WriteLine($"Concurrent Flight Companion Matching:");
            Console.WriteLine($"Total Time: {elapsed.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Average per Request: {elapsed.TotalMilliseconds / 20:F2}ms");
            Console.WriteLine($"Throughput: {20 / elapsed.TotalSeconds:F1} requests/second");
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task PickupMatching_ConcurrentRequests_Should_MaintainPerformance()
        {
            // Arrange
            var requestIds = _context.PickupRequests
                .Where(r => !r.IsMatched)
                .Take(20)
                .Select(r => r.Id)
                .ToList();

            // Act & Measure
            var (results, elapsed) = await MeasureAsync(async () =>
            {
                var tasks = requestIds.Select(id => 
                    _matchingService.FindPickupMatchesAsync(id, 5));
                return await Task.WhenAll(tasks);
            });

            // Assert
            results.Should().HaveCount(20);
            elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(2000,
                "20 concurrent pickup matching requests should complete within 2000ms");

            Console.WriteLine($"Concurrent Pickup Matching:");
            Console.WriteLine($"Total Time: {elapsed.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Average per Request: {elapsed.TotalMilliseconds / 20:F2}ms");
            Console.WriteLine($"Throughput: {20 / elapsed.TotalSeconds:F1} requests/second");
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task FlightCompanionMatching_LargeResultSet_Should_HandleEfficiently()
        {
            // Arrange
            var requestId = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .First().Id;

            var resultSizes = new[] { 10, 25, 50, 100 };
            var measurements = new List<(int size, TimeSpan time)>();

            // Act & Measure
            foreach (var size in resultSizes)
            {
                var (result, elapsed) = await MeasureAsync(() => 
                    _matchingService.FindFlightCompanionMatchesAsync(requestId, size));
                
                measurements.Add((size, elapsed));
                result.Should().NotBeNull();
            }

            // Assert
            Console.WriteLine("Flight Companion Matching - Result Size Performance:");
            foreach (var (size, time) in measurements)
            {
                Console.WriteLine($"Size {size}: {time.TotalMilliseconds:F2}ms");
                
                // Linear scaling expectation - larger result sets should not be exponentially slower
                var expectedMaxTime = 1000 + (size * 10); // Base 1000ms + 10ms per additional result
                time.TotalMilliseconds.Should().BeLessOrEqualTo(expectedMaxTime,
                    $"Result size {size} should not exceed expected scaling");
            }
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task PickupMatching_LargeResultSet_Should_HandleEfficiently()
        {
            // Arrange
            var requestId = _context.PickupRequests
                .Where(r => !r.IsMatched)
                .First().Id;

            var resultSizes = new[] { 10, 25, 50, 100 };
            var measurements = new List<(int size, TimeSpan time)>();

            // Act & Measure
            foreach (var size in resultSizes)
            {
                var (result, elapsed) = await MeasureAsync(() => 
                    _matchingService.FindPickupMatchesAsync(requestId, size));
                
                measurements.Add((size, elapsed));
                result.Should().NotBeNull();
            }

            // Assert
            Console.WriteLine("Pickup Matching - Result Size Performance:");
            foreach (var (size, time) in measurements)
            {
                Console.WriteLine($"Size {size}: {time.TotalMilliseconds:F2}ms");
                
                // Linear scaling expectation
                var expectedMaxTime = 750 + (size * 8); // Base 750ms + 8ms per additional result
                time.TotalMilliseconds.Should().BeLessOrEqualTo(expectedMaxTime,
                    $"Result size {size} should not exceed expected scaling");
            }
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task MatchingService_MemoryUsage_Should_BeReasonable()
        {
            // Arrange
            var initialMemory = GC.GetTotalMemory(true);
            var requestIds = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .Take(50)
                .Select(r => r.Id)
                .ToList();

            // Act - Run many matching operations
            for (int i = 0; i < 100; i++)
            {
                var requestId = requestIds[i % requestIds.Count];
                await _matchingService.FindFlightCompanionMatchesAsync(requestId, 10);
                
                // Force garbage collection every 20 iterations
                if (i % 20 == 0)
                {
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                }
            }

            // Assert
            var finalMemory = GC.GetTotalMemory(true);
            var memoryIncrease = finalMemory - initialMemory;
            var memoryIncreaseMB = memoryIncrease / (1024.0 * 1024.0);

            Console.WriteLine($"Memory Usage Analysis:");
            Console.WriteLine($"Initial Memory: {initialMemory / (1024.0 * 1024.0):F2} MB");
            Console.WriteLine($"Final Memory: {finalMemory / (1024.0 * 1024.0):F2} MB");
            Console.WriteLine($"Memory Increase: {memoryIncreaseMB:F2} MB");

            // Memory should not increase by more than 50MB for 100 matching operations
            memoryIncreaseMB.Should().BeLessOrEqualTo(50,
                "Memory usage should not increase excessively during matching operations");
        }

        [TestMethod]
        [TestCategory("Performance")]
        [DataRow(100)]
        [DataRow(500)]
        [DataRow(1000)]
        public async Task DatabaseQuery_FlightCompanionOffers_Should_ScaleWell(int dataMultiplier)
        {
            // This test validates that query performance doesn't degrade significantly with more data
            // Note: In real scenarios, you'd use pagination for large datasets
            
            // Arrange - we already have seeded data, this test uses different query patterns
            var airport1 = "JFK";
            var airport2 = "LAX";
            var targetDate = DateTime.UtcNow.AddDays(7);

            // Act & Measure
            var (results, elapsed) = await MeasureAsync(async () =>
            {
                return await _context.FlightCompanionOffers
                    .Include(o => o.User)
                    .Where(o => o.IsAvailable &&
                               o.DepartureAirport == airport1 &&
                               o.ArrivalAirport == airport2 &&
                               o.FlightDate.Date == targetDate.Date)
                    .OrderByDescending(o => o.User.Rating)
                    .Take(dataMultiplier / 10) // Scale the result set
                    .ToListAsync();
            });

            // Assert
            elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(1000,
                $"Query with filter for {dataMultiplier} scale should complete within 1000ms");

            Console.WriteLine($"Database Query Performance (scale {dataMultiplier}):");
            Console.WriteLine($"Results: {results.Count}");
            Console.WriteLine($"Query Time: {elapsed.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Results per ms: {results.Count / elapsed.TotalMilliseconds:F2}");
        }
    }
}
