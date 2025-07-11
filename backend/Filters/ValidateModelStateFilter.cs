using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using NetworkingApp.Models;
using System.Text.Json;

namespace NetworkingApp.Filters
{
    public class ValidateModelStateFilter : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var validationErrors = context.ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(x => x.ErrorMessage).ToArray() ?? Array.Empty<string>()
                    );

                var errorResponse = new ValidationErrorResponse(validationErrors)
                {
                    Path = context.HttpContext.Request.Path,
                    TraceId = context.HttpContext.TraceIdentifier
                };

                context.Result = new BadRequestObjectResult(errorResponse);
            }
        }
    }
}