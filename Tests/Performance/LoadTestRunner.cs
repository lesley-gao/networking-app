// Tests/Performance/LoadTestRunner.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NetworkingApp.Tests.Performance.Common;
using NetworkingApp.Tests.Performance.LoadTests;

namespace NetworkingApp.Tests.Performance
{
    /// <summary>
    /// MSTest runner for NBomber load tests
    /// </summary>
    [TestClass]
    public class LoadTestRunner : PerformanceTestBase
    {
        private MatchingServiceLoadTests _loadTests = null!;

        [TestInitialize]
        public void Initialize()
        {
            _loadTests = new MatchingServiceLoadTests();
        }

        [TestCleanup]
        public void Cleanup()
        {
            _loadTests?.Dispose();
        }

        [TestMethod]
        [TestCategory("LoadTest")]
        [TestCategory("Performance")]
        public async Task RunFlightCompanionMatchingLoadTest()
        {
            await _loadTests.RunFlightCompanionMatchingLoadTest();
        }

        [TestMethod]
        [TestCategory("LoadTest")]
        [TestCategory("Performance")]
        public async Task RunPickupMatchingLoadTest()
        {
            await _loadTests.RunPickupMatchingLoadTest();
        }

        [TestMethod]
        [TestCategory("LoadTest")]
        [TestCategory("Performance")]
        public async Task RunMixedWorkloadLoadTest()
        {
            await _loadTests.RunMixedWorkloadLoadTest();
        }
    }
}
