using Microsoft.EntityFrameworkCore;
using BE.Models;

namespace BE.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<AppUser> Users { get; set; }
    public DbSet<Language> Languages { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<WordType> WordTypes { get; set; }
    public DbSet<Word> Words { get; set; }
    public DbSet<WordInLesson> WordInLessons { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure unique constraints
        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Language>()
            .HasIndex(l => l.Name)
            .IsUnique();

        modelBuilder.Entity<Lesson>()
            .HasIndex(l => l.Name)
            .IsUnique();

        modelBuilder.Entity<WordType>()
            .HasIndex(wt => wt.Name)
            .IsUnique();
    }
}
