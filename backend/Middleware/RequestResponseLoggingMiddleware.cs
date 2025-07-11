using Microsoft.AspNetCore.Http;
using NetworkingApp.Services;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace NetworkingApp.Middleware
{
    /// <summary>
    /// Request/Response logging middleware with structured logging
    /// Automatically captures API requests, responses, and performance metrics
    /// </summary>
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;
        private readonly HashSet<string> _sensitiveHeaders;
        private readonly HashSet<string> _excludedPaths;

        public RequestResponseLoggingMiddleware(
            RequestDelegate next,
            IServiceProvider serviceProvider,
            ILogger<RequestResponseLoggingMiddleware> logger)
        {
            _next = next;
            _serviceProvider = serviceProvider;
            _logger = logger;
            
            // Headers that should not be logged for security reasons
            _sensitiveHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Authorization",
                "Cookie",
                "Set-Cookie",
                "X-API-Key",
                "X-Auth-Token",
                "Authentication"
            };

            // Paths that should be excluded from detailed logging
            _excludedPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "/health",
                "/healthcheck",
                "/ping",
                "/metrics",
                "/favicon.ico"
            };
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip logging for excluded paths
            if (_excludedPaths.Any(path => context.Request.Path.StartsWithSegments(path)))
            {
                await _next(context);
                return;
            }

            // Get the scoped logging service from the request scope
            using var scope = _serviceProvider.CreateScope();
            var loggingService = scope.ServiceProvider.GetRequiredService<IStructuredLoggingService>();

            var stopwatch = Stopwatch.StartNew();
            var correlationId = GetOrCreateCorrelationId(context);
            var userId = GetUserId(context);

            // Capture request details
            var requestDetails = await CaptureRequestAsync(context, correlationId);

            // Capture original response body stream
            var originalBodyStream = context.Response.Body;

            try
            {
                using var responseBodyStream = new MemoryStream();
                context.Response.Body = responseBodyStream;

                // Execute the next middleware
                await _next(context);

                stopwatch.Stop();

                // Capture response details
                var responseDetails = await CaptureResponseAsync(context, responseBodyStream, correlationId);

                // Copy response back to original stream
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                await responseBodyStream.CopyToAsync(originalBodyStream);

                // Log the complete request/response cycle
                LogRequestResponse(requestDetails, responseDetails, stopwatch.ElapsedMilliseconds, userId, correlationId, loggingService);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                // Log the error
                loggingService.LogError(ex, "RequestResponseMiddleware", new
                {
                    RequestPath = context.Request.Path,
                    RequestMethod = context.Request.Method,
                    UserId = userId,
                    DurationMs = stopwatch.ElapsedMilliseconds
                }, correlationId);

                // Restore original response stream
                context.Response.Body = originalBodyStream;
                throw;
            }
        }

        private async Task<RequestDetails> CaptureRequestAsync(HttpContext context, string correlationId)
        {
            var request = context.Request;
            
            // Enable buffering to allow multiple reads of the request body
            request.EnableBuffering();

            var requestBody = string.Empty;
            if (request.ContentLength > 0 && request.ContentLength < 1024 * 1024) // Limit to 1MB
            {
                request.Body.Position = 0;
                using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                request.Body.Position = 0;
            }

            var headers = request.Headers
                .Where(h => !_sensitiveHeaders.Contains(h.Key))
                .ToDictionary(h => h.Key, h => h.Value.ToString());

            return new RequestDetails
            {
                Method = request.Method,
                Path = request.Path,
                QueryString = request.QueryString.ToString(),
                Headers = headers,
                Body = requestBody,
                ContentType = request.ContentType,
                ContentLength = request.ContentLength,
                UserAgent = request.Headers["User-Agent"].ToString(),
                IpAddress = GetClientIpAddress(context),
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId
            };
        }

        private async Task<ResponseDetails> CaptureResponseAsync(HttpContext context, MemoryStream responseBodyStream, string correlationId)
        {
            var response = context.Response;
            
            var responseBody = string.Empty;
            if (responseBodyStream.Length > 0 && responseBodyStream.Length < 1024 * 1024) // Limit to 1MB
            {
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                using var reader = new StreamReader(responseBodyStream, Encoding.UTF8, leaveOpen: true);
                responseBody = await reader.ReadToEndAsync();
            }

            var headers = response.Headers
                .Where(h => !_sensitiveHeaders.Contains(h.Key))
                .ToDictionary(h => h.Key, h => h.Value.ToString());

            return new ResponseDetails
            {
                StatusCode = response.StatusCode,
                Headers = headers,
                Body = responseBody,
                ContentType = response.ContentType,
                ContentLength = responseBodyStream.Length,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId
            };
        }

        private void LogRequestResponse(RequestDetails request, ResponseDetails response, long durationMs, int? userId, string correlationId, IStructuredLoggingService loggingService)
        {
            // Log API request metrics
            loggingService.LogApiRequest(
                request.Path,
                request.Method,
                response.StatusCode,
                durationMs,
                userId,
                correlationId
            );

            // Log performance metrics
            loggingService.LogPerformanceMetric("ApiRequestDuration", durationMs, new Dictionary<string, string>
            {
                ["Endpoint"] = request.Path,
                ["Method"] = request.Method,
                ["StatusCode"] = response.StatusCode.ToString()
            });

            // Log detailed request/response for debugging (only in development)
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                var logData = new
                {
                    Request = request,
                    Response = new
                    {
                        response.StatusCode,
                        response.ContentType,
                        response.ContentLength,
                        response.Headers,
                        Body = TruncateString(response.Body, 1000) // Truncate for readability
                    },
                    DurationMs = durationMs,
                    UserId = userId
                };

                loggingService.LogDebug("Request/Response Details", logData, correlationId);
            }

            // Log warnings for slow requests
            if (durationMs > 5000) // Requests taking longer than 5 seconds
            {
                loggingService.LogWarning($"Slow API request detected: {request.Method} {request.Path} took {durationMs}ms", 
                    new { DurationMs = durationMs, UserId = userId }, correlationId);
            }

            // Log errors for 4xx and 5xx responses
            if (response.StatusCode >= 400)
            {
                var logLevel = response.StatusCode >= 500 ? "Error" : "Warning";
                var message = $"HTTP {response.StatusCode} response for {request.Method} {request.Path}";
                
                if (logLevel == "Error")
                {
                    loggingService.LogError(new HttpRequestException(message), "RequestResponseMiddleware", 
                        new { StatusCode = response.StatusCode, UserId = userId }, correlationId);
                }
                else
                {
                    loggingService.LogWarning(message, 
                        new { StatusCode = response.StatusCode, UserId = userId }, correlationId);
                }
            }
        }

        private string GetOrCreateCorrelationId(HttpContext context)
        {
            // Check if correlation ID already exists in headers
            var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault();
            
            if (string.IsNullOrEmpty(correlationId))
            {
                correlationId = context.TraceIdentifier ?? Guid.NewGuid().ToString();
            }

            // Add correlation ID to response headers
            context.Response.Headers["X-Correlation-ID"] = correlationId;

            return correlationId;
        }

        private int? GetUserId(HttpContext context)
        {
            var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        private string? GetClientIpAddress(HttpContext context)
        {
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

        private static string TruncateString(string input, int maxLength)
        {
            if (string.IsNullOrEmpty(input) || input.Length <= maxLength)
                return input;

            return input.Substring(0, maxLength) + "...";
        }
    }

    public class RequestDetails
    {
        public string Method { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string? QueryString { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new();
        public string Body { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long? ContentLength { get; set; }
        public string? UserAgent { get; set; }
        public string? IpAddress { get; set; }
        public DateTime Timestamp { get; set; }
        public string CorrelationId { get; set; } = string.Empty;
    }

    public class ResponseDetails
    {
        public int StatusCode { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new();
        public string Body { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long ContentLength { get; set; }
        public DateTime Timestamp { get; set; }
        public string CorrelationId { get; set; } = string.Empty;
    }
}
