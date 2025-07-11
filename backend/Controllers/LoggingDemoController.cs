using Microsoft.AspNetCore.Mvc;
using NetworkingApp.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace NetworkingApp.Controllers
{
    /// <summary>
    /// Sample controller demonstrating comprehensive structured logging patterns
    /// Shows how to integrate IStructuredLoggingService throughout the application
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class LoggingDemoController : ControllerBase
    {
        private readonly IStructuredLoggingService _loggingService;
        private readonly ILogger<LoggingDemoController> _logger;

        public LoggingDemoController(
            IStructuredLoggingService loggingService,
            ILogger<LoggingDemoController> logger)
        {
            _loggingService = loggingService;
            _logger = logger;
        }

        /// <summary>
        /// Demonstrates user action logging
        /// </summary>
        [HttpPost("user-action")]
        [Authorize]
        public IActionResult LogUserAction([FromBody] UserActionRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            _loggingService.LogUserAction(
                action: request.Action,
                userId: userId,
                additionalData: new { 
                    request.Details,
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
                }
            );

            return Ok(new { Message = "User action logged successfully" });
        }

        /// <summary>
        /// Demonstrates security event logging
        /// </summary>
        [HttpPost("security-event")]
        public IActionResult LogSecurityEvent([FromBody] SecurityEventRequest request)
        {
            var userId = User.Identity?.IsAuthenticated == true 
                ? int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0") 
                : (int?)null;

            _loggingService.LogSecurityEvent(
                eventType: request.EventType,
                userId: userId,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                details: new {
                    request.Description,
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    Timestamp = DateTime.UtcNow,
                    Severity = request.Severity
                }
            );

            return Ok(new { Message = "Security event logged successfully" });
        }

        /// <summary>
        /// Demonstrates payment event logging
        /// </summary>
        [HttpPost("payment-event")]
        [Authorize]
        public IActionResult LogPaymentEvent([FromBody] PaymentEventRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            _loggingService.LogPaymentEvent(
                eventType: request.EventType,
                userId: userId,
                amount: request.Amount,
                paymentId: request.PaymentId,
                details: new {
                    request.Currency,
                    request.Description,
                    PaymentMethod = request.PaymentMethod,
                    TransactionReference = request.TransactionReference
                }
            );

            return Ok(new { Message = "Payment event logged successfully" });
        }

        /// <summary>
        /// Demonstrates matching event logging
        /// </summary>
        [HttpPost("matching-event")]
        [Authorize]
        public IActionResult LogMatchingEvent([FromBody] MatchingEventRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            _loggingService.LogMatchingEvent(
                eventType: request.EventType,
                requestId: request.RequestId,
                offerId: request.OfferId,
                userId: userId,
                details: new {
                    request.MatchScore,
                    request.Algorithm,
                    request.Criteria,
                    ProcessingTimeMs = request.ProcessingTimeMs
                }
            );

            return Ok(new { Message = "Matching event logged successfully" });
        }

        /// <summary>
        /// Demonstrates performance metric logging
        /// </summary>
        [HttpPost("performance-metric")]
        public IActionResult LogPerformanceMetric([FromBody] PerformanceMetricRequest request)
        {
            _loggingService.LogPerformanceMetric(
                metricName: request.MetricName,
                value: request.Value,
                properties: request.Properties
            );

            return Ok(new { Message = "Performance metric logged successfully" });
        }

        /// <summary>
        /// Demonstrates business event logging
        /// </summary>
        [HttpPost("business-event")]
        [Authorize]
        public IActionResult LogBusinessEvent([FromBody] BusinessEventRequest request)
        {
            _loggingService.LogBusinessEvent(
                eventName: request.EventName,
                businessData: new {
                    request.Category,
                    request.Data,
                    UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                    Timestamp = DateTime.UtcNow
                }
            );

            return Ok(new { Message = "Business event logged successfully" });
        }

        /// <summary>
        /// Demonstrates error logging with exception handling
        /// </summary>
        [HttpPost("simulate-error")]
        public IActionResult SimulateError([FromBody] ErrorSimulationRequest request)
        {
            try
            {
                // Simulate different types of errors based on request type
                switch (request.ErrorType.ToLower())
                {
                    case "validation":
                        throw new ArgumentException($"Validation error: {request.Message}");
                    case "notfound":
                        throw new KeyNotFoundException($"Resource not found: {request.Message}");
                    case "unauthorized":
                        throw new UnauthorizedAccessException($"Unauthorized access: {request.Message}");
                    case "system":
                        throw new SystemException($"System error: {request.Message}");
                    default:
                        throw new Exception($"Generic error: {request.Message}");
                }
            }
            catch (Exception ex)
            {
                _loggingService.LogError(
                    ex,
                    "LoggingDemoController.SimulateError",
                    new {
                        request.ErrorType,
                        request.Message,
                        UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                        RequestPath = Request.Path.Value
                    }
                );

                return StatusCode(500, new { 
                    Message = "Error logged successfully", 
                    ErrorType = request.ErrorType,
                    Exception = ex.GetType().Name
                });
            }
        }

        /// <summary>
        /// Demonstrates information logging
        /// </summary>
        [HttpPost("information")]
        public IActionResult LogInformation([FromBody] InformationLogRequest request)
        {
            _loggingService.LogInformation(
                request.Message,
                new {
                    request.Category,
                    request.Data,
                    UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                }
            );

            return Ok(new { Message = "Information logged successfully" });
        }

        /// <summary>
        /// Demonstrates warning logging
        /// </summary>
        [HttpPost("warning")]
        public IActionResult LogWarning([FromBody] WarningLogRequest request)
        {
            _loggingService.LogWarning(
                request.Message,
                new {
                    request.Severity,
                    request.Category,
                    request.Data,
                    UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                }
            );

            return Ok(new { Message = "Warning logged successfully" });
        }

        /// <summary>
        /// Demonstrates debug logging (only in development)
        /// </summary>
        [HttpPost("debug")]
        public IActionResult LogDebug([FromBody] DebugLogRequest request)
        {
            _loggingService.LogDebug(
                request.Message,
                new {
                    request.Component,
                    request.Data,
                    request.DebugInfo,
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                }
            );

            return Ok(new { Message = "Debug information logged successfully" });
        }
    }

    // Request DTOs for logging demo endpoints
    public class UserActionRequest
    {
        public string Action { get; set; } = string.Empty;
        public object? Details { get; set; }
    }

    public class SecurityEventRequest
    {
        public string EventType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = "Medium";
    }

    public class PaymentEventRequest
    {
        public string EventType { get; set; } = string.Empty;
        public decimal? Amount { get; set; }
        public string? PaymentId { get; set; }
        public string Currency { get; set; } = "NZD";
        public string Description { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? TransactionReference { get; set; }
    }

    public class MatchingEventRequest
    {
        public string EventType { get; set; } = string.Empty;
        public int? RequestId { get; set; }
        public int? OfferId { get; set; }
        public double? MatchScore { get; set; }
        public string Algorithm { get; set; } = string.Empty;
        public object? Criteria { get; set; }
        public long ProcessingTimeMs { get; set; }
    }

    public class PerformanceMetricRequest
    {
        public string MetricName { get; set; } = string.Empty;
        public double Value { get; set; }
        public Dictionary<string, string>? Properties { get; set; }
    }

    public class BusinessEventRequest
    {
        public string EventName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public object? Data { get; set; }
    }

    public class ErrorSimulationRequest
    {
        public string ErrorType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class InformationLogRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public object? Data { get; set; }
    }

    public class WarningLogRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public object? Data { get; set; }
    }

    public class DebugLogRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Component { get; set; } = string.Empty;
        public object? Data { get; set; }
        public object? DebugInfo { get; set; }
    }
}
