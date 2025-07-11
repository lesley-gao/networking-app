using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Services;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace NetworkingApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VerificationController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IEmailService _emailService;
        // TODO: Inject Azure Blob Storage service

        public VerificationController(ApplicationDbContext db, IEmailService emailService)
        {
            _db = db;
            _emailService = emailService;
        }

        /// <summary>
        /// Uploads a verification document for the current user.
        /// </summary>
        [HttpPost("upload")]
        [Authorize]
        public async Task<IActionResult> UploadDocument([FromForm] IFormFile file)
        {
            // TODO: Save file to Azure Blob Storage, store metadata in DB
            // For now, just return NotImplemented
            await Task.CompletedTask; // Placeholder for async operation
            return StatusCode(501, "Document upload not yet implemented.");
        }

        /// <summary>
        /// Gets the current user's verification status and document info.
        /// </summary>
        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> GetStatus()
        {
            // TODO: Return verification status and document info for current user
            await Task.CompletedTask; // Placeholder for async operation
            return StatusCode(501, "Verification status not yet implemented.");
        }

        /// <summary>
        /// Admin: Lists all pending verification documents.
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ListPending()
        {
            // TODO: Return all unapproved/unrejected documents
            await Task.CompletedTask; // Placeholder for async operation
            return StatusCode(501, "Pending list not yet implemented.");
        }

        /// <summary>
        /// Admin: Approves or rejects a verification document.
        /// </summary>
        [HttpPost("review/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Review(int id, [FromBody] VerificationReviewDto dto)
        {
            // TODO: Approve/reject document, notify user
            await Task.CompletedTask; // Placeholder for async operation
            return StatusCode(501, "Review not yet implemented.");
        }
    }

    public class VerificationReviewDto
    {
        public bool Approve { get; set; }
        public string? Comment { get; set; }
    }
}
