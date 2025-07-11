using NetworkingApp.Models;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace NetworkingApp.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public ErrorHandlingMiddleware(
            RequestDelegate next,
            ILogger<ErrorHandlingMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred. TraceId: {TraceId}", context.TraceIdentifier);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            var errorResponse = new ErrorResponse
            {
                Path = context.Request.Path,
                TraceId = context.TraceIdentifier
            };

            switch (exception)
            {
                case ApiException apiEx:
                    response.StatusCode = (int)apiEx.StatusCode;
                    errorResponse.Error = new ErrorDetail
                    {
                        Code = apiEx.ErrorCode,
                        Message = apiEx.Message,
                        Details = _environment.IsDevelopment() ? apiEx.Details : null
                    };
                    break;

                case ArgumentException argEx:
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    errorResponse.Error = new ErrorDetail
                    {
                        Code = "INVALID_ARGUMENT",
                        Message = argEx.Message,
                        Details = _environment.IsDevelopment() ? argEx.StackTrace : null
                    };
                    break;

                case UnauthorizedAccessException:
                    response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    errorResponse.Error = new ErrorDetail
                    {
                        Code = "UNAUTHORIZED",
                        Message = "Authentication required."
                    };
                    break;

                case KeyNotFoundException:
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                    errorResponse.Error = new ErrorDetail
                    {
                        Code = "NOT_FOUND",
                        Message = "The requested resource was not found."
                    };
                    break;

                case InvalidOperationException invalidOpEx:
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    errorResponse.Error = new ErrorDetail
                    {
                        Code = "INVALID_OPERATION",
                        Message = invalidOpEx.Message,
                        Details = _environment.IsDevelopment() ? invalidOpEx.StackTrace : null
                    };
                    break;

                default:
                    response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    errorResponse.Error = new ErrorDetail
                    {
                        Code = "INTERNAL_SERVER_ERROR",
                        Message = _environment.IsDevelopment() 
                            ? exception.Message 
                            : "An internal server error occurred.",
                        Details = _environment.IsDevelopment() ? exception.StackTrace : null
                    };
                    break;
            }

            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = _environment.IsDevelopment()
            });

            await response.WriteAsync(jsonResponse);
        }
    }
}