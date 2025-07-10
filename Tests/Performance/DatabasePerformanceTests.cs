// Tests/Performance/DatabasePerformanceTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Tests.Performance.Common;
using FluentAssertions;

namespace NetworkingApp.Tests.Performance
{
    /// <summary>
    /// Database-specific performance tests
    /// </summary>
    [TestClass]
    public class DatabasePerformanceTests : PerformanceTestBase
    {
        [TestMethod]
        [TestCategory("Performance")]
        public async Task DatabaseQuery_FlightCompanionOffers_FilteredQuery_Should_BeOptimized()
        {
            // Test various query patterns to ensure they perform well
            var queries = new[]
            {
                ("Basic Filter", () => _context.FlightCompanionOffers
                    .Where(o => o.IsAvailable)
                    .ToListAsync()),
                    
                ("Airport Filter", () => _context.FlightCompanionOffers
                    .Where(o => o.IsAvailable && o.DepartureAirport == "JFK")
                    .ToListAsync()),
                    
                ("Date Range Filter", () => _context.FlightCompanionOffers
                    .Where(o => o.IsAvailable && 
                               o.FlightDate >= DateTime.UtcNow &&
                               o.FlightDate <= DateTime.UtcNow.AddDays(7))
                    .ToListAsync()),
                    
                ("Complex Filter", () => _context.FlightCompanionOffers
                    .Include(o => o.User)
                    .Where(o => o.IsAvailable &&
                               o.DepartureAirport == "JFK" &&
                               o.ArrivalAirport == "LAX" &&
                               o.User.IsVerified &&
                               o.User.Rating >= 4.0m)
                    .OrderByDescending(o => o.User.Rating)
                    .Take(10)
                    .ToListAsync())
            };

            var results = new List<(string name, TimeSpan time, int count)>();

            foreach (var (name, queryFunc) in queries)
            {
                var (result, elapsed) = await MeasureAsync(queryFunc);
                results.Add((name, elapsed, result.Count));
                
                // Basic performance assertion
                elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(1000,
                    $"Query '{name}' should complete within 1000ms");
            }

            // Report results
            Console.WriteLine("Database Query Performance Results:");
            foreach (var (name, time, count) in results)
            {
                Console.WriteLine($"{name}: {time.TotalMilliseconds:F2}ms ({count} results)");
            }
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task DatabaseQuery_PickupOffers_FilteredQuery_Should_BeOptimized()
        {
            var queries = new[]
            {
                ("Basic Filter", () => _context.PickupOffers
                    .Where(o => o.IsAvailable)
                    .ToListAsync()),
                    
                ("Airport Filter", () => _context.PickupOffers
                    .Where(o => o.IsAvailable && o.Airport == "JFK")
                    .ToListAsync()),
                    
                ("Capacity Filter", () => _context.PickupOffers
                    .Where(o => o.IsAvailable && o.MaxPassengers >= 4)
                    .ToListAsync()),
                    
                ("Date Range Filter", () => _context.PickupOffers
                    .Where(o => o.IsAvailable &&
                               o.AvailableFromDate <= DateTime.UtcNow.AddDays(3) &&
                               o.AvailableToDate >= DateTime.UtcNow.AddDays(3))
                    .ToListAsync()),
                    
                ("Complex Filter", () => _context.PickupOffers
                    .Include(o => o.User)
                    .Where(o => o.IsAvailable &&
                               o.Airport == "JFK" &&
                               o.MaxPassengers >= 2 &&
                               o.CanHandleLuggage &&
                               o.User.IsVerified &&
                               o.User.Rating >= 3.5m)
                    .OrderByDescending(o => o.User.Rating)
                    .ThenBy(o => o.BaseRate)
                    .Take(10)
                    .ToListAsync())
            };

            var results = new List<(string name, TimeSpan time, int count)>();

            foreach (var (name, queryFunc) in queries)
            {
                var (result, elapsed) = await MeasureAsync(queryFunc);
                results.Add((name, elapsed, result.Count));
                
                elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(800,
                    $"Query '{name}' should complete within 800ms");
            }

            Console.WriteLine("Pickup Offers Query Performance Results:");
            foreach (var (name, time, count) in results)
            {
                Console.WriteLine($"{name}: {time.TotalMilliseconds:F2}ms ({count} results)");
            }
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task DatabaseQuery_UserQueries_Should_BeOptimized()
        {
            var queries = new[]
            {
                ("All Users", () => _context.Users.ToListAsync()),
                
                ("Verified Users", () => _context.Users
                    .Where(u => u.IsVerified)
                    .ToListAsync()),
                    
                ("High Rated Users", () => _context.Users
                    .Where(u => u.Rating >= 4.0m && u.TotalRatings >= 5)
                    .ToListAsync()),
                    
                ("Language Preference", () => _context.Users
                    .Where(u => u.PreferredLanguage == "en")
                    .ToListAsync()),
                    
                ("Recent Users", () => _context.Users
                    .Where(u => u.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(50)
                    .ToListAsync())
            };

            var results = new List<(string name, TimeSpan time, int count)>();

            foreach (var (name, queryFunc) in queries)
            {
                var (result, elapsed) = await MeasureAsync(queryFunc);
                results.Add((name, elapsed, result.Count));
                
                elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(500,
                    $"User query '{name}' should complete within 500ms");
            }

            Console.WriteLine("User Query Performance Results:");
            foreach (var (name, time, count) in results)
            {
                Console.WriteLine($"{name}: {time.TotalMilliseconds:F2}ms ({count} results)");
            }
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task DatabaseQuery_BatchOperations_Should_BeEfficient()
        {
            // Test batch operations vs individual operations
            var userIds = _context.Users.Take(10).Select(u => u.Id).ToList();

            // Individual queries
            var (individualResults, individualTime) = await MeasureAsync(async () =>
            {
                var results = new List<User>();
                foreach (var id in userIds)
                {
                    var user = await _context.Users.FindAsync(id);
                    if (user != null) results.Add(user);
                }
                return results;
            });

            // Batch query
            var (batchResults, batchTime) = await MeasureAsync(async () =>
            {
                return await _context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .ToListAsync();
            });

            // Assert
            batchResults.Should().HaveCount(individualResults.Count);
            batchTime.Should().BeLessThan(individualTime,
                "Batch query should be faster than individual queries");

            Console.WriteLine($"Batch vs Individual Query Performance:");
            Console.WriteLine($"Individual Queries: {individualTime.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Batch Query: {batchTime.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Performance Improvement: {(individualTime.TotalMilliseconds / batchTime.TotalMilliseconds):F1}x");
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task DatabaseQuery_Pagination_Should_BeEfficient()
        {
            // Test different pagination strategies
            const int pageSize = 20;
            var pages = new[] { 0, 1, 2, 5, 10 }; // Test various page offsets

            var results = new List<(int page, TimeSpan time, int count)>();

            foreach (var page in pages)
            {
                var (result, elapsed) = await MeasureAsync(async () =>
                {
                    return await _context.FlightCompanionOffers
                        .Include(o => o.User)
                        .Where(o => o.IsAvailable)
                        .OrderByDescending(o => o.CreatedAt)
                        .Skip(page * pageSize)
                        .Take(pageSize)
                        .ToListAsync();
                });

                results.Add((page, elapsed, result.Count));
                
                // Performance should not degrade significantly with higher page numbers
                elapsed.TotalMilliseconds.Should().BeLessOrEqualTo(1000,
                    $"Pagination query for page {page} should complete within 1000ms");
            }

            Console.WriteLine("Pagination Performance Results:");
            foreach (var (page, time, count) in results)
            {
                Console.WriteLine($"Page {page}: {time.TotalMilliseconds:F2}ms ({count} results)");
            }

            // First page should be fastest, but performance shouldn't degrade too much
            var firstPageTime = results.First(r => r.page == 0).time;
            var lastPageTime = results.Last().time;
            
            (lastPageTime.TotalMilliseconds / firstPageTime.TotalMilliseconds).Should().BeLessOrEqualTo(3.0,
                "Pagination performance should not degrade more than 3x for later pages");
        }

        [TestMethod]
        [TestCategory("Performance")]
        public async Task DatabaseInsert_BulkOperations_Should_BeEfficient()
        {
            // Test bulk insert performance
            var testUsers = CreateTestUsers(100);
            
            // Single inserts
            var (_, individualTime) = await MeasureAsync(async () =>
            {
                foreach (var user in testUsers.Take(20))
                {
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
            });

            // Bulk insert
            var (_, bulkTime) = await MeasureAsync(async () =>
            {
                _context.Users.AddRange(testUsers.Skip(20).Take(20));
                await _context.SaveChangesAsync();
            });

            // Assert
            bulkTime.Should().BeLessThan(individualTime,
                "Bulk insert should be faster than individual inserts");

            Console.WriteLine($"Insert Performance Comparison:");
            Console.WriteLine($"Individual Inserts (20 records): {individualTime.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Bulk Insert (20 records): {bulkTime.TotalMilliseconds:F2}ms");
            Console.WriteLine($"Performance Improvement: {(individualTime.TotalMilliseconds / bulkTime.TotalMilliseconds):F1}x");
        }
    }
}
