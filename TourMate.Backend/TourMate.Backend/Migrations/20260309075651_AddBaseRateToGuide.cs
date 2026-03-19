using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourMate.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBaseRateToGuide : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BaseRate",
                table: "Guides",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BaseRate",
                table: "Guides");
        }
    }
}
