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

        public async Task<List<object>> GetNearbyGuidesAsync(double touristLat, double touristLon, double radiusKm, string? category = null)
        {
            var query = _context.Guides.Where(g =>
                g.IsActive &&
                g.IsAvailable &&
                g.IsVerified &&
                g.Latitude != null &&
                g.Longitude != null);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(g => g.Category == category);
            }

            var candidates = await query.ToListAsync();

            var result = new List<object>();

            foreach (var g in candidates)
            {
                double dist = CalculateDistance(touristLat, touristLon, (double)g.Latitude!, (double)g.Longitude!);

                if (dist <= radiusKm)
                {
                    // Calculate Reputation for this guide
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

            return result.OrderBy(x => ((dynamic)x).Distance).ToList();
        }
    }
}