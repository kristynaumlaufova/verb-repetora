using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWordTypeUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WordTypes_LangId",
                table: "WordTypes");

            migrationBuilder.DropIndex(
                name: "IX_WordTypes_Name",
                table: "WordTypes");

            migrationBuilder.CreateIndex(
                name: "IX_WordTypes_LangId_Name",
                table: "WordTypes",
                columns: new[] { "LangId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WordTypes_LangId_Name",
                table: "WordTypes");

            migrationBuilder.CreateIndex(
                name: "IX_WordTypes_LangId",
                table: "WordTypes",
                column: "LangId");

            migrationBuilder.CreateIndex(
                name: "IX_WordTypes_Name",
                table: "WordTypes",
                column: "Name",
                unique: true);
        }
    }
}
