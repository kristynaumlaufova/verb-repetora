using System.ComponentModel.DataAnnotations;

namespace BE.Models;

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
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<WordType> WordTypes { get; set; } = new List<WordType>();
}
