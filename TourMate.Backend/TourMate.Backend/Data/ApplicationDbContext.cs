using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using TourMate.Backend.Models;

namespace TourMate.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Guide> Guides { get; set; }
    }
}