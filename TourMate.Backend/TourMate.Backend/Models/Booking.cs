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
        public string? TouristMessage { get; set; }
        public DateTime? EstimatedStartTime { get; set; }
        public string? Duration { get; set; }
        public int? GroupSize { get; set; }
        public DateTime? StartTime { get; set; }

        // ADD THESE THREE LINES:
        public DateTime? EndTime { get; set; }
        public int? Rating { get; set; }
        public string? ReviewComment { get; set; }
    }
}