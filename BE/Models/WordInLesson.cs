using System.ComponentModel.DataAnnotations;

namespace BE.Models;

public class WordInLesson
{
    public int Id { get; set; }

    [Required]
    public int WordId { get; set; }

    [Required]
    public int LessonId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Word Word { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
}
