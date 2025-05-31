using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddFSRSFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Difficulty",
                table: "Words",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Due",
                table: "Words",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FirstReview",
                table: "Words",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReview",
                table: "Words",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Stability",
                table: "Words",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "State",
                table: "Words",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Step",
                table: "Words",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReviewLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WordId = table.Column<int>(type: "integer", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    ReviewDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewDuration = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewLogs_Words_WordId",
                        column: x => x.WordId,
                        principalTable: "Words",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLogs_WordId",
                table: "ReviewLogs",
                column: "WordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewLogs");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Due",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "FirstReview",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "LastReview",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Stability",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "Step",
                table: "Words");
        }
    }
}
