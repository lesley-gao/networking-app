using System.Text.Json.Serialization;

namespace NetworkingApp.Models
{
    public class ErrorResponse
    {
        [JsonPropertyName("error")]
        public ErrorDetail Error { get; set; } = new();

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        [JsonPropertyName("traceId")]
        public string TraceId { get; set; } = string.Empty;
    }

    public class ErrorDetail
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("details")]
        public string? Details { get; set; }

        [JsonPropertyName("validationErrors")]
        public Dictionary<string, string[]>? ValidationErrors { get; set; }
    }

    public class ValidationErrorResponse : ErrorResponse
    {
        public ValidationErrorResponse(Dictionary<string, string[]> validationErrors)
        {
            Error = new ErrorDetail
            {
                Code = "VALIDATION_FAILED",
                Message = "One or more validation errors occurred.",
                ValidationErrors = validationErrors
            };
        }
    }
}