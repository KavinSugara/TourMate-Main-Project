using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TourMate.Backend.Models
{
    public class Guide
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        public string? LicenseNumber { get; set; }

        public string? Category { get; set; } 

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public string? Specialization { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsAvailable { get; set; } = true;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? BaseRate { get; set; }
        public bool IsVerified { get; set; } = false;

        public string LicenseStatus { get; set; } = "Pending";

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        public string? PhoneNumber { get; set; }
    }
}