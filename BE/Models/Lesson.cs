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
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Language Language { get; set; } = null!;
    public AppUser User { get; set; } = null!;
    public ICollection<WordInLesson> WordInLessons { get; set; } = [];
}
