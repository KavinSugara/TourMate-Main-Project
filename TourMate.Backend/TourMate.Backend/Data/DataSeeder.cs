//using TourMate.Backend.Models;
//namespace TourMate.Backend.Data

//{
//    public static class DataSeeder
//    {
//        public static void SeedGuides(ApplicationDbContext context)
//        {
//            if (!context.Guides.Any())
//            {
//                context.Guides.AddRange(
//                    new Guide { FullName = "Arjuna Perera", LicenseNumber = "N-7721", Category = "National", Latitude = 7.1550m, Longitude = 80.0550m, IsVerified = true, Specialization = "Cultural Triangle" },
//                    new Guide { FullName = "Kasun Silva", LicenseNumber = "C-4432", Category = "Chauffeur", Latitude = 7.1600m, Longitude = 80.0600m, IsVerified = true, Specialization = "Wildlife Safaris" },
//                    new Guide { FullName = "Nuwan Jayasuriya", LicenseNumber = "S-1092", Category = "Site", Latitude = 7.1500m, Longitude = 80.0500m, IsVerified = true, Specialization = "Veyangoda History" },
//                    new Guide { FullName = "Saman Kumara", LicenseNumber = "N-5561", Category = "National", Latitude = 7.1580m, Longitude = 80.0450m, IsVerified = false, Specialization = "Hiking" }
//                );
//                context.SaveChanges();
//            }
//        }
//    }
//}
