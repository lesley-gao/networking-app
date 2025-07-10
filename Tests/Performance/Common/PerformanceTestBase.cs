// Tests/Performance/Common/PerformanceTestBase.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Services;
using System.Diagnostics;

namespace NetworkingApp.Tests.Performance.Common
{
    /// <summary>
    /// Base class for performance tests with common setup and utilities
    /// </summary>
    public abstract class PerformanceTestBase : IDisposable
    {
        protected ApplicationDbContext _context;
        protected IServiceProvider _serviceProvider;
        protected readonly string _databaseName;

        protected PerformanceTestBase()
        {
            _databaseName = $"PerformanceTestDb_{Guid.NewGuid()}";
            SetupServices();
            SeedTestData().Wait();
        }

        protected virtual void SetupServices()
        {
            var services = new ServiceCollection();
            
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
            
            services.AddLogging(builder => builder.AddConsole());
            services.AddScoped<IMatchingService, MatchingService>();
            
            _serviceProvider = services.BuildServiceProvider();
            _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
        }

        protected virtual async Task SeedTestData()
        {
            // Create test users
            var users = CreateTestUsers(1000);
            await _context.Users.AddRangeAsync(users);

            // Create flight companion requests and offers
            var flightRequests = CreateFlightCompanionRequests(users.Take(500).ToList());
            var flightOffers = CreateFlightCompanionOffers(users.Skip(500).ToList());
            await _context.FlightCompanionRequests.AddRangeAsync(flightRequests);
            await _context.FlightCompanionOffers.AddRangeAsync(flightOffers);

            // Create pickup requests and offers
            var pickupRequests = CreatePickupRequests(users.Take(300).ToList());
            var pickupOffers = CreatePickupOffers(users.Skip(700).ToList());
            await _context.PickupRequests.AddRangeAsync(pickupRequests);
            await _context.PickupOffers.AddRangeAsync(pickupOffers);

            await _context.SaveChangesAsync();
        }

        protected List<User> CreateTestUsers(int count)
        {
            var users = new List<User>();
            var random = new Random(42); // Fixed seed for consistent results

            for (int i = 0; i < count; i++)
            {
                users.Add(new User
                {
                    Id = i + 1,
                    FirstName = $"User{i}",
                    LastName = $"Test{i}",
                    Email = $"user{i}@test.com",
                    PhoneNumber = $"+1234567{i:D4}",
                    IsVerified = random.NextDouble() > 0.3, // 70% verified
                    Rating = (decimal)(random.NextDouble() * 4 + 1), // 1-5 rating
                    TotalRatings = random.Next(0, 50),
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 365)),
                    PreferredLanguage = random.NextDouble() > 0.5 ? "en" : "zh",
                    HasSpecialNeeds = random.NextDouble() > 0.8 // 20% have special needs
                });
            }

            return users;
        }

        protected List<FlightCompanionRequest> CreateFlightCompanionRequests(List<User> users)
        {
            var requests = new List<FlightCompanionRequest>();
            var random = new Random(42);
            var airports = new[] { "JFK", "LAX", "ORD", "ATL", "DFW", "DEN", "SFO", "SEA", "LAS", "MCO" };
            var airlines = new[] { "AA", "DL", "UA", "WN", "B6", "AS", "NK", "F9", "G4", "SY" };

            foreach (var user in users)
            {
                var departureAirport = airports[random.Next(airports.Length)];
                var arrivalAirport = airports[random.Next(airports.Length)];
                while (arrivalAirport == departureAirport)
                    arrivalAirport = airports[random.Next(airports.Length)];

                requests.Add(new FlightCompanionRequest
                {
                    UserId = user.Id,
                    FlightNumber = $"{airlines[random.Next(airlines.Length)]}{random.Next(1000, 9999)}",
                    FlightDate = DateTime.UtcNow.AddDays(random.Next(1, 30)),
                    DepartureAirport = departureAirport,
                    ArrivalAirport = arrivalAirport,
                    HelpType = random.NextDouble() > 0.5 ? "Navigation" : "Language Support",
                    SpecialRequirements = random.NextDouble() > 0.7 ? "Wheelchair assistance" : null,
                    MaxBudget = random.Next(20, 100),
                    IsMatched = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-random.Next(1, 24))
                });
            }

            return requests;
        }

        protected List<FlightCompanionOffer> CreateFlightCompanionOffers(List<User> users)
        {
            var offers = new List<FlightCompanionOffer>();
            var random = new Random(42);
            var airports = new[] { "JFK", "LAX", "ORD", "ATL", "DFW", "DEN", "SFO", "SEA", "LAS", "MCO" };
            var airlines = new[] { "AA", "DL", "UA", "WN", "B6", "AS", "NK", "F9", "G4", "SY" };
            var services = new[] { "Navigation", "Language Support", "Baggage Help", "Check-in Assistance" };

            foreach (var user in users)
            {
                var departureAirport = airports[random.Next(airports.Length)];
                var arrivalAirport = airports[random.Next(airports.Length)];
                while (arrivalAirport == departureAirport)
                    arrivalAirport = airports[random.Next(airports.Length)];

                offers.Add(new FlightCompanionOffer
                {
                    UserId = user.Id,
                    FlightNumber = $"{airlines[random.Next(airlines.Length)]}{random.Next(1000, 9999)}",
                    FlightDate = DateTime.UtcNow.AddDays(random.Next(1, 30)),
                    DepartureAirport = departureAirport,
                    ArrivalAirport = arrivalAirport,
                    AvailableServices = string.Join(",", services.Take(random.Next(1, 4))),
                    HourlyRate = random.Next(15, 50),
                    HelpedCount = random.Next(0, 25),
                    IsAvailable = random.NextDouble() > 0.2, // 80% available
                    CreatedAt = DateTime.UtcNow.AddHours(-random.Next(1, 48))
                });
            }

            return offers;
        }

        protected List<PickupRequest> CreatePickupRequests(List<User> users)
        {
            var requests = new List<PickupRequest>();
            var random = new Random(42);
            var airports = new[] { "JFK", "LAX", "ORD", "ATL", "DFW", "DEN", "SFO", "SEA", "LAS", "MCO" };

            foreach (var user in users)
            {
                requests.Add(new PickupRequest
                {
                    UserId = user.Id,
                    Airport = airports[random.Next(airports.Length)],
                    PickupDate = DateTime.UtcNow.AddDays(random.Next(1, 14)),
                    PassengerCount = random.Next(1, 6),
                    HasLuggage = random.NextDouble() > 0.4, // 60% have luggage
                    DestinationAddress = $"{random.Next(100, 9999)} Test St, Test City",
                    OfferedAmount = random.Next(25, 150),
                    SpecialRequirements = random.NextDouble() > 0.8 ? "Child seat required" : null,
                    IsMatched = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-random.Next(1, 12))
                });
            }

            return requests;
        }

        protected List<PickupOffer> CreatePickupOffers(List<User> users)
        {
            var offers = new List<PickupOffer>();
            var random = new Random(42);
            var airports = new[] { "JFK", "LAX", "ORD", "ATL", "DFW", "DEN", "SFO", "SEA", "LAS", "MCO" };
            var vehicleTypes = new[] { "Sedan", "SUV", "Van", "Compact", "Luxury" };

            foreach (var user in users)
            {
                offers.Add(new PickupOffer
                {
                    UserId = user.Id,
                    Airport = airports[random.Next(airports.Length)],
                    AvailableFromDate = DateTime.UtcNow,
                    AvailableToDate = DateTime.UtcNow.AddDays(30),
                    MaxPassengers = random.Next(2, 8),
                    CanHandleLuggage = random.NextDouble() > 0.3, // 70% can handle luggage
                    ServiceArea = $"Within {random.Next(10, 50)} miles of airport",
                    VehicleType = vehicleTypes[random.Next(vehicleTypes.Length)],
                    BaseRate = random.Next(30, 80),
                    IsAvailable = random.NextDouble() > 0.25, // 75% available
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 7))
                });
            }

            return offers;
        }

        /// <summary>
        /// Measure execution time of an async operation
        /// </summary>
        protected async Task<(T result, TimeSpan elapsed)> MeasureAsync<T>(Func<Task<T>> operation)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = await operation();
            stopwatch.Stop();
            return (result, stopwatch.Elapsed);
        }

        /// <summary>
        /// Measure execution time of a synchronous operation
        /// </summary>
        protected (T result, TimeSpan elapsed) Measure<T>(Func<T> operation)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = operation();
            stopwatch.Stop();
            return (result, stopwatch.Elapsed);
        }

        /// <summary>
        /// Generate performance report for a series of measurements
        /// </summary>
        protected PerformanceReport GenerateReport(string testName, List<TimeSpan> measurements)
        {
            if (!measurements.Any())
                throw new ArgumentException("No measurements provided");

            var totalTicks = measurements.Sum(m => m.Ticks);
            var avgTicks = totalTicks / measurements.Count;
            var sortedMeasurements = measurements.OrderBy(m => m.Ticks).ToList();

            return new PerformanceReport
            {
                TestName = testName,
                SampleCount = measurements.Count,
                MinTime = sortedMeasurements.First(),
                MaxTime = sortedMeasurements.Last(),
                AverageTime = new TimeSpan(avgTicks),
                MedianTime = sortedMeasurements[sortedMeasurements.Count / 2],
                P95Time = sortedMeasurements[(int)(sortedMeasurements.Count * 0.95)],
                P99Time = sortedMeasurements[(int)(sortedMeasurements.Count * 0.99)]
            };
        }

        public virtual void Dispose()
        {
            _context?.Dispose();
            _serviceProvider?.GetService<IServiceScope>()?.Dispose();
        }
    }

    /// <summary>
    /// Performance test report with statistical metrics
    /// </summary>
    public class PerformanceReport
    {
        public string TestName { get; set; } = string.Empty;
        public int SampleCount { get; set; }
        public TimeSpan MinTime { get; set; }
        public TimeSpan MaxTime { get; set; }
        public TimeSpan AverageTime { get; set; }
        public TimeSpan MedianTime { get; set; }
        public TimeSpan P95Time { get; set; }
        public TimeSpan P99Time { get; set; }

        public override string ToString()
        {
            return $"""
                Performance Report: {TestName}
                Sample Count: {SampleCount}
                Min Time: {MinTime.TotalMilliseconds:F2}ms
                Max Time: {MaxTime.TotalMilliseconds:F2}ms
                Average Time: {AverageTime.TotalMilliseconds:F2}ms
                Median Time: {MedianTime.TotalMilliseconds:F2}ms
                95th Percentile: {P95Time.TotalMilliseconds:F2}ms
                99th Percentile: {P99Time.TotalMilliseconds:F2}ms
                """;
        }
    }
}
