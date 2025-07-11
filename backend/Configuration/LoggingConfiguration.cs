using Serilog;
using Serilog.Events;
using Serilog.Formatting.Json;
using Serilog.Sinks.ApplicationInsights.TelemetryConverters;
using Microsoft.ApplicationInsights.Extensibility;

namespace NetworkingApp.Configuration
{
    /// <summary>
    /// Comprehensive logging configuration with Serilog integration
    /// Provides structured logging to multiple sinks including Application Insights, Console, and File
    /// </summary>
    public static class LoggingConfiguration
    {
        public static IServiceCollection AddComprehensiveLogging(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
        {
            // Configure Serilog
            var loggerConfiguration = new LoggerConfiguration()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Information)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                .MinimumLevel.Override("NetworkingApp", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .Enrich.WithMachineName()
                .Enrich.WithThreadId()
                .Enrich.WithEnvironmentName()
                .Enrich.WithProperty("ApplicationName", "NetworkingApp")
                .Enrich.WithProperty("Environment", environment.EnvironmentName);

            // Console sink with structured output
            if (environment.IsDevelopment())
            {
                loggerConfiguration
                    .MinimumLevel.Debug()
                    .WriteTo.Console(
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj} {Properties:j}{NewLine}{Exception}");
            }
            else
            {
                loggerConfiguration
                    .MinimumLevel.Information()
                    .WriteTo.Console(new JsonFormatter());
            }

            // File sinks for different log levels
            var logPath = configuration["Logging:LogPath"] ?? "logs";
            
            loggerConfiguration
                .WriteTo.File(
                    path: Path.Combine(logPath, "application-.log"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 30,
                    formatter: new JsonFormatter(),
                    restrictedToMinimumLevel: LogEventLevel.Information)
                .WriteTo.File(
                    path: Path.Combine(logPath, "errors-.log"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 60,
                    formatter: new JsonFormatter(),
                    restrictedToMinimumLevel: LogEventLevel.Warning)
                .WriteTo.File(
                    path: Path.Combine(logPath, "security-.log"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 90,
                    formatter: new JsonFormatter(),
                    restrictedToMinimumLevel: LogEventLevel.Warning);

            // Application Insights sink if configured
            var appInsightsConnectionString = configuration.GetConnectionString("ApplicationInsights");
            if (!string.IsNullOrEmpty(appInsightsConnectionString) && appInsightsConnectionString != "placeholder-will-be-configured-via-keyvault")
            {
                var telemetryConfiguration = TelemetryConfiguration.CreateDefault();
                telemetryConfiguration.ConnectionString = appInsightsConnectionString;

                loggerConfiguration
                    .WriteTo.ApplicationInsights(
                        telemetryConfiguration,
                        new TraceTelemetryConverter(),
                        LogEventLevel.Information);
            }

            // SEQ sink for development (if SEQ_URL is configured and SEQ package is installed)
            var seqUrl = configuration["Logging:SeqUrl"];
            if (!string.IsNullOrEmpty(seqUrl) && environment.IsDevelopment())
            {
                // Note: Requires Serilog.Sinks.Seq package to be installed
                // loggerConfiguration.WriteTo.Seq(seqUrl);
            }

            // Build and configure Serilog
            Log.Logger = loggerConfiguration.CreateLogger();

            // Add Serilog to DI container
            services.AddSerilog(Log.Logger);

            return services;
        }

        public static IServiceCollection AddStructuredLoggingServices(this IServiceCollection services)
        {
            services.AddHttpContextAccessor();
            services.AddScoped<NetworkingApp.Services.IStructuredLoggingService, NetworkingApp.Services.StructuredLoggingService>();
            
            return services;
        }

        public static WebApplication UseComprehensiveLogging(this WebApplication app)
        {
            // Add Serilog request logging middleware
            app.UseSerilogRequestLogging(options =>
            {
                options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
                options.GetLevel = GetLogLevel;
                options.EnrichDiagnosticContext = EnrichFromRequest;
            });

            // Add custom request/response logging middleware
            app.UseMiddleware<NetworkingApp.Middleware.RequestResponseLoggingMiddleware>();

            return app;
        }

        private static LogEventLevel GetLogLevel(HttpContext ctx, double _, Exception? ex)
        {
            if (ex != null)
                return LogEventLevel.Error;

            if (ctx.Response.StatusCode > 499)
                return LogEventLevel.Error;

            if (ctx.Response.StatusCode > 399)
                return LogEventLevel.Warning;

            return LogEventLevel.Information;
        }

        private static void EnrichFromRequest(IDiagnosticContext diagnosticContext, HttpContext httpContext)
        {
            var request = httpContext.Request;

            // Set all the common properties available for every request
            diagnosticContext.Set("Host", request.Host);
            diagnosticContext.Set("Protocol", request.Protocol);
            diagnosticContext.Set("Scheme", request.Scheme);

            // Only set it if available. You're not sending sensitive data in a querystring right?!
            if (request.QueryString.HasValue)
            {
                diagnosticContext.Set("QueryString", request.QueryString.Value);
            }

            // Set the content-type of the Response at this point
            diagnosticContext.Set("ContentType", httpContext.Response.ContentType);

            // Retrieve the IEndpointFeature selected for the request
            var endpoint = httpContext.GetEndpoint();
            if (endpoint is not null)
            {
                diagnosticContext.Set("EndpointName", endpoint.DisplayName);
            }

            // Add user information if available
            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                diagnosticContext.Set("UserId", httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
                diagnosticContext.Set("UserName", httpContext.User.Identity.Name);
            }

            // Add client IP address
            var clientIp = httpContext.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(clientIp))
            {
                diagnosticContext.Set("ClientIP", clientIp);
            }

            // Add user agent
            var userAgent = request.Headers["User-Agent"].ToString();
            if (!string.IsNullOrEmpty(userAgent))
            {
                diagnosticContext.Set("UserAgent", userAgent);
            }

            // Add correlation ID
            var correlationId = request.Headers["X-Correlation-ID"].ToString();
            if (!string.IsNullOrEmpty(correlationId))
            {
                diagnosticContext.Set("CorrelationId", correlationId);
            }
        }
    }
}
