using System.ComponentModel.DataAnnotations;

namespace BE.Models;

public class AppUser
{
    public int Id { get; set; }

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Language> Languages { get; set; } = new List<Language>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}
