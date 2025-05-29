namespace BE.Models.Dto;

public record WordDto(
    int Id,
    int WordTypeId,
    int LanguageId,
    string Keyword,
    string Fields
);

public record CreateWordRequest(
    int LanguageId,
    int WordTypeId,
    string Keyword,
    string Fields
);

public record UpdateWordRequest(
    int Id,
    int WordTypeId,
    string Keyword,
    string Fields
);

public record WordQueryParameters(
    int LangId,
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    string? SortBy = null,
    bool SortDescending = false
);
