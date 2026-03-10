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

            if (guide == null)
            {
                return NotFound(new { message = "Guide not found." });
            }

            guide.Latitude = model.Latitude;
            guide.Longitude = model.Longitude;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Location updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating location", details = ex.Message });
            }
        }

        [HttpPatch("toggle-availability/{userId}")]
        public async Task<IActionResult> ToggleAvailability(int userId, [FromBody] bool isAvailable)
        {
            var guide = await _context.Guides.FirstOrDefaultAsync(g => g.UserId == userId);

            if (guide == null)
            {
                return NotFound(new { message = "Guide not found." });
            }

            guide.IsAvailable = isAvailable;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { status = guide.IsAvailable });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating availability", details = ex.Message });
            }
        }
    }
    public class LocationUpdate
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}