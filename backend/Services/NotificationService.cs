// Services/NotificationService.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NetworkingApp.Data;
using NetworkingApp.Hubs;
using NetworkingApp.Models;

namespace NetworkingApp.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IEmailService _emailService;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IEmailService emailService,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task SendMatchFoundNotificationAsync(int requestUserId, string requestType, int requestId, int matchedUserId)
        {
            try
            {
                // Get user details for email notifications
                var requesterUser = await _context.Users.FindAsync(requestUserId);
                var matchedUser = await _context.Users.FindAsync(matchedUserId);

                if (requesterUser == null || matchedUser == null)
                {
                    _logger.LogWarning("Could not find users for match notification. Requester: {RequestUserId}, Matched: {MatchedUserId}", 
                        requestUserId, matchedUserId);
                    return;
                }

                // Create notification for requester
                var requesterNotification = new Notification
                {
                    UserId = requestUserId,
                    Title = "Match Found!",
                    Message = $"Great news! We found a match for your {requestType.Replace("Request", "").ToLower()} request.",
                    Type = "MatchFound",
                    ActionUrl = $"/{requestType.ToLower().Replace("request", "")}/matches/{requestId}",
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(7)
                };

                // Create notification for matched user
                var matchedUserNotification = new Notification
                {
                    UserId = matchedUserId,
                    Title = "Service Assignment",
                    Message = $"You have been matched to provide {requestType.Replace("Request", "").ToLower()} service.",
                    Type = "ServiceAssignment",
                    ActionUrl = $"/{requestType.ToLower().Replace("request", "")}/service/{requestId}",
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(7)
                };

                _context.Notifications.AddRange(requesterNotification, matchedUserNotification);
                await _context.SaveChangesAsync();

                // Send real-time notifications via SignalR using user groups
                await _hubContext.Clients.Group($"User_{requestUserId}")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = requesterNotification.Id,
                        title = requesterNotification.Title,
                        message = requesterNotification.Message,
                        type = requesterNotification.Type,
                        actionUrl = requesterNotification.ActionUrl,
                        createdAt = requesterNotification.CreatedAt,
                        isRead = false
                    });

                await _hubContext.Clients.Group($"User_{matchedUserId}")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = matchedUserNotification.Id,
                        title = matchedUserNotification.Title,
                        message = matchedUserNotification.Message,
                        type = matchedUserNotification.Type,
                        actionUrl = matchedUserNotification.ActionUrl,
                        createdAt = matchedUserNotification.CreatedAt,
                        isRead = false
                    });

                // Send email notifications
                try
                {
                    var serviceType = requestType.Replace("Request", "");
                    var serviceDetails = await GetServiceDetails(requestType, requestId);
                    
                    await _emailService.SendMatchConfirmationEmailAsync(
                        requesterUser.Email!, 
                        requesterUser.FirstName,
                        matchedUser.Email!, 
                        matchedUser.FirstName, 
                        serviceType, 
                        serviceDetails);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send match confirmation emails for request {RequestId}", requestId);
                    // Don't throw - email failure shouldn't break the notification flow
                }

                _logger.LogInformation("Match found notifications sent to users {RequestUserId} and {MatchedUserId}", 
                    requestUserId, matchedUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending match found notification");
                throw;
            }
        }

        public async Task SendServiceNotificationAsync(int userId, string notificationType, string message, string? actionUrl = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = GetNotificationTitle(notificationType),
                    Message = message,
                    Type = notificationType,
                    ActionUrl = actionUrl,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(GetExpirationDays(notificationType))
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Send real-time notification via SignalR using user groups
                await _hubContext.Clients.Group($"User_{userId}")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = notification.Id,
                        title = notification.Title,
                        message = notification.Message,
                        type = notification.Type,
                        actionUrl = notification.ActionUrl,
                        createdAt = notification.CreatedAt,
                        isRead = false
                    });

                _logger.LogInformation("Service notification sent to user {UserId}: {NotificationType}", 
                    userId, notificationType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending service notification to user {UserId}", userId);
                throw;
            }
        }

        public async Task SendMessageNotificationAsync(int receiverId, int senderId, string senderName, string messagePreview)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = receiverId,
                    Title = "New Message",
                    Message = $"New message from {senderName}: {messagePreview}",
                    Type = "Message",
                    ActionUrl = $"/messages/{senderId}",
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(30)
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Send real-time notification via SignalR using user groups
                await _hubContext.Clients.Group($"User_{receiverId}")
                    .SendAsync("ReceiveMessage", new
                    {
                        senderId = senderId,
                        senderName = senderName,
                        messagePreview = messagePreview,
                        timestamp = DateTime.UtcNow
                    });

                _logger.LogInformation("Message notification sent to user {ReceiverId} from user {SenderId}", 
                    receiverId, senderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message notification");
                throw;
            }
        }

        public async Task SendSystemNotificationAsync(int userId, string title, string message, string type = "Info", string? actionUrl = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    ActionUrl = actionUrl,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = GetSystemNotificationExpiration(type)
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Send real-time notification via SignalR using user groups
                await _hubContext.Clients.Group($"User_{userId}")
                    .SendAsync("ReceiveSystemNotification", new
                    {
                        title = notification.Title,
                        message = notification.Message,
                        type = notification.Type,
                        timestamp = notification.CreatedAt
                    });

                _logger.LogInformation("System notification sent to user {UserId}: {Type}", userId, type);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending system notification to user {UserId}", userId);
                throw;
            }
        }

        private static string GetNotificationTitle(string notificationType)
        {
            return notificationType switch
            {
                "ServiceConfirmed" => "Service Confirmed",
                "ServiceCancelled" => "Service Cancelled",
                "PaymentReceived" => "Payment Received",
                "PaymentFailed" => "Payment Failed",
                "ServiceCompleted" => "Service Completed",
                "RatingRequest" => "Please Rate Your Experience",
                _ => "Service Update"
            };
        }

        private static int GetExpirationDays(string notificationType)
        {
            return notificationType switch
            {
                "ServiceConfirmed" => 7,
                "ServiceCancelled" => 3,
                "PaymentReceived" => 30,
                "PaymentFailed" => 7,
                "ServiceCompleted" => 14,
                "RatingRequest" => 14,
                _ => 7
            };
        }

        private static DateTime? GetSystemNotificationExpiration(string type)
        {
            return type.ToLower() switch
            {
                "error" => DateTime.UtcNow.AddDays(30),
                "warning" => DateTime.UtcNow.AddDays(7),
                "success" => DateTime.UtcNow.AddDays(3),
                _ => DateTime.UtcNow.AddDays(7)
            };
        }

        private async Task<string> GetServiceDetails(string requestType, int requestId)
        {
            try
            {
                if (requestType == "FlightCompanionRequest")
                {
                    var request = await _context.FlightCompanionRequests
                        .FirstOrDefaultAsync(r => r.Id == requestId);
                    
                    if (request != null)
                    {
                        return $"Flight: {request.FlightNumber} from {request.DepartureAirport} to {request.ArrivalAirport} on {request.FlightDate:MMM dd, yyyy}";
                    }
                }
                else if (requestType == "PickupRequest")
                {
                    var request = await _context.PickupRequests
                        .FirstOrDefaultAsync(r => r.Id == requestId);
                    
                    if (request != null)
                    {
                        return $"Pickup from {request.Airport} to {request.DestinationAddress} on {request.ArrivalDate:MMM dd, yyyy} at {request.ArrivalTime:hh\\:mm}";
                    }
                }
                
                return $"Service request #{requestId}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service details for {RequestType} {RequestId}", requestType, requestId);
                return $"Service request #{requestId}";
            }
        }
    }
}