using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWordTypeToSingleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Field1",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field2",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field3",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field4",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field5",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field6",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field7",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "Field8",
                table: "WordTypes");

            migrationBuilder.AddColumn<string>(
                name: "Fields",
                table: "WordTypes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Fields",
                table: "WordTypes");

            migrationBuilder.AddColumn<string>(
                name: "Field1",
                table: "WordTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Field2",
                table: "WordTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Field3",
                table: "WordTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Field4",
                table: "WordTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Field5",
                table: "WordTypes",
                type: "text",
                nullable: true);

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
    }
}
