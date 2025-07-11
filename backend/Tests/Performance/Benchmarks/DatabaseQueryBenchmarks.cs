// Tests/Performance/Benchmarks/DatabaseQueryBenchmarks.cs
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Order;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Tests.Performance.Common;

namespace NetworkingApp.Tests.Performance.Benchmarks
{
    /// <summary>
    /// BenchmarkDotNet performance tests for database queries
    /// </summary>
    [MemoryDiagnoser]
    [Orderer(SummaryOrderPolicy.FastestToSlowest)]
    [RankColumn]
    public class DatabaseQueryBenchmarks : PerformanceTestBase
    {
        [Benchmark]
        public async Task<int> QueryFlightCompanionRequests_NoIncludes()
        {
            var requests = await _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .ToListAsync();
            return requests.Count;
        }

        [Benchmark]
        public async Task<int> QueryFlightCompanionRequests_WithUserInclude()
        {
            var requests = await _context.FlightCompanionRequests
                .Include(r => r.User)
                .Where(r => !r.IsMatched)
                .ToListAsync();
            return requests.Count;
        }

        [Benchmark]
        public async Task<int> QueryFlightCompanionOffers_NoIncludes()
        {
            var offers = await _context.FlightCompanionOffers
                .Where(o => o.IsAvailable)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        public async Task<int> QueryFlightCompanionOffers_WithUserInclude()
        {
            var offers = await _context.FlightCompanionOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        [Arguments("JFK", "LAX")]
        [Arguments("ORD", "ATL")]
        public async Task<int> QueryFlightCompanionOffers_ByRoute(string departure, string arrival)
        {
            var offers = await _context.FlightCompanionOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.DepartureAirport == departure &&
                           o.ArrivalAirport == arrival)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        public async Task<int> QueryPickupRequests_NoIncludes()
        {
            var requests = await _context.PickupRequests
                .Where(r => !r.IsMatched)
                .ToListAsync();
            return requests.Count;
        }

        [Benchmark]
        public async Task<int> QueryPickupRequests_WithUserInclude()
        {
            var requests = await _context.PickupRequests
                .Include(r => r.User)
                .Where(r => !r.IsMatched)
                .ToListAsync();
            return requests.Count;
        }

        [Benchmark]
        public async Task<int> QueryPickupOffers_NoIncludes()
        {
            var offers = await _context.PickupOffers
                .Where(o => o.IsAvailable)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        public async Task<int> QueryPickupOffers_WithUserInclude()
        {
            var offers = await _context.PickupOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        [Arguments("JFK")]
        [Arguments("LAX")]
        [Arguments("ORD")]
        public async Task<int> QueryPickupOffers_ByAirport(string airport)
        {
            var offers = await _context.PickupOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable && o.Airport == airport)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        [Arguments(2)]
        [Arguments(4)]
        [Arguments(6)]
        public async Task<int> QueryPickupOffers_ByCapacity(int minCapacity)
        {
            var offers = await _context.PickupOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable && o.MaxPassengers >= minCapacity)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        public async Task<int> QueryUsers_VerifiedOnly()
        {
            var users = await _context.Users
                .Where(u => u.IsVerified)
                .ToListAsync();
            return users.Count;
        }

        [Benchmark]
        public async Task<int> QueryUsers_HighRated()
        {
            var users = await _context.Users
                .Where(u => u.Rating >= 4.0m && u.TotalRatings >= 5)
                .ToListAsync();
            return users.Count;
        }

        [Benchmark]
        public async Task<int> QueryUsers_WithLanguagePreference()
        {
            var users = await _context.Users
                .Where(u => u.PreferredLanguage == "en")
                .ToListAsync();
            return users.Count;
        }

        [Benchmark]
        public async Task<int> ComplexQuery_FlightMatchingCriteria()
        {
            var targetDate = DateTime.UtcNow.AddDays(7).Date;
            var offers = await _context.FlightCompanionOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.FlightDate.Date == targetDate &&
                           o.DepartureAirport == "JFK" &&
                           o.ArrivalAirport == "LAX" &&
                           o.User.IsVerified &&
                           o.User.Rating >= 4.0m)
                .OrderByDescending(o => o.User.Rating)
                .ThenByDescending(o => o.HelpedCount)
                .Take(10)
                .ToListAsync();
            return offers.Count;
        }

        [Benchmark]
        public async Task<int> ComplexQuery_PickupMatchingCriteria()
        {
            var targetDate = DateTime.UtcNow.AddDays(3).Date;
            var offers = await _context.PickupOffers
                .Include(o => o.User)
                .Where(o => o.IsAvailable &&
                           o.Airport == "JFK" &&
                           o.MaxPassengers >= 2 &&
                           o.CanHandleLuggage &&
                           o.AvailableFromDate.Date <= targetDate &&
                           o.AvailableToDate.Date >= targetDate &&
                           o.User.IsVerified &&
                           o.User.Rating >= 3.5m)
                .OrderByDescending(o => o.User.Rating)
                .ThenBy(o => o.BaseRate)
                .Take(10)
                .ToListAsync();
            return offers.Count;
        }
    }
}
