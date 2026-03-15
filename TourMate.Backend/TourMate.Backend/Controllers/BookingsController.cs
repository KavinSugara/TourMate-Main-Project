using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourMate.Backend.Data; // Replace with your actual namespace
using TourMate.Backend.Models;

namespace TourMate.Backend.Controllers
{
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

            booking.Status = status; // "Accepted" or "Declined"
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Booking {status}" });
        }
    }
}