using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourMate.Backend.Data;
using TourMate.Backend.Models;

namespace TourMate.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuidesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GuidesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("update/{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);
            if (guide == null)
            {
                return NotFound(new { message = "Guide profile not found." });
            }
            return Ok(guide);
        }

        [HttpPut("update/{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] Guide updatedInfo)
        {
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);
            if (guide == null)
            {
                return NotFound(new { message = "Guide profile not found for this user." });
            }

            guide.FullName = updatedInfo.FullName;
            guide.LicenseNumber = updatedInfo.LicenseNumber;
            guide.Category = updatedInfo.Category;
            guide.Specialization = updatedInfo.Specialization;
            guide.BaseRate = updatedInfo.BaseRate;

            if (!string.IsNullOrEmpty(updatedInfo.LicenseNumber))
            {
                guide.IsVerified = true;
                guide.LicenseStatus = "Approved";
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Professional profile updated and verified successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating profile", details = ex.Message });
            }
        }

        [HttpPut("update-location/{userId}")]
        public async Task<IActionResult> UpdateLocation(int userId, [FromBody] LocationUpdate model)
        {
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);
            if (guide == null) return NotFound(new { message = "Guide not found." });

            guide.Latitude = model.Latitude;
            guide.Longitude = model.Longitude;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Location updated successfully." });
        }

        [HttpPatch("toggle-availability/{userId}")]
        public async Task<IActionResult> ToggleAvailability(int userId, [FromBody] bool isAvailable)
        {
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);
            if (guide == null) return NotFound(new { message = "Guide not found." });

            guide.IsAvailable = isAvailable;
            await _context.SaveChangesAsync();
            return Ok(new { status = guide.IsAvailable });
        }

        [HttpGet("public-profile/{userId}")]
        public async Task<IActionResult> GetPublicProfile(int userId)
        {
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);
            if (guide == null) return NotFound();

            var completedBookings = await _context.Bookings
                .Where(b => b.GuideId == userId && b.Status == "Completed")
                .ToListAsync();

            var reviews = completedBookings
                .Where(b => b.Rating != null)
                .Select(b => new { b.TouristName, b.Rating, b.ReviewComment, b.EndTime })
                .OrderByDescending(b => b.EndTime)
                .ToList();

            double avgRating = reviews.Any() ? Math.Round(reviews.Average(r => (double)r.Rating!), 1) : 0.0;

            return Ok(new
            {
                guide.FullName,
                guide.Category,
                guide.Specialization,
                guide.BaseRate,
                guide.IsVerified,
                guide.LicenseNumber,
                AverageRating = avgRating,
                TotalReviews = reviews.Count,
                ReviewHistory = reviews
            });
        }

        [HttpGet("earnings/{userId}")]
        public async Task<IActionResult> GetGuideEarnings(int userId)
        {
            var completedTrips = await _context.Bookings
                .Where(b => b.GuideId == userId && b.Status == "Completed")
                .ToListAsync();

            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);
            if (guide == null) return NotFound();

            decimal totalEarnings = completedTrips.Count * (guide.BaseRate ?? 0);
            return Ok(new
            {
                TotalEarnings = totalEarnings,
                TotalTrips = completedTrips.Count
            });
        }

        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllGuidesForAdmin()
        {
            var guides = await _context.Guides.ToListAsync();
            return Ok(guides);
        }

        // FIXED METHOD BELOW
        [HttpPatch("verify/{guideId}")]
        public async Task<IActionResult> VerifyGuide(int guideId, [FromBody] bool isVerified)
        {
            var guide = await _context.Guides.FindAsync(guideId);
            if (guide == null) return NotFound();

            guide.IsVerified = isVerified;
            guide.LicenseStatus = isVerified ? "Approved" : "Rejected";

            // Change SaveChanges() to SaveChangesAsync()
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Guide verification set to {isVerified}" });
        }
    }

    public class LocationUpdate
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}