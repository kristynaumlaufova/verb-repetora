namespace BE.Models.Dto;

public record AuthResponse(string Message, UserDto User);

public record UserDto(int Id, string Username);

public record LanguageDto(int Id, string Name);

public record LoginRequest(string Username, string Password);

public record RegisterRequest(string Username, string Password, string Language);
