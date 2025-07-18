using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetworkingApp.Migrations
{
    /// <inheritdoc />
    public partial class AddVerificationDocumentsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FirstName = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    PreferredLanguage = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    IsVerified = table.Column<bool>(type: "INTEGER", nullable: false),
                    VerificationDocuments = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    EmergencyContact = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    EmergencyPhone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Rating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    TotalRatings = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    RoleId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FlightCompanionOffers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    FlightNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Airline = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FlightDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DepartureAirport = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    ArrivalAirport = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    AvailableServices = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Languages = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    RequestedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsAvailable = table.Column<bool>(type: "INTEGER", nullable: false),
                    AdditionalInfo = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    HelpedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightCompanionOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightCompanionOffers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SenderId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReceiverId = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestId = table.Column<int>(type: "INTEGER", nullable: true),
                    RequestType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ThreadId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    ParentMessageId = table.Column<int>(type: "INTEGER", nullable: true),
                    Metadata = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_AspNetUsers_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_AspNetUsers_SenderId",
                        column: x => x.SenderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_Messages_ParentMessageId",
                        column: x => x.ParentMessageId,
                        principalTable: "Messages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    ActionUrl = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PickupOffers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Airport = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    VehicleType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    MaxPassengers = table.Column<int>(type: "INTEGER", nullable: false),
                    CanHandleLuggage = table.Column<bool>(type: "INTEGER", nullable: false),
                    ServiceArea = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    BaseRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Languages = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    AdditionalServices = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsAvailable = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TotalPickups = table.Column<int>(type: "INTEGER", nullable: false),
                    AverageRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickupOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PickupOffers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Ratings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RaterId = table.Column<int>(type: "INTEGER", nullable: false),
                    RatedUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestId = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Score = table.Column<int>(type: "INTEGER", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsPublic = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ratings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ratings_AspNetUsers_RatedUserId",
                        column: x => x.RatedUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ratings_AspNetUsers_RaterId",
                        column: x => x.RaterId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Theme = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Language = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    TimeZone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    EmailNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    PushNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    SmsNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailMatches = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailMessages = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailReminders = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailMarketing = table.Column<bool>(type: "INTEGER", nullable: false),
                    ShowOnlineStatus = table.Column<bool>(type: "INTEGER", nullable: false),
                    ShowLastSeen = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowDirectMessages = table.Column<bool>(type: "INTEGER", nullable: false),
                    DefaultSearchRadius = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    AutoAcceptMatches = table.Column<bool>(type: "INTEGER", nullable: false),
                    RequirePhoneVerification = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CustomPreferences = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSettings_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VerificationDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    BlobUri = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsRejected = table.Column<bool>(type: "INTEGER", nullable: false),
                    AdminComment = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VerificationDocuments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FlightCompanionRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    FlightNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Airline = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FlightDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DepartureAirport = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    ArrivalAirport = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    TravelerName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    TravelerAge = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    SpecialNeeds = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    OfferedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AdditionalNotes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsMatched = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MatchedOfferId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightCompanionRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightCompanionRequests_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FlightCompanionRequests_FlightCompanionOffers_MatchedOfferId",
                        column: x => x.MatchedOfferId,
                        principalTable: "FlightCompanionOffers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PickupRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    FlightNumber = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ArrivalDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ArrivalTime = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    Airport = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    DestinationAddress = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PassengerName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PassengerPhone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    PassengerCount = table.Column<int>(type: "INTEGER", nullable: false),
                    HasLuggage = table.Column<bool>(type: "INTEGER", nullable: false),
                    OfferedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SpecialRequests = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsMatched = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MatchedOfferId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickupRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PickupRequests_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PickupRequests_PickupOffers_MatchedOfferId",
                        column: x => x.MatchedOfferId,
                        principalTable: "PickupOffers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Emergencies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Location = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Resolution = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    FlightCompanionRequestId = table.Column<int>(type: "INTEGER", nullable: true),
                    PickupRequestId = table.Column<int>(type: "INTEGER", nullable: true),
                    EmergencyContactNotified = table.Column<bool>(type: "INTEGER", nullable: false),
                    AdminNotified = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastNotificationSent = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Emergencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Emergencies_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Emergencies_FlightCompanionRequests_FlightCompanionRequestId",
                        column: x => x.FlightCompanionRequestId,
                        principalTable: "FlightCompanionRequests",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Emergencies_PickupRequests_PickupRequestId",
                        column: x => x.PickupRequestId,
                        principalTable: "PickupRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Disputes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PaymentId = table.Column<int>(type: "INTEGER", nullable: false),
                    RaisedByUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    EvidenceUrl = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    AdminNotes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ResolvedByAdminId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Disputes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Disputes_AspNetUsers_RaisedByUserId",
                        column: x => x.RaisedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Disputes_AspNetUsers_ResolvedByAdminId",
                        column: x => x.ResolvedByAdminId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Escrows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReleasedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PaymentId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Escrows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PayerId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReceiverId = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestId = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    EscrowReleaseDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PlatformFeeAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EscrowId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_AspNetUsers_PayerId",
                        column: x => x.PayerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Payments_AspNetUsers_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Payments_Escrows_EscrowId",
                        column: x => x.EscrowId,
                        principalTable: "Escrows",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_PaymentId",
                table: "Disputes",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_RaisedByUserId",
                table: "Disputes",
                column: "RaisedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_ResolvedByAdminId",
                table: "Disputes",
                column: "ResolvedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Emergencies_FlightCompanionRequestId",
                table: "Emergencies",
                column: "FlightCompanionRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Emergencies_PickupRequestId",
                table: "Emergencies",
                column: "PickupRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Emergencies_UserId",
                table: "Emergencies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Escrows_PaymentId",
                table: "Escrows",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightCompanionOffer_Flight",
                table: "FlightCompanionOffers",
                columns: new[] { "FlightNumber", "FlightDate" });

            migrationBuilder.CreateIndex(
                name: "IX_FlightCompanionOffers_UserId",
                table: "FlightCompanionOffers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightCompanionRequest_Flight",
                table: "FlightCompanionRequests",
                columns: new[] { "FlightNumber", "FlightDate" });

            migrationBuilder.CreateIndex(
                name: "IX_FlightCompanionRequests_MatchedOfferId",
                table: "FlightCompanionRequests",
                column: "MatchedOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightCompanionRequests_UserId",
                table: "FlightCompanionRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Message_Receiver_Read",
                table: "Messages",
                columns: new[] { "ReceiverId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Message_Sender_Created",
                table: "Messages",
                columns: new[] { "SenderId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Message_Thread_Created",
                table: "Messages",
                columns: new[] { "ThreadId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ParentMessageId",
                table: "Messages",
                column: "ParentMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_User_Read",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_Payment_Status",
                table: "Payments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_EscrowId",
                table: "Payments",
                column: "EscrowId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PayerId",
                table: "Payments",
                column: "PayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ReceiverId",
                table: "Payments",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_PickupOffer_Airport",
                table: "PickupOffers",
                column: "Airport");

            migrationBuilder.CreateIndex(
                name: "IX_PickupOffers_UserId",
                table: "PickupOffers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PickupRequest_Airport",
                table: "PickupRequests",
                columns: new[] { "Airport", "ArrivalDate" });

            migrationBuilder.CreateIndex(
                name: "IX_PickupRequests_MatchedOfferId",
                table: "PickupRequests",
                column: "MatchedOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_PickupRequests_UserId",
                table: "PickupRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RatedUserId",
                table: "Ratings",
                column: "RatedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RaterId",
                table: "Ratings",
                column: "RaterId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSettings_UserId",
                table: "UserSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationDocuments_UserId",
                table: "VerificationDocuments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Disputes_Payments_PaymentId",
                table: "Disputes",
                column: "PaymentId",
                principalTable: "Payments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Escrows_Payments_PaymentId",
                table: "Escrows",
                column: "PaymentId",
                principalTable: "Payments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_AspNetUsers_PayerId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_AspNetUsers_ReceiverId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Escrows_Payments_PaymentId",
                table: "Escrows");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Disputes");

            migrationBuilder.DropTable(
                name: "Emergencies");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Ratings");

            migrationBuilder.DropTable(
                name: "UserSettings");

            migrationBuilder.DropTable(
                name: "VerificationDocuments");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "FlightCompanionRequests");

            migrationBuilder.DropTable(
                name: "PickupRequests");

            migrationBuilder.DropTable(
                name: "FlightCompanionOffers");

            migrationBuilder.DropTable(
                name: "PickupOffers");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Escrows");
        }
    }
}
