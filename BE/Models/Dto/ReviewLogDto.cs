using BE.Models.Enums;

namespace BE.Models.Dto;

public class ReviewLogDto
{
    public int Id { get; set; }
    public int WordId { get; set; }
    public Rating Rating { get; set; }
    public DateTime ReviewDateTime { get; set; }
    public int? ReviewDuration { get; set; }
}
