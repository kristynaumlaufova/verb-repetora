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
    public DbSet<ReviewLog> ReviewLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure unique indexes
        modelBuilder.Entity<Language>()
            .HasIndex(l => new { l.UserId, l.Name })
            .IsUnique();

        modelBuilder.Entity<Lesson>()
            .HasIndex(l => l.Name)
            .IsUnique(); modelBuilder.Entity<WordType>()
            .HasIndex(wt => new { wt.LangId, wt.Name })
            .IsUnique();

        // Configure cascade delete for Language relationships
        modelBuilder.Entity<Language>()
            .HasMany(l => l.Lessons)
            .WithOne(l => l.Language)
            .HasForeignKey(l => l.LangId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Language>()
            .HasMany(l => l.WordTypes)
            .WithOne(wt => wt.Language)
            .HasForeignKey(wt => wt.LangId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Language>()
            .HasMany(l => l.Words)
            .WithOne(w => w.Language)
            .HasForeignKey(w => w.LanguageId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure cascade delete for WordType->Word relationship
        modelBuilder.Entity<WordType>()
            .HasMany(wt => wt.Words)
            .WithOne(w => w.WordType)
            .HasForeignKey(w => w.WordTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure the many-to-many relationship between Lesson and Word
        modelBuilder.Entity<Lesson>()
            .HasMany(l => l.Words)
            .WithMany(w => w.Lessons);

        // Configure the relationship between Word and ReviewLog
        modelBuilder.Entity<Word>()
            .HasMany<ReviewLog>()
            .WithOne(r => r.Word)
            .HasForeignKey(r => r.WordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
