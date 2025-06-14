using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace BE.Models;

[Index(nameof(UserId), nameof(Name), IsUnique = true)]
public class Language
{
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public AppUser User { get; set; } = null!;
    public ICollection<Lesson> Lessons { get; set; } = [];
    public ICollection<WordType> WordTypes { get; set; } = [];
    public ICollection<Word> Words { get; set; } = [];
}
