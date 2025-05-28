namespace BE.Models.Dto;

public record PaginatedResponse<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize
);

public record LanguageQueryParameters(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    string? SortBy = null,
    bool SortDescending = false
);
