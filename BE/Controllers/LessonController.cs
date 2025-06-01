using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


using BE.Data;
using BE.Models;
using BE.Models.Dto;

namespace BE.Controllers
{
    /// <summary>
    /// Controller for lesson related operations.
    /// </summary>
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LessonController(ApplicationDbContext context, UserManager<AppUser> userManager) : ControllerBase
    {
        /// <summary>
        /// Retrieves all lessons from the database.
        /// </summary>
        /// <param name="parameters">Query parameters for pagination, filtering, and sorting.</param>
        /// <returns>A paginated list of lessons.</returns>
        /// <example>
        /// GET /api/Lesson?langId=1&pageNumber=1&pageSize=10&searchTerm=lesson1
        /// </example>
        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<LessonDto>>> GetLessons([FromQuery] LessonQueryParameters parameters)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var query = context.Lessons
                .Where(l => l.UserId == user.Id && l.LangId == parameters.LangId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
            {
                query = query.Where(l => l.Name.Contains(parameters.SearchTerm));
            }

            var totalCount = await query.CountAsync();

            if (!string.IsNullOrWhiteSpace(parameters.SortBy))
            {
                query = parameters.SortBy.ToLower() switch
                {
                    "name" => parameters.SortDescending ? query.OrderByDescending(l => l.Name) : query.OrderBy(l => l.Name),
                    _ => query.OrderBy(l => l.Name)
                };
            }
            else
            {
                query = query.OrderBy(l => l.Name);
            }

            var items = await query
                .Include(l => l.Words)
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .Select(l => new LessonDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    LanguageId = l.LangId,
                    WordIds = l.Words.Select(w => w.Id).ToList()
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<LessonDto>(items, totalCount, parameters.PageNumber, parameters.PageSize));
        }



        /// <summary>
        /// Retrieves a lesson by its ID.
        /// </summary>
        /// <param name="id">The ID of the lesson to retrieve.</param>
        /// <returns>Lesson with the given ID.</returns>
        /// <example>
        /// GET /api/Lesson/5
        /// </example>
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDto>> GetLesson(int id)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await GetLessonOfUser(id, user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            return new LessonDto
            {
                Id = lesson.Id,
                Name = lesson.Name,
                LanguageId = lesson.LangId,
                WordIds = lesson.Words.Select(wl => wl.Id).ToList()
            };
        }

        /// <summary>
        /// Creates a new lesson.
        /// </summary>
        /// <param name="createDto">The lesson to create.</param>
        /// <returns>The created lesson.</returns>
        /// <example>
        /// POST /api/Lesson
        /// {
        ///     "name": "Basic Verbs",
        ///     "languageId": 1,
        ///     "wordIds": [1, 2, 3]
        /// }
        /// </example>
        [HttpPost]
        public async Task<ActionResult<LessonDto>> CreateLesson(CreateLessonDto createDto)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = new Lesson
            {
                Name = createDto.Name,
                LangId = createDto.LanguageId,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (createDto.WordIds?.Count > 0)
            {
                lesson.Words = await GetWords(createDto.WordIds);
            }

            context.Lessons.Add(lesson);
            await context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, new LessonDto
            {
                Id = lesson.Id,
                Name = lesson.Name,
                LanguageId = lesson.LangId,
                WordIds = lesson.Words.Select(w => w.Id).ToList()
            });
        }

        /// <summary>
        /// Updates a specific lesson.
        /// </summary>
        /// <param name="id">The ID of the lesson to update.</param>
        /// <param name="updateDto">The updated lesson.</param>
        /// <returns>No content if successful.</returns>
        /// <example>
        /// PUT /api/Lesson/5
        /// {
        ///     "name": "Updated Verbs",
        ///     "wordIds": [1, 2, 4, 5]
        /// }
        /// </example>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto updateDto)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await GetLessonOfUser(id, user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            lesson.Words = await GetWords(updateDto.WordIds);
            lesson.Name = updateDto.Name;
            lesson.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Deletes a specific lesson.
        /// </summary>
        /// <param name="id">The ID of the lesson to delete.</param>
        /// <returns>No content if successful.</returns>
        /// <example>
        /// DELETE /api/Lesson/5
        /// </example>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await GetLessonOfUser(id, user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            context.Lessons.Remove(lesson);
            await context.SaveChangesAsync(); return NoContent();
        }

        /// <summary>
        /// Retrieves lessons by their IDs.
        /// </summary>
        /// <param name="langId">Required language ID to filter the lessons.</param>
        /// <param name="lessonIds">The IDs of the lessons to retrieve.</param>
        /// <returns>A list of lessons matching the provided IDs and filtered by language.</returns>
        /// <example>
        /// POST /api/Lesson/byIds?langId=1
        /// [1, 2, 3]
        /// </example>
        [Route("byIds")]
        [HttpPost]
        public async Task<ActionResult<IEnumerable<LessonDto>>> GetLessonsByIds([FromQuery] int langId, [FromBody] int[] lessonIds)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (lessonIds == null || lessonIds.Length == 0)
            {
                return BadRequest("Lesson IDs are required");
            }

            var query = context.Lessons
                .Include(l => l.Words)
                .Where(l => lessonIds.Contains(l.Id) && l.UserId == user.Id);
            query = query.Where(l => l.LangId == langId);

            var lessons = await query.ToListAsync();

            var lessonDtos = lessons.Select(l => new LessonDto
            {
                Id = l.Id,
                Name = l.Name,
                LanguageId = l.LangId,
                WordIds = l.Words.Select(w => w.Id).ToList()
            }).ToList();

            return Ok(lessonDtos);
        }

        private async Task<Lesson?> GetLessonOfUser(int lessonId, int userId)
        {
            return await context.Lessons
                .Include(l => l.Words)
                .FirstOrDefaultAsync(l => l.Id == lessonId && l.UserId == userId);
        }

        private async Task<List<Word>> GetWords(List<int> wordIds)
        {
            return await context.Words
                .Where(w => wordIds.Contains(w.Id))
                .ToListAsync();
        }
    }
}