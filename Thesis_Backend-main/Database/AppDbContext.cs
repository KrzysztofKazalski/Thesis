using Thesis_backend.Models;

namespace Thesis_backend.Database;

using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    protected readonly IConfiguration Configuration;

    public AppDbContext(IConfiguration configuration)
    {
        Configuration = configuration;
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // postgresql connection, connection string found in appsettings.json
        optionsBuilder.UseNpgsql(Configuration.GetConnectionString("POSTGRESQL_DB_CONNECTION_STRING"));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        //User-Document relation
        modelBuilder.Entity<User>()
            .HasMany(u => u.Documents)
            .WithOne(d => d.User)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Document>()
            .HasOne(d => d.User)
            .WithMany(u => u.Documents)
            .HasForeignKey(d => d.UserId);
        
        // When deleting a document or category, we want to erase references in the other object as well
        // Document-SpendingCategory relation
        modelBuilder.Entity<Document>()
            .HasMany(d => d.SpendingCategories)
            .WithMany(s => s.Documents);
        modelBuilder.Entity<SpendingCategory>()
            .HasMany(s => s.Documents)
            .WithMany(d => d.SpendingCategories);
        
        // When deleting a User, we want to cascade delete all SpendingCategories and Documents
        // When deleting a SpendingCategory, we want to remove references in Documents and Users
        // SpendingCategory-User relations
        modelBuilder.Entity<User>()
            .HasMany(u => u.SpendingCategories)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SpendingCategory>()
            .HasOne(s => s.User)
            .WithMany(u => u.SpendingCategories)
            .HasForeignKey(s => s.UserId);
    }

    public DbSet<User> Users { get; set; }
    
    public DbSet<Document> Documents { get; set; }
    
    public DbSet<SpendingCategory> SpendingCategories { get; set; }
}