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

        [HttpPost("request/{guideId}")]
        public async Task<IActionResult> RequestGuide(int guideId, [FromBody] string touristName)
        {
            var guide = await _context.Guides.FindAsync(guideId);

            if (guide == null)
            {
                return NotFound("Guide not found in database.");
            }

       
            var notification = new
            {
                guideId = guide.Id,
                fullName = guide.FullName,
                touristName = touristName,
                message = $"New booking request for {guide.FullName}!"
            };

            await _hubContext.Clients.All.SendAsync("ReceiveBookingRequest", notification);

            return Ok(new { Message = "Notification sent successfully", Data = notification });
        }
    }
}