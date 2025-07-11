// Services/IEmailService.cs
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;

namespace NetworkingApp.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends a match confirmation email to both users when a successful match is made
        /// </summary>
        /// <param name="requesterEmail">Email of the user who made the request</param>
        /// <param name="requesterName">Name of the requester</param>
        /// <param name="helperEmail">Email of the user providing the service</param>
        /// <param name="helperName">Name of the helper</param>
        /// <param name="serviceType">Type of service (Flight Companion, Pickup)</param>
        /// <param name="serviceDetails">Details about the service</param>
        Task SendMatchConfirmationEmailAsync(string requesterEmail, string requesterName, 
            string helperEmail, string helperName, string serviceType, string serviceDetails);

        /// <summary>
        /// Sends a service booking confirmation email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="serviceType">Type of service</param>
        /// <param name="bookingDetails">Booking details</param>
        /// <param name="bookingReference">Unique booking reference</param>
        Task SendBookingConfirmationEmailAsync(string userEmail, string userName, 
            string serviceType, string bookingDetails, string bookingReference);

        /// <summary>
        /// Sends a payment confirmation email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="amount">Payment amount</param>
        /// <param name="transactionId">Transaction ID</param>
        /// <param name="serviceDetails">Service details</param>
        Task SendPaymentConfirmationEmailAsync(string userEmail, string userName, 
            decimal amount, string transactionId, string serviceDetails);

        /// <summary>
        /// Sends an account verification email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="verificationLink">Email verification link</param>
        Task SendAccountVerificationEmailAsync(string userEmail, string userName, string verificationLink);

        /// <summary>
        /// Sends a security alert email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="alertType">Type of security alert</param>
        /// <param name="alertDetails">Details about the security event</param>
        Task SendSecurityAlertEmailAsync(string userEmail, string userName, 
            string alertType, string alertDetails);

        /// <summary>
        /// Sends a password reset email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="resetLink">Password reset link</param>
        Task SendPasswordResetEmailAsync(string userEmail, string userName, string resetLink);

        /// <summary>
        /// Sends a service reminder email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="serviceType">Type of service</param>
        /// <param name="reminderDetails">Reminder details</param>
        /// <param name="serviceDate">Date/time of the service</param>
        Task SendServiceReminderEmailAsync(string userEmail, string userName, 
            string serviceType, string reminderDetails, DateTime serviceDate);

        /// <summary>
        /// Sends a service completion and rating request email
        /// </summary>
        /// <param name="userEmail">User's email address</param>
        /// <param name="userName">User's name</param>
        /// <param name="serviceType">Type of service</param>
        /// <param name="partnerName">Name of the service partner</param>
        /// <param name="ratingLink">Link to rate the service</param>
        Task SendServiceCompletionEmailAsync(string userEmail, string userName, 
            string serviceType, string partnerName, string ratingLink);

        /// <summary>
        /// Sends a receipt email
        /// </summary>
        /// <param name="toEmail">Recipient's email address</param>
        /// <param name="receipt">Receipt details</param>
        Task SendReceiptEmailAsync(string toEmail, ReceiptDto receipt);

        /// <summary>
        /// Sends a general email with custom content
        /// </summary>
        /// <param name="toEmail">Recipient's email address</param>
        /// <param name="htmlContent">HTML content of the email</param>
        /// <param name="subject">Email subject</param>
        Task SendEmailAsync(string toEmail, string htmlContent, string subject);
    }
}
