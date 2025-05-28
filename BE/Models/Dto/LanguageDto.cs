namespace BE.Models.Dto;

public record LanguageDto(int Id, string Name, DateTime CreatedAt, DateTime UpdatedAt);

public record CreateLanguageRequest(string Name);

public record UpdateLanguageRequest(int Id, string Name);
