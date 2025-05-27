using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BE.Models;

namespace BE.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<AppUser, IdentityRole<int>, int>(options)
{
    public DbSet<Language> Languages { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<WordType> WordTypes { get; set; }
    public DbSet<Word> Words { get; set; }
    public DbSet<WordInLesson> WordInLessons { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Language>()
            .HasIndex(l => new { l.UserId, l.Name })
            .IsUnique();

        modelBuilder.Entity<Lesson>()
            .HasIndex(l => l.Name)
            .IsUnique();

        modelBuilder.Entity<WordType>()
            .HasIndex(wt => wt.Name)
            .IsUnique();
    }
}
