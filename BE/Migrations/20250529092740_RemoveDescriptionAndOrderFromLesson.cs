using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDescriptionAndOrderFromLesson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Words_WordTypes_WordTypeId1",
                table: "Words");

            migrationBuilder.DropIndex(
                name: "IX_Words_WordTypeId1",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "WordTypeId1",
                table: "Words");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WordTypeId1",
                table: "Words",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Words_WordTypeId1",
                table: "Words",
                column: "WordTypeId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Words_WordTypes_WordTypeId1",
                table: "Words",
                column: "WordTypeId1",
                principalTable: "WordTypes",
                principalColumn: "Id");
        }
    }
}
