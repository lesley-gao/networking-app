// Tests/Performance/BenchmarkRunner.cs
using BenchmarkDotNet.Running;
using NetworkingApp.Tests.Performance.Benchmarks;

namespace NetworkingApp.Tests.Performance
{
    /// <summary>
    /// Utility class to run BenchmarkDotNet performance tests
    /// Usage: Call RunBenchmarks() from another test or console app
    /// </summary>
    public static class BenchmarkRunner
    {
        public static void RunBenchmarks()
        {
            Console.WriteLine("Running BenchmarkDotNet Performance Tests...");
            Console.WriteLine("This may take several minutes to complete.");
            Console.WriteLine();

            // Run matching algorithm benchmarks
            Console.WriteLine("Running Matching Algorithm Benchmarks...");
            BenchmarkDotNet.Running.BenchmarkRunner.Run<MatchingAlgorithmBenchmarks>();

            Console.WriteLine();
            Console.WriteLine("Running Database Query Benchmarks...");
            BenchmarkDotNet.Running.BenchmarkRunner.Run<DatabaseQueryBenchmarks>();

            Console.WriteLine();
            Console.WriteLine("Benchmark tests completed. Check BenchmarkDotNet.Artifacts folder for detailed reports.");
        }
    }
}
}
