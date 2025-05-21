using System.ComponentModel.DataAnnotations;

namespace BE.Models;

public class WordInLesson
{
    public int Id { get; set; }

    [Required]
    public int WordId { get; set; }

    // Navigation properties
    public Word Word { get; set; } = null!;
}
