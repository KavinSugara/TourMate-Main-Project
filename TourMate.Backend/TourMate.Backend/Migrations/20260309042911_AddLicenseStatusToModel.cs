using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourMate.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLicenseStatusToModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // LEAVE EMPTY: The 'LicenseStatus' column already exists in SQLEXPRESS03
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // LEAVE EMPTY
        }
    }
}
