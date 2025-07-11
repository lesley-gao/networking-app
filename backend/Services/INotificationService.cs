// Services/INotificationService.cs
using NetworkingApp.Models;

namespace NetworkingApp.Services
{
    public interface INotificationService
    {
        /// <summary>
        /// Sends a match found notification to users when a request is matched with an offer
        /// </summary>
        /// <param name="requestUserId">User ID who made the request</param>
        /// <param name="requestType">Type of request (e.g., "PickupRequest", "FlightCompanionRequest")</param>
        /// <param name="requestId">ID of the matched request</param>
        /// <param name="matchedUserId">User ID who will provide the service</param>
        Task SendMatchFoundNotificationAsync(int requestUserId, string requestType, int requestId, int matchedUserId);

        /// <summary>
        /// Sends a service notification to a user
        /// </summary>
        /// <param name="userId">User ID to notify</param>
        /// <param name="notificationType">Type of notification</param>
        /// <param name="message">Notification message</param>
        /// <param name="actionUrl">Optional action URL</param>
        Task SendServiceNotificationAsync(int userId, string notificationType, string message, string? actionUrl = null);

        /// <summary>
        /// Sends a message notification when a new message is received
        /// </summary>
        /// <param name="receiverId">User ID receiving the message</param>
        /// <param name="senderId">User ID sending the message</param>
        /// <param name="senderName">Full name of the sender</param>
        /// <param name="messagePreview">Preview of the message content</param>
        Task SendMessageNotificationAsync(int receiverId, int senderId, string senderName, string messagePreview);

        /// <summary>
        /// Sends a system notification to a user
        /// </summary>
        /// <param name="userId">User ID to notify</param>
        /// <param name="title">Notification title</param>
        /// <param name="message">Notification message</param>
        /// <param name="type">Notification type</param>
        /// <param name="actionUrl">Optional action URL</param>
        Task SendSystemNotificationAsync(int userId, string title, string message, string type = "Info", string? actionUrl = null);
    }
}