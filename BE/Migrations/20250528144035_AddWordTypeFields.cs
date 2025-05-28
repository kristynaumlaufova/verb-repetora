using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddWordTypeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Field6",
                table: "WordTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Field7",
                table: "WordTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Field8",
                table: "WordTypes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Field6",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field7",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field8",
                table: "WordTypes");
        }
    }
}
