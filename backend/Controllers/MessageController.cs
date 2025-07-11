// Controllers/MessageController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace NetworkingApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MessageController> _logger;
        private readonly INotificationService _notificationService; // Add notification service

        public MessageController(ApplicationDbContext context, ILogger<MessageController> logger, INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        // GET: api/Message/conversations
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<ConversationSummaryResponse>>> GetConversations()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var conversations = await _context.Messages
                    .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                    .GroupBy(m => m.ThreadId ?? GenerateThreadId(m.SenderId, m.ReceiverId))
                    .Select(g => new
                    {
                        ThreadId = g.Key,
                        LastMessage = g.OrderByDescending(m => m.CreatedAt).First(),
                        UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead),
                        OtherUserId = g.First().SenderId == userId ? g.First().ReceiverId : g.First().SenderId
                    })
                    .ToListAsync();

                var result = new List<ConversationSummaryResponse>();

                foreach (var conv in conversations)
                {
                    var otherUser = await _context.Users.FindAsync(conv.OtherUserId);
                    if (otherUser != null)
                    {
                        result.Add(new ConversationSummaryResponse
                        {
                            ThreadId = conv.ThreadId,
                            OtherUser = new ConversationUserResponse
                            {
                                Id = otherUser.Id,
                                FirstName = otherUser.FirstName,
                                LastName = otherUser.LastName,
                                IsVerified = otherUser.IsVerified,
                                Rating = otherUser.Rating,
                                PreferredLanguage = otherUser.PreferredLanguage
                            },
                            LastMessage = new MessageResponse
                            {
                                Id = conv.LastMessage.Id,
                                Content = conv.LastMessage.Content,
                                Type = conv.LastMessage.Type,
                                IsRead = conv.LastMessage.IsRead,
                                CreatedAt = conv.LastMessage.CreatedAt,
                                SenderId = conv.LastMessage.SenderId,
                                ReceiverId = conv.LastMessage.ReceiverId
                            },
                            UnreadCount = conv.UnreadCount,
                            LastActivity = conv.LastMessage.CreatedAt
                        });
                    }
                }

                return Ok(result.OrderByDescending(c => c.LastActivity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving conversations for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { Message = "An error occurred while retrieving conversations" });
            }
        }

        // GET: api/Message/conversation/{threadId}
        [HttpGet("conversation/{threadId}")]
        public async Task<ActionResult<ConversationResponse>> GetConversation(string threadId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var messages = await _context.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Receiver)
                    .Where(m => m.ThreadId == threadId && (m.SenderId == userId || m.ReceiverId == userId))
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();

                if (!messages.Any())
                {
                    return NotFound();
                }

                // Mark messages as read
                var unreadMessages = messages.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
                foreach (var message in unreadMessages)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.UtcNow;
                }

                if (unreadMessages.Any())
                {
                    await _context.SaveChangesAsync();
                }

                var otherUserId = messages.First().SenderId == userId ? messages.First().ReceiverId : messages.First().SenderId;
                var otherUser = await _context.Users.FindAsync(otherUserId);

                if (otherUser == null)
                {
                    return NotFound(new { Message = "Other user not found" });
                }

                var response = new ConversationResponse
                {
                    ThreadId = threadId,
                    OtherUser = new ConversationUserResponse
                    {
                        Id = otherUser.Id,
                        FirstName = otherUser.FirstName,
                        LastName = otherUser.LastName,
                        IsVerified = otherUser.IsVerified,
                        Rating = otherUser.Rating,
                        PreferredLanguage = otherUser.PreferredLanguage
                    },
                    Messages = messages.Select(m => new MessageResponse
                    {
                        Id = m.Id,
                        Content = m.Content,
                        Type = m.Type,
                        IsRead = m.IsRead,
                        CreatedAt = m.CreatedAt,
                        ReadAt = m.ReadAt,
                        SenderId = m.SenderId,
                        ReceiverId = m.ReceiverId,
                        RequestId = m.RequestId,
                        RequestType = m.RequestType,
                        ParentMessageId = m.ParentMessageId
                    }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving conversation {ThreadId} for user {UserId}", threadId, GetCurrentUserId());
                return StatusCode(500, new { Message = "An error occurred while retrieving the conversation" });
            }
        }

        // POST: api/Message
        [HttpPost]
        public async Task<ActionResult<MessageResponse>> SendMessage(SendMessageRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // Verify receiver exists and is active
                var receiver = await _context.Users.FindAsync(request.ReceiverId);
                if (receiver == null || !receiver.IsActive)
                {
                    return BadRequest(new { Message = "Invalid receiver" });
                }

                // Prevent self-messaging
                if (userId == request.ReceiverId)
                {
                    return BadRequest(new { Message = "Cannot send message to yourself" });
                }

                // Generate thread ID if not provided
                var threadId = request.ThreadId ?? GenerateThreadId(userId.Value, request.ReceiverId);

                // Validate request context if provided
                if (request.RequestId.HasValue)
                {
                    var hasPermission = await ValidateRequestAccess(userId.Value, request.ReceiverId, request.RequestId.Value, request.RequestType ?? "General");
                    if (!hasPermission)
                    {
                        return BadRequest(new { Message = "You don't have permission to message about this request" });
                    }
                }

                var message = new Message
                {
                    SenderId = userId.Value,
                    ReceiverId = request.ReceiverId,
                    Content = request.Content.Trim(),
                    Type = request.Type ?? "Text",
                    ThreadId = threadId,
                    RequestId = request.RequestId,
                    RequestType = request.RequestType ?? "General",
                    ParentMessageId = request.ParentMessageId,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                // Send real-time notification to receiver
                var sender = await _context.Users.FindAsync(userId);
                if (sender != null)
                {
                    await _notificationService.SendMessageNotificationAsync(
                        request.ReceiverId, 
                        userId.Value, 
                        $"{sender.FirstName} {sender.LastName}",
                        message.Content);
                }

                var response = new MessageResponse
                {
                    Id = message.Id,
                    Content = message.Content,
                    Type = message.Type,
                    IsRead = message.IsRead,
                    CreatedAt = message.CreatedAt,
                    SenderId = message.SenderId,
                    ReceiverId = message.ReceiverId,
                    RequestId = message.RequestId,
                    RequestType = message.RequestType,
                    ThreadId = message.ThreadId,
                    ParentMessageId = message.ParentMessageId
                };

                return CreatedAtAction(nameof(GetMessage), new { id = message.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message from user {SenderId} to user {ReceiverId}", 
                    GetCurrentUserId(), request.ReceiverId);
                return StatusCode(500, new { Message = "An error occurred while sending the message" });
            }
        }

        // GET: api/Message/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MessageResponse>> GetMessage(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var message = await _context.Messages
                    .Where(m => m.Id == id && (m.SenderId == userId || m.ReceiverId == userId))
                    .FirstOrDefaultAsync();

                if (message == null)
                {
                    return NotFound();
                }

                var response = new MessageResponse
                {
                    Id = message.Id,
                    Content = message.Content,
                    Type = message.Type,
                    IsRead = message.IsRead,
                    CreatedAt = message.CreatedAt,
                    ReadAt = message.ReadAt,
                    SenderId = message.SenderId,
                    ReceiverId = message.ReceiverId,
                    RequestId = message.RequestId,
                    RequestType = message.RequestType,
                    ThreadId = message.ThreadId,
                    ParentMessageId = message.ParentMessageId
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving message {MessageId} for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, new { Message = "An error occurred while retrieving the message" });
            }
        }

        // PUT: api/Message/{id}/read
        [HttpPut("{id}/read")]
        public async Task<ActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var message = await _context.Messages
                    .Where(m => m.Id == id && m.ReceiverId == userId)
                    .FirstOrDefaultAsync();

                if (message == null)
                {
                    return NotFound();
                }

                if (!message.IsRead)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new { Message = "Message marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking message {MessageId} as read for user {UserId}", id, GetCurrentUserId());
                return StatusCode(500, new { Message = "An error occurred while updating the message" });
            }
        }

        // PUT: api/Message/conversation/{threadId}/read
        [HttpPut("conversation/{threadId}/read")]
        public async Task<ActionResult> MarkConversationAsRead(string threadId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var messages = await _context.Messages
                    .Where(m => m.ThreadId == threadId && m.ReceiverId == userId && !m.IsRead)
                    .ToListAsync();

                if (messages.Any())
                {
                    var readTime = DateTime.UtcNow;
                    foreach (var message in messages)
                    {
                        message.IsRead = true;
                        message.ReadAt = readTime;
                    }

                    await _context.SaveChangesAsync();
                }

                return Ok(new { Message = $"Marked {messages.Count} messages as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking conversation {ThreadId} as read for user {UserId}", threadId, GetCurrentUserId());
                return StatusCode(500, new { Message = "An error occurred while updating the conversation" });
            }
        }

        // GET: api/Message/unread-count
        [HttpGet("unread-count")]
        public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var unreadCount = await _context.Messages
                    .CountAsync(m => m.ReceiverId == userId && !m.IsRead);

                var unreadConversations = await _context.Messages
                    .Where(m => m.ReceiverId == userId && !m.IsRead)
                    .GroupBy(m => m.ThreadId)
                    .CountAsync();

                return Ok(new UnreadCountResponse
                {
                    TotalUnread = unreadCount,
                    UnreadConversations = unreadConversations
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unread count for user {UserId}", GetCurrentUserId());
                return StatusCode(500, new { Message = "An error occurred while retrieving unread count" });
            }
        }

        // POST: api/Message/initiate/{receiverId}
        [HttpPost("initiate/{receiverId}")]
        public async Task<ActionResult<ConversationInitiateResponse>> InitiateConversation(int receiverId, InitiateConversationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // Verify receiver exists and is active
                var receiver = await _context.Users.FindAsync(receiverId);
                if (receiver == null || !receiver.IsActive)
                {
                    return BadRequest(new { Message = "Invalid receiver" });
                }

                if (userId == receiverId)
                {
                    return BadRequest(new { Message = "Cannot initiate conversation with yourself" });
                }

                // Validate request access if provided
                if (request.RequestId.HasValue)
                {
                    var hasPermission = await ValidateRequestAccess(userId.Value, receiverId, request.RequestId.Value, request.RequestType ?? "General");
                    if (!hasPermission)
                    {
                        return BadRequest(new { Message = "You don't have permission to contact this user about this request" });
                    }
                }

                var threadId = GenerateThreadId(userId.Value, receiverId);

                // Check if conversation already exists
                var existingMessage = await _context.Messages
                    .Where(m => m.ThreadId == threadId)
                    .FirstOrDefaultAsync();

                var response = new ConversationInitiateResponse
                {
                    ThreadId = threadId,
                    OtherUser = new ConversationUserResponse
                    {
                        Id = receiver.Id,
                        FirstName = receiver.FirstName,
                        LastName = receiver.LastName,
                        IsVerified = receiver.IsVerified,
                        Rating = receiver.Rating,
                        PreferredLanguage = receiver.PreferredLanguage
                    },
                    IsNewConversation = existingMessage == null,
                    RequestId = request.RequestId,
                    RequestType = request.RequestType
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating conversation between user {UserId} and user {ReceiverId}", 
                    GetCurrentUserId(), receiverId);
                return StatusCode(500, new { Message = "An error occurred while initiating the conversation" });
            }
        }

        // Helper Methods
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private static string GenerateThreadId(int userId1, int userId2)
        {
            var minId = Math.Min(userId1, userId2);
            var maxId = Math.Max(userId1, userId2);
            return $"thread_{minId}_{maxId}";
        }

        private async Task<bool> ValidateRequestAccess(int userId, int otherUserId, int requestId, string requestType)
        {
            try
            {
                return requestType switch
                {
                    "FlightCompanion" => await ValidateFlightCompanionAccess(userId, otherUserId, requestId),
                    "Pickup" => await ValidatePickupAccess(userId, otherUserId, requestId),
                    _ => false
                };
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> ValidateFlightCompanionAccess(int userId, int otherUserId, int requestId)
        {
            // Check if either user is involved in the request/offer
            var request = await _context.FlightCompanionRequests
                .Include(r => r.MatchedOffer)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request != null)
            {
                if (request.UserId == userId || request.UserId == otherUserId)
                {
                    return true;
                }

                if (request.MatchedOffer != null && 
                    (request.MatchedOffer.UserId == userId || request.MatchedOffer.UserId == otherUserId))
                {
                    return true;
                }
            }

            // Check offers
            var offer = await _context.FlightCompanionOffers
                .Include(o => o.MatchedRequests)
                .FirstOrDefaultAsync(o => o.Id == requestId);

            if (offer != null)
            {
                if (offer.UserId == userId || offer.UserId == otherUserId)
                {
                    return true;
                }

                if (offer.MatchedRequests.Any(r => r.UserId == userId || r.UserId == otherUserId))
                {
                    return true;
                }
            }

            return false;
        }

        private async Task<bool> ValidatePickupAccess(int userId, int otherUserId, int requestId)
        {
            // Similar validation for pickup requests/offers
            var request = await _context.PickupRequests
                .Include(r => r.MatchedOffer)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request != null)
            {
                if (request.UserId == userId || request.UserId == otherUserId)
                {
                    return true;
                }

                if (request.MatchedOffer != null && 
                    (request.MatchedOffer.UserId == userId || request.MatchedOffer.UserId == otherUserId))
                {
                    return true;
                }
            }

            var offer = await _context.PickupOffers
                .Include(o => o.MatchedRequests)
                .FirstOrDefaultAsync(o => o.Id == requestId);

            if (offer != null)
            {
                if (offer.UserId == userId || offer.UserId == otherUserId)
                {
                    return true;
                }

                if (offer.MatchedRequests.Any(r => r.UserId == userId || r.UserId == otherUserId))
                {
                    return true;
                }
            }

            return false;
        }
    }

    // DTOs for API requests and responses
    public class SendMessageRequest
    {
        [Required]
        public int ReceiverId { get; set; }

        [Required]
        [StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Type { get; set; }

        public string? ThreadId { get; set; }

        public int? RequestId { get; set; }

        [StringLength(20)]
        public string? RequestType { get; set; }

        public int? ParentMessageId { get; set; }
    }

    public class MessageResponse
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public int? RequestId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string? ThreadId { get; set; }
        public int? ParentMessageId { get; set; }
    }

    public class ConversationUserResponse
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public decimal Rating { get; set; }
        public string PreferredLanguage { get; set; } = string.Empty;
    }

    public class ConversationSummaryResponse
    {
        public string ThreadId { get; set; } = string.Empty;
        public ConversationUserResponse OtherUser { get; set; } = null!;
        public MessageResponse LastMessage { get; set; } = null!;
        public int UnreadCount { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class ConversationResponse
    {
        public string ThreadId { get; set; } = string.Empty;
        public ConversationUserResponse OtherUser { get; set; } = null!;
        public List<MessageResponse> Messages { get; set; } = new();
    }

    public class UnreadCountResponse
    {
        public int TotalUnread { get; set; }
        public int UnreadConversations { get; set; }
    }

    public class InitiateConversationRequest
    {
        public int? RequestId { get; set; }

        [StringLength(20)]
        public string? RequestType { get; set; }
    }

    public class ConversationInitiateResponse
    {
        public string ThreadId { get; set; } = string.Empty;
        public ConversationUserResponse OtherUser { get; set; } = null!;
        public bool IsNewConversation { get; set; }
        public int? RequestId { get; set; }
        public string? RequestType { get; set; }
    }
}