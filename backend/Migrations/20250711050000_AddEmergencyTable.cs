using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetworkingApp.Migrations
{
    /// <inheritdoc />
    public partial class AddEmergencyTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Emergencies");
        }
    }
}
