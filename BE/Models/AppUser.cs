using Microsoft.AspNetCore.Identity;

namespace BE.Models;

public class AppUser : IdentityUser<int>
{
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Language> Languages { get; set; } = [];
    public ICollection<Lesson> Lessons { get; set; } = [];
}
