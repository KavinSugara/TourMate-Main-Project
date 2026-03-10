using TourMate.Backend.Models;
using System.Linq;

namespace TourMate.Backend.Data
{
    public static class DataSeeder
    {
        public static void SeedData(ApplicationDbContext context)
        {
            if (!context.Guides.Any())
            {
                var defaultUser = context.Users.FirstOrDefault() ?? new User
                {
                    Email = "system@tourmate.com",
                    PasswordHash = "system_default",
                    UserRole = "Guide"
                };

                if (defaultUser.Id == 0)
                {
                    context.Users.Add(defaultUser);
                    context.SaveChanges();
                }

                context.Guides.AddRange(
                    new Guide { FullName = "Arjuna Perera", LicenseNumber = "N-7721", Category = "National", Latitude = 7.1550, Longitude = 80.0550, IsVerified = true, Specialization = "Cultural Triangle", LicenseStatus = "Pending", UserId = defaultUser.Id },
                    new Guide { FullName = "Kasun Silva", LicenseNumber = "C-4432", Category = "Chauffeur", Latitude = 7.1600, Longitude = 80.0600, IsVerified = true, Specialization = "Wildlife Safaris", LicenseStatus = "Pending", UserId = defaultUser.Id },
                    new Guide { FullName = "Nuwan Jayasuriya", LicenseNumber = "S-1092", Category = "Site", Latitude = 7.1500, Longitude = 80.0500, IsVerified = true, Specialization = "Veyangoda History", LicenseStatus = "Pending", UserId = defaultUser.Id },
                    new Guide { FullName = "Saman Kumara", LicenseNumber = "N-5561", Category = "National", Latitude = 7.1580, Longitude = 80.0450, IsVerified = false, Specialization = "Hiking", LicenseStatus = "Pending", UserId = defaultUser.Id }
                );

                context.SaveChanges();
            }
        }
    }
}