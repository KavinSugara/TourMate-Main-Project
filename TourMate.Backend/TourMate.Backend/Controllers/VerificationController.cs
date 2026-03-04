using Microsoft.AspNetCore.Mvc;
using TourMate.Backend.Services;

namespace TourMate.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VerificationController : ControllerBase
    {
        private readonly VerificationService _verificationService;

        public VerificationController(VerificationService verificationService)
        {
            _verificationService = verificationService;
        }

        [HttpGet("verify-license/{licenseId}")]
        public IActionResult Verify(string licenseId)
        {
            bool isValid = _verificationService.IsLicenseValid(licenseId);
            if (isValid)
            {
                return Ok(new { status = "Verified", message = "Valid SLTDA license.", verifiedAt = DateTime.UtcNow });
            }
            return BadRequest(new { status = "Invalid", message = "Incorrect license format." });
        }
    }
}