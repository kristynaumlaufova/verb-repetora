using BE.Models.Enums;

namespace BE.Models.Dto;

public record WordDto(
    int Id,
    int WordTypeId,
    int LanguageId,
    string Keyword,
    string Fields,
    LearningState State = LearningState.New,
    int? Step = null,
    double? Stability = null,
    double? Difficulty = null,
    DateTime Due = default,
    DateTime? LastReview = null,
    DateTime? FirstReview = null
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

public record UpdateFSRSDataRequest(
    int Id,
    LearningState State,
    int? Step,
    double? Stability,
    double? Difficulty,
    DateTime Due,
    DateTime? LastReview,
    DateTime? FirstReview = null
);
