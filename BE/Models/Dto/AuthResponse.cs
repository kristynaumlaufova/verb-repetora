namespace BE.Models.Dto;

public class AuthResponse
{
    public string Message { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public IEnumerable<LanguageDto> Languages { get; set; } = new List<LanguageDto>();
}

public class LanguageDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}