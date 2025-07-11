using Microsoft.Extensions.Logging;
using System.Text.Json;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace NetworkingApp.Services
{
    /// <summary>
    /// Enhanced logging service providing structured logging with Application Insights integration
    /// Implements consistent logging patterns across the application
    /// </summary>
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

    public class StructuredLoggingService : IStructuredLoggingService
    {
        private readonly ILogger<StructuredLoggingService> _logger;
        private readonly TelemetryClient _telemetryClient;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public StructuredLoggingService(
            ILogger<StructuredLoggingService> logger,
            TelemetryClient telemetryClient,
            IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _telemetryClient = telemetryClient;
            _httpContextAccessor = httpContextAccessor;
        }

        public void LogUserAction(string action, int? userId = null, object? additionalData = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["ActionType"] = "UserAction";
            properties["Action"] = action;
            
            if (userId.HasValue)
                properties["UserId"] = userId.Value.ToString();

            var logData = new
            {
                Action = action,
                UserId = userId,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId(),
                AdditionalData = additionalData,
                UserAgent = GetUserAgent(),
                IpAddress = GetClientIpAddress()
            };

            _logger.LogInformation("User action: {Action} by User {UserId}", action, userId);
            _telemetryClient.TrackEvent("UserAction", properties, CreateMetrics(additionalData));
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Information);
        }

        public void LogSecurityEvent(string eventType, int? userId = null, string? ipAddress = null, object? details = null)
        {
            var properties = CreateBaseProperties();
            properties["EventType"] = "SecurityEvent";
            properties["SecurityEventType"] = eventType;
            
            if (userId.HasValue)
                properties["UserId"] = userId.Value.ToString();
            
            if (!string.IsNullOrEmpty(ipAddress))
                properties["IpAddress"] = ipAddress;

            var logData = new
            {
                EventType = eventType,
                UserId = userId,
                IpAddress = ipAddress ?? GetClientIpAddress(),
                Timestamp = DateTime.UtcNow,
                UserAgent = GetUserAgent(),
                Details = details
            };

            _logger.LogWarning("Security event: {EventType} for User {UserId} from IP {IpAddress}", 
                eventType, userId, ipAddress ?? GetClientIpAddress());
            
            _telemetryClient.TrackEvent("SecurityEvent", properties, CreateMetrics(details));
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Warning);
        }

        public void LogPaymentEvent(string eventType, int? userId = null, decimal? amount = null, string? paymentId = null, object? details = null)
        {
            var properties = CreateBaseProperties();
            properties["EventType"] = "PaymentEvent";
            properties["PaymentEventType"] = eventType;
            
            if (userId.HasValue)
                properties["UserId"] = userId.Value.ToString();
            
            if (!string.IsNullOrEmpty(paymentId))
                properties["PaymentId"] = paymentId;

            var metrics = new Dictionary<string, double>();
            if (amount.HasValue)
                metrics["Amount"] = (double)amount.Value;

            var logData = new
            {
                EventType = eventType,
                UserId = userId,
                Amount = amount,
                PaymentId = paymentId,
                Timestamp = DateTime.UtcNow,
                Details = details
            };

            _logger.LogInformation("Payment event: {EventType} for User {UserId}, Amount: {Amount}, PaymentId: {PaymentId}", 
                eventType, userId, amount, paymentId);
            
            _telemetryClient.TrackEvent("PaymentEvent", properties, metrics);
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Information);
        }

        public void LogMatchingEvent(string eventType, int? requestId = null, int? offerId = null, int? userId = null, object? details = null)
        {
            var properties = CreateBaseProperties();
            properties["EventType"] = "MatchingEvent";
            properties["MatchingEventType"] = eventType;
            
            if (requestId.HasValue)
                properties["RequestId"] = requestId.Value.ToString();
            
            if (offerId.HasValue)
                properties["OfferId"] = offerId.Value.ToString();
            
            if (userId.HasValue)
                properties["UserId"] = userId.Value.ToString();

            var logData = new
            {
                EventType = eventType,
                RequestId = requestId,
                OfferId = offerId,
                UserId = userId,
                Timestamp = DateTime.UtcNow,
                Details = details
            };

            _logger.LogInformation("Matching event: {EventType} for Request {RequestId}, Offer {OfferId}, User {UserId}", 
                eventType, requestId, offerId, userId);
            
            _telemetryClient.TrackEvent("MatchingEvent", properties, CreateMetrics(details));
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Information);
        }

        public void LogPerformanceMetric(string metricName, double value, Dictionary<string, string>? properties = null)
        {
            var telemetryProperties = CreateBaseProperties();
            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    telemetryProperties[prop.Key] = prop.Value;
                }
            }

            _logger.LogInformation("Performance metric: {MetricName} = {Value}", metricName, value);
            _telemetryClient.TrackMetric(metricName, value, telemetryProperties);
        }

        public void LogBusinessEvent(string eventName, object? businessData = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["EventType"] = "BusinessEvent";
            properties["EventName"] = eventName;

            var logData = new
            {
                EventName = eventName,
                BusinessData = businessData,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId()
            };

            _logger.LogInformation("Business event: {EventName}", eventName);
            _telemetryClient.TrackEvent("BusinessEvent", properties, CreateMetrics(businessData));
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Information);
        }

        public void LogApiRequest(string endpoint, string method, int statusCode, long durationMs, int? userId = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["EventType"] = "ApiRequest";
            properties["Endpoint"] = endpoint;
            properties["Method"] = method;
            properties["StatusCode"] = statusCode.ToString();
            
            if (userId.HasValue)
                properties["UserId"] = userId.Value.ToString();

            var metrics = new Dictionary<string, double>
            {
                ["DurationMs"] = durationMs
            };

            var logData = new
            {
                Endpoint = endpoint,
                Method = method,
                StatusCode = statusCode,
                DurationMs = durationMs,
                UserId = userId,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId(),
                UserAgent = GetUserAgent(),
                IpAddress = GetClientIpAddress()
            };

            _logger.LogInformation("API Request: {Method} {Endpoint} - {StatusCode} ({DurationMs}ms)", 
                method, endpoint, statusCode, durationMs);
            
            _telemetryClient.TrackEvent("ApiRequest", properties, metrics);
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Information);
        }

        public void LogError(Exception exception, string context, object? additionalData = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["Context"] = context;
            properties["ExceptionType"] = exception.GetType().Name;

            var logData = new
            {
                Context = context,
                Exception = new
                {
                    Type = exception.GetType().Name,
                    Message = exception.Message,
                    StackTrace = exception.StackTrace,
                    InnerException = exception.InnerException?.Message
                },
                AdditionalData = additionalData,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId()
            };

            _logger.LogError(exception, "Error in {Context}: {Message}", context, exception.Message);
            _telemetryClient.TrackException(exception, properties, CreateMetrics(additionalData));
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Error);
        }

        public void LogWarning(string message, object? data = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["LogLevel"] = "Warning";

            var logData = new
            {
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId()
            };

            _logger.LogWarning(message);
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Warning);
        }

        public void LogInformation(string message, object? data = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["LogLevel"] = "Information";

            var logData = new
            {
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId()
            };

            _logger.LogInformation(message);
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Information);
        }

        public void LogDebug(string message, object? data = null, string? correlationId = null)
        {
            var properties = CreateBaseProperties(correlationId);
            properties["LogLevel"] = "Debug";

            var logData = new
            {
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId ?? GetCorrelationId()
            };

            _logger.LogDebug(message);
            _telemetryClient.TrackTrace(JsonSerializer.Serialize(logData), SeverityLevel.Verbose);
        }

        private Dictionary<string, string> CreateBaseProperties(string? correlationId = null)
        {
            return new Dictionary<string, string>
            {
                ["Environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                ["MachineName"] = Environment.MachineName,
                ["ApplicationName"] = "NetworkingApp",
                ["CorrelationId"] = correlationId ?? GetCorrelationId(),
                ["Timestamp"] = DateTime.UtcNow.ToString("O")
            };
        }

        private Dictionary<string, double> CreateMetrics(object? data)
        {
            var metrics = new Dictionary<string, double>();
            
            if (data != null)
            {
                try
                {
                    var json = JsonSerializer.Serialize(data);
                    metrics["DataSizeBytes"] = System.Text.Encoding.UTF8.GetByteCount(json);
                }
                catch
                {
                    metrics["DataSizeBytes"] = 0;
                }
            }

            return metrics;
        }

        private string GetCorrelationId()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context?.TraceIdentifier != null)
                return context.TraceIdentifier;

            return Activity.Current?.Id ?? Guid.NewGuid().ToString();
        }

        private string? GetUserAgent()
        {
            return _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString();
        }

        private string? GetClientIpAddress()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Check for X-Forwarded-For header (in case of load balancer/proxy)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
                return forwardedFor.Split(',')[0].Trim();

            // Check for X-Real-IP header
            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
                return realIp;

            // Fall back to connection remote IP
            return context.Connection.RemoteIpAddress?.ToString();
        }
    }
}
