using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace NetworkingApp.Controllers
{
    /// <summary>
    /// Handles user-initiated disputes and admin resolution actions.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DisputeController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        public DisputeController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// User creates a dispute for a payment.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateDispute([FromBody] CreateDisputeRequest req)
        {
            var payment = await _dbContext.Payments.FindAsync(req.PaymentId);
            if (payment == null) return NotFound("Payment not found");
            var dispute = new Dispute
            {
                PaymentId = req.PaymentId,
                RaisedByUserId = req.UserId,
                Reason = req.Reason,
                EvidenceUrl = req.EvidenceUrl,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Disputes.Add(dispute);
            await _dbContext.SaveChangesAsync();
            return Ok(dispute);
        }

        /// <summary>
        /// Get all disputes (admin) or user disputes (user).
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetDisputes([FromQuery] int? userId = null)
        {
            if (User.IsInRole("Admin"))
            {
                var all = await _dbContext.Disputes.Include(d => d.Payment).ToListAsync();
                return Ok(all);
            }
            else if (userId.HasValue)
            {
                var mine = await _dbContext.Disputes.Where(d => d.RaisedByUserId == userId).Include(d => d.Payment).ToListAsync();
                return Ok(mine);
            }
            return Forbid();
        }

        /// <summary>
        /// Admin resolves a dispute (refund, release, reject, add notes).
        /// </summary>
        [HttpPost("resolve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResolveDispute([FromBody] ResolveDisputeRequest req)
        {
            var dispute = await _dbContext.Disputes.Include(d => d.Payment).FirstOrDefaultAsync(d => d.Id == req.DisputeId);
            if (dispute == null) return NotFound("Dispute not found");
            dispute.Status = req.Status;
            dispute.AdminNotes = req.AdminNotes;
            dispute.ResolvedByAdminId = req.AdminId;
            dispute.ResolvedAt = DateTime.UtcNow;
            // Optionally update payment/escrow status here
            await _dbContext.SaveChangesAsync();
            return Ok(dispute);
        }

        public class CreateDisputeRequest
        {
            public int PaymentId { get; set; }
            public int UserId { get; set; }
            public string Reason { get; set; } = string.Empty;
            public string? EvidenceUrl { get; set; }
        }
        public class ResolveDisputeRequest
        {
            public int DisputeId { get; set; }
            public string Status { get; set; } = "Resolved"; // Resolved, Refunded, Rejected
            public string? AdminNotes { get; set; }
            public int AdminId { get; set; }
        }
    }
}
