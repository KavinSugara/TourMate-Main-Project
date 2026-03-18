using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourMate.Backend.Data;
using TourMate.Backend.Models;

namespace TourMate.Backend.Controllers
{
    // --- Data Transfer Objects (DTOs) ---
    public class BookingLocationDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class TripReviewDto
    {
        public int Rating { get; set; }
        public string? ReviewComment { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. CREATE: Tourist sends a request
        [HttpPost("request")]
        public async Task<IActionResult> CreateBooking([FromBody] Booking booking)
        {
            booking.BookingDate = DateTime.Now;
            booking.Status = "Pending";
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return Ok(new { booking.BookingId, message = "Booking saved to database" });
        }

        // 2. GET: Guide views their specific requests
        [HttpGet("guide/{guideId}")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetGuideBookings(int guideId)
        {
            return await _context.Bookings
                .Where(b => b.GuideId == guideId && b.Status == "Pending")
                .ToListAsync();
        }

        // 3. UPDATE: Guide Accepts/Declines
        [HttpPatch("respond/{bookingId}")]
        public async Task<IActionResult> RespondToBooking(int bookingId, [FromBody] string status)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();
            booking.Status = status;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Booking {status}" });
        }

        // 4. GET: Tourist views their history
        [HttpGet("tourist/{touristId}")]
        public async Task<IActionResult> GetTouristBookings(int touristId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.TouristId == touristId)
                .Join(_context.Guides,
                    booking => booking.GuideId,
                    guide => guide.UserId,
                    (booking, guide) => new {
                        booking.BookingId,
                        booking.TouristId,
                        booking.GuideId,
                        booking.Status,
                        booking.TouristName,
                        booking.GuideName,
                        booking.TouristMessage,
                        booking.BookingDate,
                        booking.EstimatedStartTime,
                        booking.Duration,
                        booking.GroupSize,
                        GuidePhone = (booking.Status == "Accepted" || booking.Status == "Active")
                                     ? guide.PhoneNumber : "Hidden until accepted"
                    })
                .OrderByDescending(x => x.BookingDate)
                .ToListAsync();

            return Ok(bookings);
        }

        [HttpPatch("start/{bookingId}")]
        public async Task<IActionResult> StartTrip(int bookingId, [FromBody] BookingLocationDto touristLoc)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();

            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == booking.GuideId);
            if (guide == null || guide.Latitude == null || guide.Longitude == null)
                return BadRequest(new { message = "Guide location unavailable. Guide must be online." });

            double distance = CalculateDistance(
                touristLoc.Latitude, touristLoc.Longitude,
                (double)guide.Latitude, (double)guide.Longitude
            );

            // INCREASED THRESHOLD: 10.0 KM to handle desktop browser GPS drift
            if (distance > 10.0)
            {
                return BadRequest(new
                {
                    message = $"Safety Check Failed: Too far from guide ({Math.Round(distance, 2)} km).",
                    distanceKm = Math.Round(distance, 3)
                });
            }

            booking.Status = "Active";
            booking.StartTime = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Trip started successfully!", startTime = booking.StartTime });
        }

        // 6. COMPLETE: Formal trip closure and rating submission
        [HttpPatch("complete/{bookingId}")]
        public async Task<IActionResult> CompleteTrip(int bookingId, [FromBody] TripReviewDto review)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();

            booking.Status = "Completed";
            booking.EndTime = DateTime.Now;
            booking.Rating = review.Rating;
            booking.ReviewComment = review.ReviewComment;

            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == booking.GuideId);
            if (guide != null)
            {
                guide.IsAvailable = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Trip completed and review submitted!" });
        }

        // Helper Method: Haversine Formula for distance calculation
        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return 6371 * c;
        }

        [HttpGet("guide/reviews/{guideId}")]
        public async Task<IActionResult> GetGuideReviews(int guideId)
        {
            var reviews = await _context.Bookings
                .Where(b => b.GuideId == guideId && b.Status == "Completed" && b.Rating != null)
                .OrderByDescending(b => b.EndTime)
                .Select(b => new {
                    b.BookingId,
                    b.TouristName,
                    b.Rating,
                    b.ReviewComment,
                    CompletedDate = b.EndTime
                })
                .ToListAsync();

            return Ok(reviews);
        }
    }
}