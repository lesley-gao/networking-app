using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;
using System.Collections.Generic;

namespace NetworkingApp.Services
{
    /// <summary>
    /// Service for tracking custom telemetry and application-specific metrics
    /// </summary>
    public interface ITelemetryService
    {
        void TrackUserEvent(string eventName, string userId, Dictionary<string, string>? properties = null);
        void TrackMatchingEvent(string eventName, string requestId, string? offerId = null, Dictionary<string, string>? properties = null);
        void TrackPaymentEvent(string eventName, string paymentId, decimal amount, Dictionary<string, string>? properties = null);
        void TrackPerformanceMetric(string metricName, double value, Dictionary<string, string>? properties = null);
        void TrackBusinessMetric(string metricName, double value, Dictionary<string, string>? properties = null);
        void TrackException(Exception exception, Dictionary<string, string>? properties = null);
        void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success);
        void TrackCustomEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null);
        void TrackPageView(string pageName, Dictionary<string, string>? properties = null);
        void TrackRequest(string name, DateTimeOffset startTime, TimeSpan duration, string responseCode, bool success);
    }

    /// <summary>
    /// Implementation of telemetry service using Application Insights
    /// </summary>
    public class ApplicationInsightsTelemetryService : ITelemetryService
    {
        private readonly TelemetryClient _telemetryClient;
        private readonly ILogger<ApplicationInsightsTelemetryService> _logger;

        public ApplicationInsightsTelemetryService(
            TelemetryClient telemetryClient,
            ILogger<ApplicationInsightsTelemetryService> logger)
        {
            _telemetryClient = telemetryClient ?? throw new ArgumentNullException(nameof(telemetryClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public void TrackUserEvent(string eventName, string userId, Dictionary<string, string>? properties = null)
        {
            var eventProperties = new Dictionary<string, string>
            {
                ["UserId"] = userId,
                ["EventCategory"] = "User"
            };

            if (properties != null)
            {
                foreach (var property in properties)
                {
                    eventProperties[property.Key] = property.Value;
                }
            }

            _telemetryClient.TrackEvent(eventName, eventProperties);
            _logger.LogInformation("User event tracked: {EventName} for user {UserId}", eventName, userId);
        }

        public void TrackMatchingEvent(string eventName, string requestId, string? offerId = null, Dictionary<string, string>? properties = null)
        {
            var eventProperties = new Dictionary<string, string>
            {
                ["RequestId"] = requestId,
                ["EventCategory"] = "Matching"
            };

            if (!string.IsNullOrEmpty(offerId))
            {
                eventProperties["OfferId"] = offerId;
            }

            if (properties != null)
            {
                foreach (var property in properties)
                {
                    eventProperties[property.Key] = property.Value;
                }
            }

            _telemetryClient.TrackEvent(eventName, eventProperties);
            _logger.LogInformation("Matching event tracked: {EventName} for request {RequestId}", eventName, requestId);
        }

        public void TrackPaymentEvent(string eventName, string paymentId, decimal amount, Dictionary<string, string>? properties = null)
        {
            var eventProperties = new Dictionary<string, string>
            {
                ["PaymentId"] = paymentId,
                ["EventCategory"] = "Payment"
            };

            var eventMetrics = new Dictionary<string, double>
            {
                ["Amount"] = (double)amount
            };

            if (properties != null)
            {
                foreach (var property in properties)
                {
                    eventProperties[property.Key] = property.Value;
                }
            }

            _telemetryClient.TrackEvent(eventName, eventProperties, eventMetrics);
            _logger.LogInformation("Payment event tracked: {EventName} for payment {PaymentId} with amount {Amount}", 
                eventName, paymentId, amount);
        }

        public void TrackPerformanceMetric(string metricName, double value, Dictionary<string, string>? properties = null)
        {
            _telemetryClient.TrackMetric(metricName, value, properties);
            _logger.LogDebug("Performance metric tracked: {MetricName} = {Value}", metricName, value);
        }

        public void TrackBusinessMetric(string metricName, double value, Dictionary<string, string>? properties = null)
        {
            var metricProperties = new Dictionary<string, string>
            {
                ["MetricCategory"] = "Business"
            };

            if (properties != null)
            {
                foreach (var property in properties)
                {
                    metricProperties[property.Key] = property.Value;
                }
            }

            _telemetryClient.TrackMetric(metricName, value, metricProperties);
            _logger.LogInformation("Business metric tracked: {MetricName} = {Value}", metricName, value);
        }

        public void TrackException(Exception exception, Dictionary<string, string>? properties = null)
        {
            var exceptionTelemetry = new ExceptionTelemetry(exception);

            if (properties != null)
            {
                foreach (var property in properties)
                {
                    exceptionTelemetry.Properties[property.Key] = property.Value;
                }
            }

            _telemetryClient.TrackException(exceptionTelemetry);
            _logger.LogError(exception, "Exception tracked in telemetry");
        }

        public void TrackDependency(string dependencyName, string commandName, DateTimeOffset startTime, TimeSpan duration, bool success)
        {
            var dependencyTelemetry = new DependencyTelemetry
            {
                Type = dependencyName,
                Name = commandName,
                Timestamp = startTime,
                Duration = duration,
                Success = success
            };
            _telemetryClient.TrackDependency(dependencyTelemetry);
            _logger.LogDebug("Dependency tracked: {DependencyName}.{CommandName} - Duration: {Duration}ms, Success: {Success}", 
                dependencyName, commandName, duration.TotalMilliseconds, success);
        }

        public void TrackCustomEvent(string eventName, Dictionary<string, string>? properties = null, Dictionary<string, double>? metrics = null)
        {
            _telemetryClient.TrackEvent(eventName, properties, metrics);
            _logger.LogDebug("Custom event tracked: {EventName}", eventName);
        }

        public void TrackPageView(string pageName, Dictionary<string, string>? properties = null)
        {
            _telemetryClient.TrackPageView(pageName);
            
            if (properties != null)
            {
                foreach (var property in properties)
                {
                    _telemetryClient.Context.GlobalProperties[property.Key] = property.Value;
                }
            }

            _logger.LogDebug("Page view tracked: {PageName}", pageName);
        }

        public void TrackRequest(string name, DateTimeOffset startTime, TimeSpan duration, string responseCode, bool success)
        {
            var requestTelemetry = new RequestTelemetry(name, startTime, duration, responseCode, success);
            _telemetryClient.TrackRequest(requestTelemetry);
            _logger.LogDebug("Request tracked: {RequestName} - Duration: {Duration}ms, Success: {Success}", 
                name, duration.TotalMilliseconds, success);
        }
    }

    /// <summary>
    /// Extension methods for common telemetry scenarios
    /// </summary>
    public static class TelemetryServiceExtensions
    {
        public static void TrackFlightCompanionRequest(this ITelemetryService telemetryService, string userId, string requestId)
        {
            telemetryService.TrackUserEvent("FlightCompanionRequestCreated", userId, new Dictionary<string, string>
            {
                ["RequestId"] = requestId,
                ["ServiceType"] = "FlightCompanion"
            });
        }

        public static void TrackPickupRequest(this ITelemetryService telemetryService, string userId, string requestId)
        {
            telemetryService.TrackUserEvent("PickupRequestCreated", userId, new Dictionary<string, string>
            {
                ["RequestId"] = requestId,
                ["ServiceType"] = "Pickup"
            });
        }

        public static void TrackSuccessfulMatch(this ITelemetryService telemetryService, string requestId, string offerId, string serviceType)
        {
            telemetryService.TrackMatchingEvent("MatchConfirmed", requestId, offerId, new Dictionary<string, string>
            {
                ["ServiceType"] = serviceType,
                ["MatchStatus"] = "Confirmed"
            });
        }

        public static void TrackUserRegistration(this ITelemetryService telemetryService, string userId, string registrationMethod)
        {
            telemetryService.TrackUserEvent("UserRegistered", userId, new Dictionary<string, string>
            {
                ["RegistrationMethod"] = registrationMethod
            });
        }

        public static void TrackUserVerification(this ITelemetryService telemetryService, string userId, bool verified)
        {
            telemetryService.TrackUserEvent("UserVerificationStatusChanged", userId, new Dictionary<string, string>
            {
                ["VerificationStatus"] = verified ? "Verified" : "Pending",
                ["EventType"] = "Verification"
            });
        }

        public static void TrackPaymentTransaction(this ITelemetryService telemetryService, string paymentId, decimal amount, string currency, string status)
        {
            telemetryService.TrackPaymentEvent("PaymentProcessed", paymentId, amount, new Dictionary<string, string>
            {
                ["Currency"] = currency,
                ["Status"] = status
            });
        }

        public static void TrackDisputeCreated(this ITelemetryService telemetryService, string disputeId, string userId, string reason)
        {
            telemetryService.TrackUserEvent("DisputeCreated", userId, new Dictionary<string, string>
            {
                ["DisputeId"] = disputeId,
                ["Reason"] = reason,
                ["EventCategory"] = "Dispute"
            });
        }

        public static void TrackEmergencyContact(this ITelemetryService telemetryService, string userId, string emergencyType)
        {
            telemetryService.TrackUserEvent("EmergencyContactUsed", userId, new Dictionary<string, string>
            {
                ["EmergencyType"] = emergencyType,
                ["EventCategory"] = "Emergency",
                ["Priority"] = "High"
            });
        }
    }
}
