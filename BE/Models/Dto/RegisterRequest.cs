using System.ComponentModel.DataAnnotations;

namespace BE.Models.Dto;

public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters long")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language is required")]
    [MinLength(2, ErrorMessage = "Language name must be at least 2 characters long")]
    [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Language can only contain letters and spaces")]
    public string Language { get; set; } = string.Empty;
}