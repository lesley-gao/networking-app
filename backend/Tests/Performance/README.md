# Performance Testing Documentation

## Overview

This directory contains comprehensive performance tests for the NetworkingApp matching algorithms and database queries. The tests are designed to ensure that the application maintains acceptable performance characteristics under various load conditions.

## Test Types

### 1. Benchmark Tests (BenchmarkDotNet)

Located in: `Tests/Performance/Benchmarks/`

These tests provide detailed performance metrics including:
- Execution time measurements
- Memory allocation analysis
- Statistical analysis (mean, median, percentiles)
- Performance comparison between different approaches

**Key Benchmark Tests:**
- `MatchingAlgorithmBenchmarks.cs` - Core matching algorithm performance
- `DatabaseQueryBenchmarks.cs` - Database query optimization analysis

**Running Benchmark Tests:**
```bash
# Run all benchmark tests
dotnet run --project Tests --configuration Release -- benchmark

# The results will be saved in BenchmarkDotNet.Artifacts/ folder
```

### 2. Unit Performance Tests (MSTest)

Located in: `Tests/Performance/`

These tests validate performance requirements and provide pass/fail criteria:
- Response time thresholds
- Throughput requirements
- Memory usage validation
- Scalability verification

**Key Test Files:**
- `MatchingServicePerformanceTests.cs` - Matching service performance validation
- `DatabasePerformanceTests.cs` - Database query performance validation

**Running Unit Performance Tests:**
```bash
# Run all performance tests
dotnet test Tests --filter Category=Performance

# Run specific performance test categories
dotnet test Tests --filter "Category=Performance&Category!=LoadTest"
```

### 3. Load Tests (NBomber)

Located in: `Tests/Performance/LoadTests/`

These tests simulate realistic user load and validate system behavior under stress:
- Concurrent user simulation
- Mixed workload testing
- Throughput and response time under load
- System stability validation

**Key Load Tests:**
- `MatchingServiceLoadTests.cs` - API endpoint load testing
- `LoadTestRunner.cs` - MSTest integration for load tests

**Running Load Tests:**
```bash
# Run load tests (these take longer to complete)
dotnet test Tests --filter Category=LoadTest

# Load test reports are generated in LoadTestReports/ folder
```

## Performance Criteria

### Response Time Requirements

| Operation | Average | 95th Percentile | Maximum |
|-----------|---------|-----------------|---------|
| Flight Companion Matching | ≤ 500ms | ≤ 1000ms | ≤ 2000ms |
| Pickup Matching | ≤ 300ms | ≤ 750ms | ≤ 1500ms |
| Database Queries (Simple) | ≤ 100ms | ≤ 200ms | ≤ 500ms |
| Database Queries (Complex) | ≤ 500ms | ≤ 800ms | ≤ 1000ms |

### Throughput Requirements

| Scenario | Minimum Throughput |
|----------|-------------------|
| Flight Companion API | 15 requests/second |
| Pickup Matching API | 20 requests/second |
| Mixed Workload | 15 requests/second |

### Concurrency Requirements

- Support minimum 20 concurrent matching requests
- Maintain performance characteristics under concurrent load
- No more than 5% failure rate under normal load

## Test Data

The performance tests use a consistent seed-based data generation approach:
- 1000 test users with realistic rating distributions
- 500 flight companion requests and offers
- 300 pickup requests and offers
- Distributed across multiple airports and time periods

## Performance Monitoring

### Key Metrics Tracked

1. **Response Times**
   - Average, median, 95th and 99th percentiles
   - Min/max response times
   - Response time distribution

2. **Throughput**
   - Requests per second
   - Concurrent request handling
   - System saturation points

3. **Resource Usage**
   - Memory allocation and garbage collection
   - Database connection utilization
   - CPU usage patterns

4. **Error Rates**
   - Success/failure ratios
   - Error distribution analysis
   - System stability under load

### Reporting

Performance test results are automatically generated in multiple formats:
- Console output with summary statistics
- HTML reports (NBomber load tests)
- CSV data files for analysis
- Markdown summaries

## Continuous Integration

Performance tests are categorized for different CI scenarios:

```bash
# Quick performance validation (CI pipeline)
dotnet test Tests --filter "Category=Performance&Category!=LoadTest" --logger "console;verbosity=normal"

# Full performance suite (nightly builds)
dotnet test Tests --filter Category=Performance

# Benchmark tests (manual/scheduled)
dotnet run --project Tests --configuration Release -- benchmark
```

## Troubleshooting

### Common Issues

1. **Tests Running Slowly**
   - Ensure running in Release configuration
   - Check available system resources
   - Verify database setup is correct

2. **Memory Issues**
   - Tests create in-memory databases
   - Each test class gets its own database instance
   - Dispose is called automatically

3. **Load Test Failures**
   - Check network connectivity
   - Verify test server is properly started
   - Review load test reports for detailed error analysis

### Performance Regression Detection

If performance tests fail:

1. Check recent code changes affecting matching algorithms
2. Review database query modifications
3. Validate test environment setup
4. Compare with baseline performance metrics
5. Analyze detailed benchmark reports

## Best Practices

1. **Run in Release Mode**: Always run performance tests in Release configuration
2. **Consistent Environment**: Use the same hardware/environment for baseline comparisons
3. **Warm-up**: Tests include proper warm-up phases
4. **Statistical Significance**: Multiple iterations ensure reliable results
5. **Resource Cleanup**: All tests properly dispose resources

## Future Enhancements

- Integration with APM tools (Application Insights)
- Automated performance regression detection
- Performance trend analysis over time
- Real-world load pattern simulation
- Database indexing optimization validation
