using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace NetworkingApp.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ILogger<HealthController> _logger;

        public HealthController(ILogger<HealthController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Health check endpoint for monitoring and CI/CD validation
        /// </summary>
        /// <returns>Application health status and basic information</returns>
        [HttpGet]
        public ActionResult<object> GetHealth()
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var version = assembly.GetName().Version?.ToString() ?? "Unknown";
                var buildDate = new FileInfo(assembly.Location).CreationTime;

                var healthStatus = new
                {
                    Status = "Healthy",
                    Timestamp = DateTime.UtcNow,
                    Version = version,
                    BuildDate = buildDate,
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    MachineName = Environment.MachineName,
                    ProcessId = Environment.ProcessId,
                    UpTime = Environment.TickCount64 / 1000, // seconds
                    Framework = Environment.Version.ToString(),
                    Platform = Environment.OSVersion.ToString()
                };

                _logger.LogInformation("Health check requested - Status: {Status}", healthStatus.Status);
                return Ok(healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(500, new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Readiness check for Kubernetes/Docker deployments
        /// </summary>
        /// <returns>Application readiness status</returns>
        [HttpGet("ready")]
        public ActionResult<object> GetReadiness()
        {
            try
            {
                // Add any readiness checks here (database connectivity, external services, etc.)
                // For now, just return ready if the application is running
                
                var readinessStatus = new
                {
                    Status = "Ready",
                    Timestamp = DateTime.UtcNow,
                    Checks = new
                    {
                        Application = "Ready",
                        // Database = "Ready", // Add when database checks are implemented
                        // ExternalServices = "Ready" // Add when external service checks are implemented
                    }
                };

                _logger.LogInformation("Readiness check requested - Status: {Status}", readinessStatus.Status);
                return Ok(readinessStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Readiness check failed");
                return StatusCode(503, new
                {
                    Status = "Not Ready",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Liveness check for Kubernetes/Docker deployments
        /// </summary>
        /// <returns>Application liveness status</returns>
        [HttpGet("live")]
        public ActionResult<object> GetLiveness()
        {
            try
            {
                var livenessStatus = new
                {
                    Status = "Alive",
                    Timestamp = DateTime.UtcNow,
                    MemoryUsage = GC.GetTotalMemory(false),
                    ThreadCount = System.Diagnostics.Process.GetCurrentProcess().Threads.Count
                };

                _logger.LogInformation("Liveness check requested - Status: {Status}", livenessStatus.Status);
                return Ok(livenessStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liveness check failed");
                return StatusCode(500, new
                {
                    Status = "Not Alive",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }
    }
}
