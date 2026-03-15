using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TourMate.Backend.Hubs;
using TourMate.Backend.Models;
using TourMate.Backend.Services;
using TourMate.Backend.Data;

namespace TourMate.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchingController : ControllerBase
    {
        private readonly MatchingService _matchingService;
        private readonly IHubContext<TourMateHub> _hubContext;
        private readonly ApplicationDbContext _context;

        public MatchingController(
            MatchingService matchingService,
            IHubContext<TourMateHub> hubContext,
            ApplicationDbContext context)
        {
            _matchingService = matchingService;
            _hubContext = hubContext;
            _context = context;
        }

        [HttpGet("nearby")]
        public async Task<ActionResult<List<Guide>>> GetNearbyGuides(
            [FromQuery] double lat,
            [FromQuery] double lon,
            [FromQuery] double radiusKm = 20.0,
            [FromQuery] string? category = null)
        {
            try
            {
                var guides = await _matchingService.GetNearbyGuidesAsync(lat, lon, radiusKm, category);

                if (guides == null || !guides.Any())
                    return NotFound(new { message = "No verified guides matching your criteria were found." });

                return Ok(guides);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal error", details = ex.Message });
            }
        }

        // FIXED: Now accepts a Booking object from the frontend to prevent 400 Bad Request
        [HttpPost("request/{guideId}")]
        public async Task<IActionResult> RequestGuide(int guideId, [FromBody] Booking bookingRequest)
        {
            // Search for guide by either their primary ID or their associated UserId
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.Id == guideId || g.UserId == guideId);

            if (guide == null)
            {
                return NotFound("Guide not found in database.");
            }

            // Create a rich notification object for SignalR
            var notification = new
            {
                bookingId = bookingRequest.BookingId, // The ID from your SQL Bookings table
                guideId = guide.UserId,
                touristName = bookingRequest.TouristName,
                bookingDate = DateTime.Now,
                message = $"New booking request for {guide.FullName}!"
            };

            // BROADCAST: This sends the request to the Guide Dashboard instantly
            await _hubContext.Clients.All.SendAsync("ReceiveBookingRequest", notification);

            return Ok(new { Message = "Notification sent successfully", Data = notification });
        }
    }
}