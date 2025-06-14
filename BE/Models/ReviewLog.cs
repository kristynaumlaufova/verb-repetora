using System.ComponentModel.DataAnnotations;

using BE.Models.Enums;

namespace BE.Models;

public class ReviewLog
{
    public int Id { get; set; }

    [Required]
    public int WordId { get; set; }

    [Required]
    public Rating Rating { get; set; }

    [Required]
    public DateTime ReviewDateTime { get; set; } = DateTime.UtcNow;

    public int? ReviewDuration { get; set; }

    // Navigation property
    public Word Word { get; set; } = null!;
}
