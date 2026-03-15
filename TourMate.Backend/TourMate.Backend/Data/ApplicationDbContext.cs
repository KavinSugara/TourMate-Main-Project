using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using TourMate.Backend.Models;

namespace TourMate.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Guide> Guides { get; set; }
        public DbSet<Booking> Bookings { get; set; }
    }
}