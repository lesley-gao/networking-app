using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using NetworkingApp.Models;

namespace NetworkingApp.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<FlightCompanionRequest> FlightCompanionRequests { get; set; }
        public DbSet<FlightCompanionOffer> FlightCompanionOffers { get; set; }
        public DbSet<PickupRequest> PickupRequests { get; set; }
        public DbSet<PickupOffer> PickupOffers { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<UserSettings> UserSettings { get; set; }
        public DbSet<VerificationDocument> VerificationDocuments { get; set; }
        public DbSet<Escrow> Escrows { get; set; }
        public DbSet<Dispute> Disputes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal precision
            modelBuilder.Entity<FlightCompanionRequest>()
                .Property(e => e.OfferedAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<FlightCompanionOffer>()
                .Property(e => e.RequestedAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<PickupRequest>()
                .Property(e => e.OfferedAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<PickupOffer>()
                .Property(e => e.BaseRate)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<PickupOffer>()
                .Property(e => e.AverageRating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<User>()
                .Property(e => e.Rating)
                .HasColumnType("decimal(3,2)");

            modelBuilder.Entity<Payment>()
                .Property(e => e.Amount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Payment>()
                .Property(e => e.PlatformFeeAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Escrow>()
                .Property(e => e.Amount)
                .HasColumnType("decimal(18,2)");

            // Configure User relationships
            modelBuilder.Entity<FlightCompanionRequest>()
                .HasOne(fcr => fcr.User)
                .WithMany(u => u.FlightCompanionRequests)
                .HasForeignKey(fcr => fcr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FlightCompanionOffer>()
                .HasOne(fco => fco.User)
                .WithMany(u => u.FlightCompanionOffers)
                .HasForeignKey(fco => fco.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PickupRequest>()
                .HasOne(pr => pr.User)
                .WithMany(u => u.PickupRequests)
                .HasForeignKey(pr => pr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PickupOffer>()
                .HasOne(po => po.User)
                .WithMany(u => u.PickupOffers)
                .HasForeignKey(po => po.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure matching relationships
            modelBuilder.Entity<FlightCompanionRequest>()
                .HasOne(fcr => fcr.MatchedOffer)
                .WithMany(fco => fco.MatchedRequests)
                .HasForeignKey(fcr => fcr.MatchedOfferId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PickupRequest>()
                .HasOne(pr => pr.MatchedOffer)
                .WithMany(po => po.MatchedRequests)
                .HasForeignKey(pr => pr.MatchedOfferId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Payment relationships
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Payer)
                .WithMany(u => u.PaymentsAsPayer)
                .HasForeignKey(p => p.PayerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Receiver)
                .WithMany(u => u.PaymentsAsReceiver)
                .HasForeignKey(p => p.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Escrow relationships
            modelBuilder.Entity<Escrow>()
                .HasOne(e => e.Payment)
                .WithMany()
                .HasForeignKey(e => e.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Rating relationships
            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Rater)
                .WithMany(u => u.RatingsGiven)
                .HasForeignKey(r => r.RaterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.RatedUser)
                .WithMany(u => u.RatingsReceived)
                .HasForeignKey(r => r.RatedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Notification relationships
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Message relationships
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.ParentMessage)
                .WithMany(m => m.Replies)
                .HasForeignKey(m => m.ParentMessageId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure indexes for performance
            modelBuilder.Entity<FlightCompanionRequest>()
                .HasIndex(fcr => new { fcr.FlightNumber, fcr.FlightDate })
                .HasDatabaseName("IX_FlightCompanionRequest_Flight");

            modelBuilder.Entity<FlightCompanionOffer>()
                .HasIndex(fco => new { fco.FlightNumber, fco.FlightDate })
                .HasDatabaseName("IX_FlightCompanionOffer_Flight");

            modelBuilder.Entity<PickupRequest>()
                .HasIndex(pr => new { pr.Airport, pr.ArrivalDate })
                .HasDatabaseName("IX_PickupRequest_Airport");

            modelBuilder.Entity<PickupOffer>()
                .HasIndex(po => po.Airport)
                .HasDatabaseName("IX_PickupOffer_Airport");

            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.Status)
                .HasDatabaseName("IX_Payment_Status");

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead })
                .HasDatabaseName("IX_Notification_User_Read");

            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.ThreadId, m.CreatedAt })
                .HasDatabaseName("IX_Message_Thread_Created");

            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.ReceiverId, m.IsRead })
                .HasDatabaseName("IX_Message_Receiver_Read");

            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.SenderId, m.CreatedAt })
                .HasDatabaseName("IX_Message_Sender_Created");

            // Configure UserSettings
            modelBuilder.Entity<UserSettings>()
                .HasOne(us => us.User)
                .WithOne()
                .HasForeignKey<UserSettings>(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSettings>()
                .HasIndex(us => us.UserId)
                .IsUnique()
                .HasDatabaseName("IX_UserSettings_UserId");

            modelBuilder.Entity<VerificationDocument>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
