// Tests/Performance/Benchmarks/MatchingAlgorithmBenchmarks.cs
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Order;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NetworkingApp.Data;
using NetworkingApp.Services;
using NetworkingApp.Tests.Performance.Common;

namespace NetworkingApp.Tests.Performance.Benchmarks
{
    /// <summary>
    /// BenchmarkDotNet performance tests for matching algorithms
    /// </summary>
    [MemoryDiagnoser]
    [Orderer(SummaryOrderPolicy.FastestToSlowest)]
    [RankColumn]
    public class MatchingAlgorithmBenchmarks : PerformanceTestBase
    {
        private IMatchingService _matchingService = null!;
        private List<int> _flightRequestIds = new();
        private List<int> _pickupRequestIds = new();

        [GlobalSetup]
        public void Setup()
        {
            _matchingService = _serviceProvider.GetRequiredService<IMatchingService>();
            
            // Get sample request IDs for benchmarking
            _flightRequestIds = _context.FlightCompanionRequests
                .Where(r => !r.IsMatched)
                .Take(50)
                .Select(r => r.Id)
                .ToList();
                
            _pickupRequestIds = _context.PickupRequests
                .Where(r => !r.IsMatched)
                .Take(50)
                .Select(r => r.Id)
                .ToList();
        }

        [Benchmark]
        [Arguments(5)]
        [Arguments(10)]
        [Arguments(20)]
        public async Task<int> FindFlightCompanionMatches_SingleRequest(int maxResults)
        {
            var requestId = _flightRequestIds.First();
            var matches = await _matchingService.FindFlightCompanionMatchesAsync(requestId, maxResults);
            return matches.Count;
        }

        [Benchmark]
        [Arguments(5)]
        [Arguments(10)]
        [Arguments(20)]
        public async Task<int> FindPickupMatches_SingleRequest(int maxResults)
        {
            var requestId = _pickupRequestIds.First();
            var matches = await _matchingService.FindPickupMatchesAsync(requestId, maxResults);
            return matches.Count;
        }

        [Benchmark]
        public async Task<int> FindFlightCompanionMatches_MultipleRequests()
        {
            var totalMatches = 0;
            var requestIds = _flightRequestIds.Take(10).ToList();
            
            foreach (var requestId in requestIds)
            {
                var matches = await _matchingService.FindFlightCompanionMatchesAsync(requestId, 10);
                totalMatches += matches.Count;
            }
            
            return totalMatches;
        }

        [Benchmark]
        public async Task<int> FindPickupMatches_MultipleRequests()
        {
            var totalMatches = 0;
            var requestIds = _pickupRequestIds.Take(10).ToList();
            
            foreach (var requestId in requestIds)
            {
                var matches = await _matchingService.FindPickupMatchesAsync(requestId, 10);
                totalMatches += matches.Count;
            }
            
            return totalMatches;
        }

        [Benchmark]
        public async Task<int> FindFlightCompanionMatches_ParallelRequests()
        {
            var requestIds = _flightRequestIds.Take(10).ToList();
            
            var tasks = requestIds.Select(async requestId =>
            {
                var matches = await _matchingService.FindFlightCompanionMatchesAsync(requestId, 10);
                return matches.Count;
            });
            
            var results = await Task.WhenAll(tasks);
            return results.Sum();
        }

        [Benchmark]
        public async Task<int> FindPickupMatches_ParallelRequests()
        {
            var requestIds = _pickupRequestIds.Take(10).ToList();
            
            var tasks = requestIds.Select(async requestId =>
            {
                var matches = await _matchingService.FindPickupMatchesAsync(requestId, 10);
                return matches.Count;
            });
            
            var results = await Task.WhenAll(tasks);
            return results.Sum();
        }

        [GlobalCleanup]
        public override void Dispose()
        {
            base.Dispose();
        }
    }
}
