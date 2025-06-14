namespace BE.Models.Dto;

public record WordTypeDto(
    int Id,
    int UserId,
    int LangId,
    string Name,
    string Fields
);

public record CreateWordTypeRequest(
    int LangId,
    string Name,
    string Fields
);

public record UpdateWordTypeRequest(
    int Id,
    string Name,
    string Fields
);
