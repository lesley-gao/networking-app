using System.Net;

namespace NetworkingApp.Models
{
    public class ApiException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public string ErrorCode { get; }
        public string? Details { get; }

        public ApiException(
            HttpStatusCode statusCode,
            string errorCode,
            string message,
            string? details = null,
            Exception? innerException = null)
            : base(message, innerException)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
            Details = details;
        }

        // Common error factory methods
        public static ApiException BadRequest(string message, string? details = null)
            => new(HttpStatusCode.BadRequest, "BAD_REQUEST", message, details);

        public static ApiException NotFound(string resource, string identifier)
            => new(HttpStatusCode.NotFound, "NOT_FOUND", $"{resource} with identifier '{identifier}' was not found.");

        public static ApiException Conflict(string message, string? details = null)
            => new(HttpStatusCode.Conflict, "CONFLICT", message, details);

        public static ApiException Unauthorized(string message = "Authentication required.")
            => new(HttpStatusCode.Unauthorized, "UNAUTHORIZED", message);

        public static ApiException Forbidden(string message = "Access denied.")
            => new(HttpStatusCode.Forbidden, "FORBIDDEN", message);

        public static ApiException InternalServerError(string message = "An internal server error occurred.", string? details = null)
            => new(HttpStatusCode.InternalServerError, "INTERNAL_SERVER_ERROR", message, details);
    }
}