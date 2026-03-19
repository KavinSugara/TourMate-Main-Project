using Microsoft.EntityFrameworkCore;
using TourMate.Backend.Models;
using TourMate.Backend.Data;

namespace TourMate.Backend.Services
{
    public class MatchingService
    {
        private readonly ApplicationDbContext _context;
        private const double EarthRadiusKm = 6371.0;

        public MatchingService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Haversine formula to calculate distance between two GPS points
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }

        private double ToRadians(double angle) => Math.PI * angle / 180.0;

        public async Task<List<object>> GetNearbyGuidesAsync(
            double touristLat,
            double touristLon,
            double radiusKm,
            string? category = null,
            string? specialization = null)
        {
            // 1. IDENTIFY BUSY GUIDES
            var busyGuideIds = await _context.Bookings
                .Where(b => b.Status == "Active" || b.Status == "Accepted")
                .Select(b => b.GuideId)
                .Distinct()
                .ToListAsync();

            // 2. INITIAL FILTERING
            // Note: I have commented out g.IsVerified so you can test guides immediately.
            // Ensure you click "Go Online" in the Guide Dashboard to set IsAvailable to True.
            var query = _context.Guides.Where(g =>
                g.IsActive &&
                g.IsAvailable &&
                // g.IsVerified && // <--- Commented out for testing visibility
                g.Latitude != null &&
                g.Longitude != null &&
                !busyGuideIds.Contains(g.UserId));

            // 3. APPLY CATEGORY FILTER
            if (!string.IsNullOrEmpty(category) && category != "All")
            {
                query = query.Where(g => g.Category == category);
            }

            // 4. APPLY SPECIALIZATION FILTER
            if (!string.IsNullOrEmpty(specialization) && specialization != "All")
            {
                query = query.Where(g => g.Specialization.Contains(specialization));
            }

            var candidates = await query.ToListAsync();
            var result = new List<object>();

            // 5. CALCULATE DISTANCE AND REPUTATION
            foreach (var g in candidates)
            {
                double dist = CalculateDistance(touristLat, touristLon, (double)g.Latitude!, (double)g.Longitude!);

                if (dist <= radiusKm)
                {
                    var reviews = _context.Bookings
                        .Where(b => b.GuideId == g.UserId && b.Status == "Completed" && b.Rating != null)
                        .Select(b => b.Rating.Value)
                        .ToList();

                    double avgRating = reviews.Any() ? Math.Round(reviews.Average(), 1) : 0.0;
                    int reviewCount = reviews.Count;

                    result.Add(new
                    {
                        g.Id,
                        g.UserId,
                        g.FullName,
                        g.Category,
                        g.Specialization,
                        g.BaseRate,
                        g.Latitude,
                        g.Longitude,
                        g.IsVerified,
                        AverageRating = avgRating,
                        ReviewCount = reviewCount,
                        Distance = Math.Round(dist, 2)
                    });
                }
            }

            // 6. SORT BY DISTANCE
            return result.OrderBy(x => ((dynamic)x).Distance).ToList();
        }
    }
}