# Comprehensive Logging Strategy Documentation

## Overview

This document describes the comprehensive logging strategy implemented for WingCompanion. The strategy includes structured logging, performance monitoring, security auditing, and integration with Azure Application Insights.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Logging Levels and Categories](#logging-levels-and-categories)
3. [Structured Logging Service](#structured-logging-service)
4. [Request/Response Logging](#requestresponse-logging)
5. [Configuration](#configuration)
6. [Log Analytics and Monitoring](#log-analytics-and-monitoring)
7. [Security and Privacy](#security-and-privacy)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The logging system consists of multiple components working together:

### Core Components

- **Serilog**: Primary logging framework with structured logging capabilities
- **Application Insights**: Azure-based telemetry and monitoring service
- **StructuredLoggingService**: Custom service for business-specific logging patterns
- **RequestResponseLoggingMiddleware**: Automatic API request/response capture
- **File Logging**: Local file-based logging with rotation
- **Console Logging**: Development-time console output

### Data Flow

```
Application Events → StructuredLoggingService → Multiple Sinks
                                              ↓
                   ┌─ Console (Development)
                   ├─ File System (All environments)
                   ├─ Application Insights (Production)
                   └─ SEQ (Development - Optional)
```

## Logging Levels and Categories

### Log Levels

| Level | Description | Usage |
|-------|-------------|-------|
| **Debug** | Detailed debugging information | Development only, component-level tracing |
| **Information** | General application flow | Normal operation events, user actions |
| **Warning** | Potential issues or unexpected conditions | Performance degradation, missing data |
| **Error** | Application errors and exceptions | Exception handling, failed operations |
| **Critical** | Critical system failures | System-wide failures, security breaches |

### Log Categories

#### 1. User Actions
```csharp
_loggingService.LogUserAction("CreateFlightRequest", userId, new { 
    FlightNumber = "NZ123",
    Destination = "Auckland" 
});
```

#### 2. Security Events
```csharp
_loggingService.LogSecurityEvent("LoginAttempt", userId, ipAddress, new { 
    Success = true,
    AuthMethod = "JWT" 
});
```

#### 3. Payment Events
```csharp
_loggingService.LogPaymentEvent("PaymentProcessed", userId, 25.50m, paymentId, new { 
    Currency = "NZD",
    Method = "Stripe" 
});
```

#### 4. Matching Events
```csharp
_loggingService.LogMatchingEvent("MatchFound", requestId, offerId, userId, new { 
    Score = 0.95,
    Algorithm = "LocationProximity" 
});
```

#### 5. Performance Metrics
```csharp
_loggingService.LogPerformanceMetric("DatabaseQueryTime", 250.5, new Dictionary<string, string> {
    ["QueryType"] = "FlightSearch",
    ["ResultCount"] = "15"
});
```

## Structured Logging Service

### Interface Definition

```csharp
public interface IStructuredLoggingService
{
    void LogUserAction(string action, int? userId = null, object? additionalData = null, string? correlationId = null);
    void LogSecurityEvent(string eventType, int? userId = null, string? ipAddress = null, object? details = null);
    void LogPaymentEvent(string eventType, int? userId = null, decimal? amount = null, string? paymentId = null, object? details = null);
    void LogMatchingEvent(string eventType, int? requestId = null, int? offerId = null, int? userId = null, object? details = null);
    void LogPerformanceMetric(string metricName, double value, Dictionary<string, string>? properties = null);
    void LogBusinessEvent(string eventName, object? businessData = null, string? correlationId = null);
    void LogApiRequest(string endpoint, string method, int statusCode, long durationMs, int? userId = null, string? correlationId = null);
    void LogError(Exception exception, string context, object? additionalData = null, string? correlationId = null);
    void LogWarning(string message, object? data = null, string? correlationId = null);
    void LogInformation(string message, object? data = null, string? correlationId = null);
    void LogDebug(string message, object? data = null, string? correlationId = null);
}
```

### Key Features

1. **Automatic Context Enrichment**: Adds correlation IDs, user information, IP addresses
2. **Multiple Sinks**: Sends to console, files, and Application Insights simultaneously
3. **JSON Serialization**: Structures complex objects for analysis
4. **Performance Tracking**: Captures timing and performance metrics
5. **Security Awareness**: Filters sensitive information from logs

## Request/Response Logging

### Automatic Capture

The `RequestResponseLoggingMiddleware` automatically captures:

- **Request Details**: Method, path, headers, body (limited size)
- **Response Details**: Status code, headers, body (limited size)
- **Performance Metrics**: Request duration, processing time
- **User Context**: User ID, IP address, correlation ID

### Configuration

```json
{
  "Logging": {
    "RequestResponse": {
      "EnableBodyLogging": true,
      "MaxBodySize": 1048576,
      "ExcludedPaths": ["/health", "/metrics"],
      "SensitiveHeaders": ["Authorization", "Cookie"]
    }
  }
}
```

### Sample Output

```json
{
  "Timestamp": "2025-07-11T10:30:00.000Z",
  "Level": "Information",
  "MessageTemplate": "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms",
  "Properties": {
    "RequestMethod": "POST",
    "RequestPath": "/api/flightcompanion/requests",
    "StatusCode": 201,
    "Elapsed": 245.67,
    "UserId": "123",
    "CorrelationId": "abc123-def456-789",
    "ClientIP": "203.0.113.1",
    "UserAgent": "Mozilla/5.0..."
  }
}
```

## Configuration

### appsettings.json (Production)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "System": "Warning",
      "NetworkingApp": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    },
    "LogPath": "logs"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "formatter": "Serilog.Formatting.Json.JsonFormatter, Serilog.Formatting.Json"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/application-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      },
      {
        "Name": "ApplicationInsights",
        "Args": {
          "connectionString": "{ApplicationInsights:ConnectionString}"
        }
      }
    ]
  }
}
```

### appsettings.Development.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "NetworkingApp": "Debug"
    },
    "LogPath": "logs/development",
    "SeqUrl": "http://localhost:5341"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug"
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      },
      {
        "Name": "Debug"
      },
      {
        "Name": "Seq",
        "Args": {
          "serverUrl": "http://localhost:5341"
        }
      }
    ]
  }
}
```

## Log Analytics and Monitoring

### Application Insights Integration

#### Key Metrics Tracked

1. **Request Metrics**: Response times, success rates, failure rates
2. **Dependency Metrics**: Database query times, external API calls
3. **Custom Metrics**: Business-specific KPIs, performance counters
4. **Exception Tracking**: Detailed exception analysis with stack traces

#### Sample Queries (KQL)

**Top 10 Slowest API Endpoints**
```kusto
requests
| where timestamp > ago(24h)
| summarize avg(duration), count() by operation_Name
| top 10 by avg_duration desc
```

**Security Events Analysis**
```kusto
traces
| where customDimensions.EventType == "SecurityEvent"
| summarize count() by tostring(customDimensions.SecurityEventType), bin(timestamp, 1h)
| render timechart
```

**User Activity Patterns**
```kusto
traces
| where customDimensions.EventType == "UserAction"
| summarize count() by tostring(customDimensions.UserId), tostring(customDimensions.Action)
| top 50 by count_ desc
```

### File-Based Log Analysis

#### Log File Structure

```
logs/
├── application-20250711.log     # All application logs
├── errors-20250711.log          # Warnings and errors only
├── security-20250711.log        # Security events only
└── development/                 # Development-specific logs
    ├── application-20250711.log
    └── debug-20250711.log
```

#### Log Rotation and Retention

- **Application Logs**: 30 days retention
- **Error Logs**: 60 days retention
- **Security Logs**: 90 days retention
- **Development Logs**: 7 days retention

## Security and Privacy

### Data Protection

1. **Sensitive Data Filtering**: Automatically removes passwords, tokens, credit card numbers
2. **PII Anonymization**: User identifiers are hashed in certain contexts
3. **IP Address Handling**: Configurable IP address logging and anonymization
4. **GDPR Compliance**: Supports data export and deletion requests

### Sensitive Headers and Data

The following headers and data are automatically filtered:

- Authorization headers
- Cookie values
- API keys and tokens
- Credit card information
- Social security numbers
- Personal identification numbers

### Access Control

- **Development**: Full access to all logs including debug information
- **Staging**: Limited access, sensitive data filtered
- **Production**: Restricted access, comprehensive filtering, audit trail

## Best Practices

### For Developers

1. **Use Structured Logging**: Always use the StructuredLoggingService for consistent formatting
2. **Include Context**: Add relevant business context to log entries
3. **Use Correlation IDs**: Maintain correlation IDs across service boundaries
4. **Log Business Events**: Track important business operations and decisions
5. **Handle Exceptions Properly**: Always log exceptions with context

### Example Usage in Controllers

```csharp
[ApiController]
[Route("api/[controller]")]
public class FlightCompanionController : ControllerBase
{
    private readonly IStructuredLoggingService _logging;

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var correlationId = HttpContext.TraceIdentifier;

        try
        {
            _logging.LogUserAction("CreateFlightRequest", userId, new { 
                dto.DepartureDate,
                dto.FlightNumber,
                dto.PassengerCount 
            }, correlationId);

            var request = await _service.CreateRequestAsync(dto);

            _logging.LogBusinessEvent("FlightRequestCreated", new {
                RequestId = request.Id,
                UserId = userId,
                RequestType = "FlightCompanion"
            }, correlationId);

            return Created($"/api/flightcompanion/requests/{request.Id}", request);
        }
        catch (Exception ex)
        {
            _logging.LogError(ex, "FlightCompanionController.CreateRequest", new {
                UserId = userId,
                RequestData = dto
            }, correlationId);

            return StatusCode(500, "An error occurred while creating the request");
        }
    }
}
```

### Performance Considerations

1. **Async Logging**: Use async methods where available to avoid blocking
2. **Batch Processing**: Configure batching for high-volume scenarios
3. **Sampling**: Use sampling in high-traffic production environments
4. **Buffer Management**: Configure appropriate buffer sizes for file logging

## Troubleshooting

### Common Issues

#### 1. Missing Log Entries

**Symptoms**: Expected log entries are not appearing
**Causes**: 
- Log level filtering
- Sink configuration issues
- Application Insights connection problems

**Solutions**:
```bash
# Check log level configuration
grep -r "LogLevel" appsettings*.json

# Verify sink configuration
grep -r "WriteTo" appsettings*.json

# Test Application Insights connection
az monitor app-insights query --app {app-name} --analytics-query "traces | take 10"
```

#### 2. Performance Impact

**Symptoms**: Application slowdown after enabling logging
**Causes**:
- Synchronous logging
- Large log payloads
- Excessive logging frequency

**Solutions**:
- Enable async logging
- Implement log sampling
- Reduce log payload size
- Filter verbose categories

#### 3. Log File Growth

**Symptoms**: Disk space issues due to log file size
**Solutions**:
```json
{
  "Serilog": {
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "logs/app-.log",
          "rollingInterval": "Hour",
          "retainedFileCountLimit": 24,
          "fileSizeLimitBytes": 10485760
        }
      }
    ]
  }
}
```

### Log Analysis Tools

#### Local Development
- **Seq**: Real-time log analysis and search
- **Azure Storage Explorer**: For Azure-based log files
- **PowerShell**: For log file analysis and parsing

#### Production
- **Application Insights**: Comprehensive telemetry analysis
- **Azure Monitor**: Alerting and dashboards
- **Log Analytics**: Advanced querying and analysis

### Monitoring and Alerting

#### Key Alerts to Configure

1. **High Error Rate**: Error rate > 5% over 15 minutes
2. **Slow Response Times**: 95th percentile > 2 seconds
3. **Security Events**: Authentication failures, suspicious activity
4. **System Health**: Memory usage, CPU utilization
5. **Business Metrics**: Low user activity, failed transactions

#### Sample Alert Queries

**High Error Rate Alert**
```kusto
requests
| where timestamp > ago(15m)
| summarize 
    total = count(),
    errors = countif(success == false)
| extend errorRate = (errors * 100.0) / total
| where errorRate > 5
```

**Security Event Alert**
```kusto
traces
| where timestamp > ago(5m)
| where customDimensions.EventType == "SecurityEvent"
| where customDimensions.SecurityEventType in ("LoginFailure", "UnauthorizedAccess")
| summarize count() by bin(timestamp, 1m)
| where count_ > 10
```

## Conclusion

This comprehensive logging strategy provides:

- **Complete Observability**: Full visibility into application behavior
- **Security Monitoring**: Comprehensive security event tracking
- **Performance Insights**: Detailed performance metrics and analysis
- **Business Intelligence**: Business event tracking for analytics
- **Compliance Support**: Audit trails and data protection features

The strategy is designed to scale with the application and provide the foundation for reliable production operations and continuous improvement.
