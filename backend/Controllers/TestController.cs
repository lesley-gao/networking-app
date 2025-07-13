#if DEBUG
using Microsoft.AspNetCore.Mvc;
using NetworkingApp.Models;

namespace NetworkingApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("test-validation")]
        public IActionResult TestValidation([FromQuery] string? requiredParam)
        {
            if (string.IsNullOrEmpty(requiredParam))
            {
                ModelState.AddModelError("requiredParam", "This parameter is required");
            }
            
            return Ok("Validation passed");
        }

        [HttpGet("test-api-exception")]
        public IActionResult TestApiException()
        {
            throw ApiException.NotFound("TestResource", "123");
        }

        [HttpGet("test-generic-exception")]
        public IActionResult TestGenericException()
        {
            throw new InvalidOperationException("This is a test exception");
        }


    }
}
#endif