namespace BE.Models.Dto
{
    public class LessonDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int LanguageId { get; set; }
        public List<int> WordIds { get; set; } = [];
    }
    public class CreateLessonDto
    {
        public string Name { get; set; } = string.Empty;
        public int LanguageId { get; set; }
        public List<int> WordIds { get; set; } = [];
    }

    public class UpdateLessonDto
    {
        public string Name { get; set; } = string.Empty;
        public List<int> WordIds { get; set; } = [];
    }

    public class AssignWordsDto
    {
        public List<int> WordIds { get; set; } = [];
    }
}
