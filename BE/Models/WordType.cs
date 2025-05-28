using System.ComponentModel.DataAnnotations;

namespace BE.Models;

public class WordType
{
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int LangId { get; set; }
    [Required]
    public string Name { get; set; } = string.Empty;

    public string Fields { get; set; } = string.Empty;

    // Navigation properties
    public Language Language { get; set; } = null!;
    public ICollection<Word> Words { get; set; } = [];
}
