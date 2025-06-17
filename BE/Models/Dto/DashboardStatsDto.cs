namespace BE.Models.Dto;

public class DashboardStatsDto
{
    public int DueWords { get; set; }
    public int TotalWords { get; set; }
    public StateDistributionDto? StateDistribution { get; set; }
    public List<DailyNewWordsDto>? DailyNewWords { get; set; }
}

public class StateDistributionDto
{
    public int New { get; set; }
    public int Learning { get; set; }
    public int Review { get; set; }
    public int Relearning { get; set; }
}

public class DailyNewWordsDto
{
    public string? Date { get; set; }
    public int Count { get; set; }
}
