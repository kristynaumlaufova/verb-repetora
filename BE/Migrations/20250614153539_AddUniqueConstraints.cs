using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Words_WordTypeId",
                table: "Words");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_LangId",
                table: "Lessons");

            migrationBuilder.CreateIndex(
                name: "IX_Words_WordTypeId_Keyword",
                table: "Words",
                columns: new[] { "WordTypeId", "Keyword" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_LangId_Name",
                table: "Lessons",
                columns: new[] { "LangId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Words_WordTypeId_Keyword",
                table: "Words");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_LangId_Name",
                table: "Lessons");

            migrationBuilder.CreateIndex(
                name: "IX_Words_WordTypeId",
                table: "Words",
                column: "WordTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_LangId",
                table: "Lessons",
                column: "LangId");
        }
    }
}
