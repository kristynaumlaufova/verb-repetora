using System.ComponentModel.DataAnnotations;

namespace BE.Models;

public class Word
{
    public int Id { get; set; }

    [Required]
    public int WordTypeId { get; set; }

    [Required]
    public int LanguageId { get; set; }

    // Navigation properties
    public WordType WordType { get; set; } = null!;
    public Language Language { get; set; } = null!;
    public ICollection<WordInLesson> WordInLessons { get; set; } = new List<WordInLesson>();
}
