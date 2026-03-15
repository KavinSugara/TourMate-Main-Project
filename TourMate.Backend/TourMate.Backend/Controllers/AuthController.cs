using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourMate.Backend.Data;
using TourMate.Backend.Models;

namespace TourMate.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
                return BadRequest(new { message = "User already exists." });

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            if (user.UserRole == "Guide")
            {
                var newGuide = new Guide
                {
                    UserId = user.Id,
                    FullName = "New Guide", 
                    LicenseStatus = "Pending",
                    IsActive = true,
                    IsAvailable = false,
                    IsVerified = false
                };
                _context.Guides.Add(newGuide);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Registration successful!", role = user.UserRole });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User loginData)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginData.Email && u.PasswordHash == loginData.PasswordHash);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(new
            {
                email = user.Email,
                role = user.UserRole,
                userId = user.Id
            });
        }
    }
}