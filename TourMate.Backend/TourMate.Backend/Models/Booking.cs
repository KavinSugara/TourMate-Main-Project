namespace TourMate.Backend.Models
{
    public class Booking
    {
        public int BookingId { get; set; }
        public int TouristId { get; set; }
        public int GuideId { get; set; }
        public DateTime BookingDate { get; set; }
        public string Status { get; set; } = "Pending";
        public string? TouristName { get; set; }
        public string? GuideName { get; set; }
    }
}