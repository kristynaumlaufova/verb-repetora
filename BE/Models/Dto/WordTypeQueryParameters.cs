namespace BE.Models.Dto;

public record WordTypeQueryParameters(
    int LangId,
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    string? SortBy = null,
    bool SortDescending = false
);
