namespace TourMate.Backend.Services
{
    public class VerificationService
    {
        public bool IsLicenseValid(string licenseId)
        {
            if (string.IsNullOrWhiteSpace(licenseId)) return false;

            return licenseId.StartsWith("SLTDA-") && licenseId.Length >= 10;
        }
    }
}
