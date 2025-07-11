using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using NetworkingApp.Data;
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;

namespace NetworkingApp.Services
{
    public class EmergencyService : IEmergencyService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<EmergencyService> _logger;

        public EmergencyService(
            ApplicationDbContext context,
            IEmailService emailService,
            INotificationService notificationService,
            UserManager<User> userManager,
            ILogger<EmergencyService> logger)
        {
            _context = context;
            _emailService = emailService;
            _notificationService = notificationService;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<EmergencyResponseDto> CreateEmergencyAsync(int userId, CreateEmergencyDto emergencyDto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found");
                }

                var emergency = new Emergency
                {
                    UserId = userId,
                    Type = emergencyDto.Type,
                    Description = emergencyDto.Description,
                    Location = emergencyDto.Location,
                    FlightCompanionRequestId = emergencyDto.FlightCompanionRequestId,
                    PickupRequestId = emergencyDto.PickupRequestId,
                    CreatedAt = DateTime.UtcNow,
                    Status = "Active"
                };

                _context.Emergencies.Add(emergency);
                await _context.SaveChangesAsync();

                _logger.LogWarning("Emergency created: {EmergencyId} for User: {UserId}, Type: {Type}", 
                    emergency.Id, userId, emergencyDto.Type);

                // Trigger immediate emergency notifications
                _ = Task.Run(async () => await SendEmergencyNotificationsAsync(emergency.Id));

                return MapToResponseDto(emergency, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating emergency for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> SendEmergencyNotificationsAsync(int emergencyId)
        {
            try
            {
                var emergency = await _context.Emergencies
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == emergencyId);

                if (emergency == null || emergency.Status != "Active")
                {
                    return false;
                }

                var user = emergency.User;
                var notificationData = new EmergencyNotificationDto
                {
                    EmergencyId = emergency.Id,
                    UserName = $"{user.FirstName} {user.LastName}",
                    UserEmail = user.Email ?? "",
                    UserPhone = user.PhoneNumber ?? "",
                    EmergencyContactName = user.EmergencyContact ?? "",
                    EmergencyContactPhone = user.EmergencyPhone ?? "",
                    EmergencyType = emergency.Type,
                    Description = emergency.Description,
                    Location = emergency.Location,
                    CreatedAt = emergency.CreatedAt
                };

                var notifications = new List<Task>();

                // 1. Notify Emergency Contact (if available)
                if (!string.IsNullOrEmpty(user.EmergencyContact) && !string.IsNullOrEmpty(user.EmergencyPhone))
                {
                    notifications.Add(SendEmergencyContactNotificationAsync(notificationData));
                }

                // 2. Notify Platform Administrators
                notifications.Add(SendAdminEmergencyNotificationAsync(notificationData));

                // 3. Send real-time notification to user's connected devices
                notifications.Add(SendRealTimeEmergencyNotificationAsync(user.Id, emergency));

                // 4. If related to active service, notify the matched user
                if (emergency.FlightCompanionRequestId.HasValue || emergency.PickupRequestId.HasValue)
                {
                    notifications.Add(NotifyMatchedUserAsync(emergency));
                }

                await Task.WhenAll(notifications);

                // Update emergency record
                emergency.EmergencyContactNotified = !string.IsNullOrEmpty(user.EmergencyContact);
                emergency.AdminNotified = true;
                emergency.LastNotificationSent = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Emergency notifications sent for Emergency: {EmergencyId}", emergencyId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending emergency notifications for Emergency: {EmergencyId}", emergencyId);
                return false;
            }
        }

        private async Task SendEmergencyContactNotificationAsync(EmergencyNotificationDto notification)
        {
            try
            {
                // Email to emergency contact
                var emailSubject = $"EMERGENCY ALERT - {notification.UserName}";
                var emailBody = $@"
                    <h2 style='color: red;'>🚨 EMERGENCY ALERT 🚨</h2>
                    <p><strong>{notification.UserName}</strong> has triggered an emergency alert on the Flight Companion platform.</p>
                    
                    <h3>Emergency Details:</h3>
                    <ul>
                        <li><strong>Type:</strong> {notification.EmergencyType}</li>
                        <li><strong>Description:</strong> {notification.Description}</li>
                        <li><strong>Location:</strong> {notification.Location ?? "Not specified"}</li>
                        <li><strong>Time:</strong> {notification.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC</li>
                    </ul>
                    
                    <h3>Contact Information:</h3>
                    <ul>
                        <li><strong>Phone:</strong> {notification.UserPhone}</li>
                        <li><strong>Email:</strong> {notification.UserEmail}</li>
                    </ul>
                    
                    <p style='color: red; font-weight: bold;'>Please contact them immediately to ensure their safety.</p>
                    
                    <p>If this is a life-threatening emergency, please contact emergency services (111 in New Zealand) immediately.</p>
                ";

                await _emailService.SendEmailAsync(notification.EmergencyContactName, emailBody, emailSubject);

                // TODO: Implement SMS notification using Twilio or similar service
                // await _smsService.SendSmsAsync(notification.EmergencyContactPhone, 
                //     $"EMERGENCY: {notification.UserName} needs help. {notification.EmergencyType}: {notification.Description}. Contact: {notification.UserPhone}");

                _logger.LogInformation("Emergency contact notification sent for Emergency: {EmergencyId}", notification.EmergencyId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending emergency contact notification for Emergency: {EmergencyId}", notification.EmergencyId);
            }
        }

        private async Task SendAdminEmergencyNotificationAsync(EmergencyNotificationDto notification)
        {
            try
            {
                // Get all admin users
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");

                var adminNotifications = adminUsers.Select(async admin =>
                {
                    var emailSubject = $"Platform Emergency Alert - {notification.UserName}";
                    var emailBody = $@"
                        <h2 style='color: red;'>🚨 PLATFORM EMERGENCY ALERT 🚨</h2>
                        <p>User <strong>{notification.UserName}</strong> has triggered an emergency alert.</p>
                        
                        <h3>Emergency Details:</h3>
                        <ul>
                            <li><strong>Emergency ID:</strong> {notification.EmergencyId}</li>
                            <li><strong>User:</strong> {notification.UserName} ({notification.UserEmail})</li>
                            <li><strong>Type:</strong> {notification.EmergencyType}</li>
                            <li><strong>Description:</strong> {notification.Description}</li>
                            <li><strong>Location:</strong> {notification.Location ?? "Not specified"}</li>
                            <li><strong>Time:</strong> {notification.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC</li>
                        </ul>
                        
                        <h3>Actions Required:</h3>
                        <ul>
                            <li>Review the emergency in the admin dashboard</li>
                            <li>Contact the user if necessary: {notification.UserPhone}</li>
                            <li>Coordinate with emergency contact if available: {notification.EmergencyContactName} ({notification.EmergencyContactPhone})</li>
                            <li>Follow emergency response protocols</li>
                        </ul>
                        
                        <p style='color: red; font-weight: bold;'>Immediate attention required.</p>
                    ";

                    await _emailService.SendEmailAsync(admin.Email!, emailBody, emailSubject);
                });

                await Task.WhenAll(adminNotifications);

                _logger.LogInformation("Admin emergency notifications sent for Emergency: {EmergencyId}", notification.EmergencyId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending admin emergency notifications for Emergency: {EmergencyId}", notification.EmergencyId);
            }
        }

        private async Task SendRealTimeEmergencyNotificationAsync(int userId, Emergency emergency)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = "Emergency Alert Sent",
                    Message = $"Your {emergency.Type.ToLower()} emergency alert has been sent. Help is on the way.",
                    Type = "EmergencyConfirmation",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                await _notificationService.SendSystemNotificationAsync(userId, notification.Title, notification.Message, "emergency");

                _logger.LogInformation("Real-time emergency notification sent to User: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending real-time emergency notification to User: {UserId}", userId);
            }
        }

        private async Task NotifyMatchedUserAsync(Emergency emergency)
        {
            try
            {
                int? matchedUserId = null;
                string serviceType = "";

                if (emergency.FlightCompanionRequestId.HasValue)
                {
                    var request = await _context.FlightCompanionRequests
                        .FirstOrDefaultAsync(r => r.Id == emergency.FlightCompanionRequestId.Value && r.IsMatched);
                    
                    if (request != null && request.MatchedOfferId.HasValue)
                    {
                        var offer = await _context.FlightCompanionOffers
                            .FirstOrDefaultAsync(o => o.Id == request.MatchedOfferId.Value);
                        matchedUserId = offer?.UserId;
                        serviceType = "Flight Companion";
                    }
                }
                else if (emergency.PickupRequestId.HasValue)
                {
                    var request = await _context.PickupRequests
                        .FirstOrDefaultAsync(r => r.Id == emergency.PickupRequestId.Value && r.IsMatched);
                    
                    if (request != null && request.MatchedOfferId.HasValue)
                    {
                        var offer = await _context.PickupOffers
                            .FirstOrDefaultAsync(o => o.Id == request.MatchedOfferId.Value);
                        matchedUserId = offer?.UserId;
                        serviceType = "Airport Pickup";
                    }
                }

                if (matchedUserId.HasValue)
                {
                    var matchedUser = await _context.Users.FindAsync(matchedUserId.Value);
                    if (matchedUser != null)
                    {
                        var notification = new Notification
                        {
                            UserId = matchedUserId.Value,
                            Title = "Emergency Alert - Matched User",
                            Message = $"Your matched user for {serviceType} service has triggered an emergency alert. Please check on their safety.",
                            Type = "EmergencyAlert",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Notifications.Add(notification);
                        await _context.SaveChangesAsync();

                        await _notificationService.SendSystemNotificationAsync(matchedUserId.Value, notification.Title, notification.Message, "emergency");

                        // Send email to matched user
                        var emailSubject = "Emergency Alert - Please Check on Your Matched User";
                        var emailBody = $@"
                            <h2 style='color: orange;'>⚠️ EMERGENCY ALERT ⚠️</h2>
                            <p>Your matched user for the <strong>{serviceType}</strong> service has triggered an emergency alert.</p>
                            
                            <h3>What to do:</h3>
                            <ul>
                                <li>Try to contact your matched user immediately</li>
                                <li>Check on their safety and well-being</li>
                                <li>If you cannot reach them, contact platform support</li>
                                <li>If it's a life-threatening emergency, call 111</li>
                            </ul>
                            
                            <p>Emergency Type: <strong>{emergency.Type}</strong></p>
                            <p>Time: <strong>{emergency.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC</strong></p>
                            
                            <p>Thank you for being part of our community support network.</p>
                        ";

                        await _emailService.SendEmailAsync(matchedUser.Email!, emailBody, emailSubject);

                        _logger.LogInformation("Matched user notification sent for Emergency: {EmergencyId} to User: {MatchedUserId}", 
                            emergency.Id, matchedUserId.Value);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error notifying matched user for Emergency: {EmergencyId}", emergency.Id);
            }
        }

        public async Task<EmergencyResponseDto> ResolveEmergencyAsync(int emergencyId, ResolveEmergencyDto resolveDto)
        {
            var emergency = await _context.Emergencies
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == emergencyId);

            if (emergency == null)
            {
                throw new ArgumentException("Emergency not found");
            }

            emergency.Status = "Resolved";
            emergency.Resolution = resolveDto.Resolution;
            emergency.ResolvedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Emergency resolved: {EmergencyId}", emergencyId);

            return MapToResponseDto(emergency, emergency.User);
        }

        public async Task<bool> CancelEmergencyAsync(int emergencyId, int userId)
        {
            var emergency = await _context.Emergencies
                .FirstOrDefaultAsync(e => e.Id == emergencyId && e.UserId == userId);

            if (emergency == null || emergency.Status != "Active")
            {
                return false;
            }

            emergency.Status = "Cancelled";
            emergency.ResolvedAt = DateTime.UtcNow;
            emergency.Resolution = "Cancelled by user";

            await _context.SaveChangesAsync();

            _logger.LogInformation("Emergency cancelled: {EmergencyId} by User: {UserId}", emergencyId, userId);

            return true;
        }

        public async Task<IEnumerable<EmergencyResponseDto>> GetUserEmergenciesAsync(int userId)
        {
            var emergencies = await _context.Emergencies
                .Include(e => e.User)
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return emergencies.Select(e => MapToResponseDto(e, e.User));
        }

        public async Task<IEnumerable<EmergencyResponseDto>> GetActiveEmergenciesAsync()
        {
            var emergencies = await _context.Emergencies
                .Include(e => e.User)
                .Where(e => e.Status == "Active")
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return emergencies.Select(e => MapToResponseDto(e, e.User));
        }

        private EmergencyResponseDto MapToResponseDto(Emergency emergency, User user)
        {
            return new EmergencyResponseDto
            {
                Id = emergency.Id,
                UserId = emergency.UserId,
                UserName = $"{user.FirstName} {user.LastName}",
                Type = emergency.Type,
                Description = emergency.Description,
                Location = emergency.Location,
                CreatedAt = emergency.CreatedAt,
                Status = emergency.Status,
                ResolvedAt = emergency.ResolvedAt,
                Resolution = emergency.Resolution,
                EmergencyContactNotified = emergency.EmergencyContactNotified,
                AdminNotified = emergency.AdminNotified
            };
        }
    }
}
