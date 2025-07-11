// Hubs/NotificationHub.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace NetworkingApp.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time notifications and messaging
    /// Handles user-to-user communication and system-wide notifications
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            if (userId != null)
            {
                // Add user to their personal group for targeted notifications
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation("User {UserId} connected to SignalR hub with connection {ConnectionId}", 
                    userId, Context.ConnectionId);
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetCurrentUserId();
            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation("User {UserId} disconnected from SignalR hub with connection {ConnectionId}", 
                    userId, Context.ConnectionId);
                
                if (exception != null)
                {
                    _logger.LogError(exception, "User {UserId} disconnected with error", userId);
                }
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a specific notification group for targeted notifications
        /// </summary>
        /// <param name="groupName">Name of the group to join</param>
        public async Task JoinGroup(string groupName)
        {
            var userId = GetCurrentUserId();
            if (userId != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation("User {UserId} joined group {GroupName}", userId, groupName);
            }
        }

        /// <summary>
        /// Leave a specific notification group
        /// </summary>
        /// <param name="groupName">Name of the group to leave</param>
        public async Task LeaveGroup(string groupName)
        {
            var userId = GetCurrentUserId();
            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation("User {UserId} left group {GroupName}", userId, groupName);
            }
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        /// <param name="notificationId">ID of the notification to mark as read</param>
        public async Task MarkNotificationAsRead(int notificationId)
        {
            var userId = GetCurrentUserId();
            if (userId != null)
            {
                // Broadcast to all connected clients for this user that the notification is read
                await Clients.Group($"User_{userId}").SendAsync("NotificationMarkedAsRead", new
                {
                    notificationId = notificationId,
                    userId = userId,
                    markedAt = DateTime.UtcNow
                });
                
                _logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}", 
                    notificationId, userId);
            }
        }

        /// <summary>
        /// Send typing indicator for messages
        /// </summary>
        /// <param name="receiverId">ID of the user who should see the typing indicator</param>
        /// <param name="isTyping">Whether the user is currently typing</param>
        public async Task SendTypingIndicator(int receiverId, bool isTyping)
        {
            var userId = GetCurrentUserId();
            if (userId != null && int.TryParse(userId, out int currentUserId) && currentUserId != receiverId)
            {
                await Clients.Group($"User_{receiverId}").SendAsync("TypingIndicator", new
                {
                    senderId = currentUserId,
                    isTyping = isTyping,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Test connection method for debugging
        /// </summary>
        /// <param name="message">Test message to echo back</param>
        public async Task TestConnection(string message)
        {
            var userId = GetCurrentUserId();
            await Clients.Caller.SendAsync("TestResponse", new
            {
                originalMessage = message,
                userId = userId,
                connectionId = Context.ConnectionId,
                timestamp = DateTime.UtcNow,
                response = "SignalR connection is working!"
            });
            
            _logger.LogInformation("Test connection called by user {UserId} with message: {Message}", 
                userId, message);
        }

        private string? GetCurrentUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}