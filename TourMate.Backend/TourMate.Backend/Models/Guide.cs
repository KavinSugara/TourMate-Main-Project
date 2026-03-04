namespace TourMate.Backend.Models
{
    public class Guide
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty; 
        public string Category { get; set; } = "National"; 
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public bool IsAvailable { get; set; } = true;
        public bool IsVerified { get; set; } = false;
    }
}