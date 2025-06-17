using Microsoft.AspNetCore.Identity;
using System.Text.Json;

namespace BE.Models;

public class AppUser : IdentityUser<int>
{
    private static readonly double[] weights = [
    0.2172,
    1.1771,
    3.2602,
    16.1507,
    7.0114,
    0.57,
    2.0966,
    0.0069,
    1.5261,
    0.112,
    1.0178,
    1.849,
    0.1133,
    0.3127,
    2.2934,
    0.2191,
    3.0004,
    0.7536,
    0.3332,
    0.1437,
    0.2,
    ];

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Model weights of the FSRS algorithm
    public string Weights { get; set; } = JsonSerializer.Serialize(weights);

    // Navigation properties
    public ICollection<Language> Languages { get; set; } = [];
    public ICollection<Lesson> Lessons { get; set; } = [];
}
