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

        public string? LicenseNumber { get; set; } // SLTDA ID (e.g., N-7721)

        public string? Category { get; set; } // National, Chauffeur, or Site

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        public string? Specialization { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsAvailable { get; set; } = true;

        public bool IsVerified { get; set; } = false;

        // Link to the User account
        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}