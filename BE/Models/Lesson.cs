using System.ComponentModel.DataAnnotations;

namespace BE.Models;

public class Lesson
{
    public int Id { get; set; }

    [Required]
    public int LangId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Language Language { get; set; } = null!;
    public AppUser User { get; set; } = null!;

    // Skip navigation property for many-to-many relationship
    public ICollection<Word> Words { get; set; } = [];
}
