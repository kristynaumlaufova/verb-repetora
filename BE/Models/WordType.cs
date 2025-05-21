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

    public string? Field1 { get; set; }
    public string? Field2 { get; set; }
    public string? Field3 { get; set; }
    public string? Field4 { get; set; }
    public string? Field5 { get; set; }

    // Navigation properties
    public Language Language { get; set; } = null!;
    public ICollection<Word> Words { get; set; } = new List<Word>();
}
