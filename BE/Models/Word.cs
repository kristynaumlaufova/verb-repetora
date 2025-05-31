using System.ComponentModel.DataAnnotations;
using BE.Models.Enums;

namespace BE.Models;

public class Word
{
    public int Id { get; set; }

    [Required]
    public int WordTypeId { get; set; }

    [Required] public int LanguageId { get; set; }

    [Required]
    public string Keyword { get; set; } = string.Empty;

    public string Fields { get; set; } = string.Empty;

    // FSRS fields
    public LearningState State { get; set; } = LearningState.New;
    public int? Step { get; set; } = null;
    public double? Stability { get; set; } = null;
    public double? Difficulty { get; set; } = null;
    public DateTime Due { get; set; } = DateTime.UtcNow;
    public DateTime? LastReview { get; set; } = null;

    // For statistics
    public DateTime? FirstReview { get; set; } = null;

    // Navigation properties
    public WordType WordType { get; set; } = null!;
    public Language Language { get; set; } = null!;

    // Skip navigation property for many-to-many relationship
    public ICollection<Lesson> Lessons { get; set; } = [];
}
