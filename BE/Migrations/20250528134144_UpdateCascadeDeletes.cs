using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCascadeDeletes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Languages_LanguageId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_WordTypes_Languages_LanguageId",
                table: "WordTypes");

            migrationBuilder.DropIndex(
                name: "IX_WordTypes_LanguageId",
                table: "WordTypes");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_LanguageId",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "LanguageId",
                table: "WordTypes");

            migrationBuilder.DropColumn(
                name: "LanguageId",
                table: "Lessons");

            migrationBuilder.AddColumn<int>(
                name: "LanguageId",
                table: "Words",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WordTypeId1",
                table: "Words",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Words_LanguageId",
                table: "Words",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Words_WordTypeId1",
                table: "Words",
                column: "WordTypeId1");

            migrationBuilder.CreateIndex(
                name: "IX_WordTypes_LangId",
                table: "WordTypes",
                column: "LangId");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_LangId",
                table: "Lessons",
                column: "LangId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Languages_LangId",
                table: "Lessons",
                column: "LangId",
                principalTable: "Languages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WordTypes_Languages_LangId",
                table: "WordTypes",
                column: "LangId",
                principalTable: "Languages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Words_Languages_LanguageId",
                table: "Words",
                column: "LanguageId",
                principalTable: "Languages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Words_WordTypes_WordTypeId1",
                table: "Words",
                column: "WordTypeId1",
                principalTable: "WordTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Languages_LangId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_WordTypes_Languages_LangId",
                table: "WordTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_Words_Languages_LanguageId",
                table: "Words");

            migrationBuilder.DropForeignKey(
                name: "FK_Words_WordTypes_WordTypeId1",
                table: "Words");

            migrationBuilder.DropIndex(
                name: "IX_Words_LanguageId",
                table: "Words");

            migrationBuilder.DropIndex(
                name: "IX_Words_WordTypeId1",
                table: "Words");

            migrationBuilder.DropIndex(
                name: "IX_WordTypes_LangId",
                table: "WordTypes");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_LangId",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "LanguageId",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "WordTypeId1",
                table: "Words");

            migrationBuilder.AddColumn<int>(
                name: "LanguageId",
                table: "WordTypes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LanguageId",
                table: "Lessons",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_WordTypes_LanguageId",
                table: "WordTypes",
                column: "LanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_LanguageId",
                table: "Lessons",
                column: "LanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Languages_LanguageId",
                table: "Lessons",
                column: "LanguageId",
                principalTable: "Languages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WordTypes_Languages_LanguageId",
                table: "WordTypes",
                column: "LanguageId",
                principalTable: "Languages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
