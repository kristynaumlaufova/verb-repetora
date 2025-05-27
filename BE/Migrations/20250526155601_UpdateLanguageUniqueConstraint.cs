using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLanguageUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Languages_Name",
                table: "Languages");

            migrationBuilder.DropIndex(
                name: "IX_Languages_UserId",
                table: "Languages");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Languages",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Languages_UserId_Name",
                table: "Languages",
                columns: new[] { "UserId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Languages_UserId_Name",
                table: "Languages");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Languages",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.CreateIndex(
                name: "IX_Languages_Name",
                table: "Languages",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Languages_UserId",
                table: "Languages",
                column: "UserId");
        }
    }
}
