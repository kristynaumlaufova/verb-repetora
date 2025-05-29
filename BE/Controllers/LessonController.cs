using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


using BE.Data;
using BE.Models;
using BE.Models.Dto;

namespace BE.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LessonController(ApplicationDbContext context, UserManager<AppUser> userManager) : ControllerBase
    {
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
            }            var items = await query
                .Include(l => l.WordInLessons)
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .Select(l => new LessonDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    LanguageId = l.LangId,
                    WordIds = l.WordInLessons.Select(wl => wl.WordId).ToList()
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<LessonDto>(items, totalCount, parameters.PageNumber, parameters.PageSize));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDto>> GetLesson(int id)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized(); var lesson = await context.Lessons
                .Include(l => l.WordInLessons)
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            return new LessonDto
            {
                Id = lesson.Id,
                Name = lesson.Name,
                LanguageId = lesson.LangId,
                WordIds = lesson.WordInLessons.Select(wl => wl.WordId).ToList()
            };
        }
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

            if (createDto.WordIds?.Any() == true)
            {
                var words = await context.Words
                    .Where(w => createDto.WordIds.Contains(w.Id))
                    .ToListAsync();

                foreach (var word in words)
                {
                    lesson.WordInLessons.Add(new WordInLesson
                    {
                        WordId = word.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            context.Lessons.Add(lesson);
            await context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, new LessonDto
            {
                Id = lesson.Id,
                Name = lesson.Name,
                LanguageId = lesson.LangId,
                WordIds = lesson.WordInLessons.Select(wl => wl.WordId).ToList()
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto updateDto)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized(); var lesson = await context.Lessons
                .Include(l => l.WordInLessons)
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            bool shouldUpdate = false;

            // Update name if changed
            if (lesson.Name != updateDto.Name)
            {
                lesson.Name = updateDto.Name;
                shouldUpdate = true;
            }

            // Update word assignments
            var currentWordIds = lesson.WordInLessons.Select(w => w.WordId).ToHashSet();
            var newWordIds = updateDto.WordIds.ToHashSet();

            // Remove words that are no longer in the list
            var wordsToRemove = lesson.WordInLessons.Where(wl => !newWordIds.Contains(wl.WordId)).ToList();
            if (wordsToRemove.Any())
            {
                foreach (var wordInLesson in wordsToRemove)
                {
                    lesson.WordInLessons.Remove(wordInLesson);
                }
                shouldUpdate = true;
            }

            // Add new words
            var wordsToAdd = newWordIds.Except(currentWordIds);
            if (wordsToAdd.Any())
            {
                var words = await context.Words
                    .Where(w => wordsToAdd.Contains(w.Id))
                    .ToListAsync();

                foreach (var word in words)
                {
                    lesson.WordInLessons.Add(new WordInLesson
                    {
                        WordId = word.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                shouldUpdate = true;
            }

            if (shouldUpdate)
            {
                lesson.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await context.Lessons
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            context.Lessons.Remove(lesson);
            await context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/words")]
        public async Task<IActionResult> AssignWords(int id, AssignWordsDto assignDto)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await context.Lessons
                .Include(l => l.WordInLessons)
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            var words = await context.Words
                .Where(w => assignDto.WordIds.Contains(w.Id))
                .ToListAsync();

            foreach (var word in words)
            {
                if (!lesson.WordInLessons.Any(wl => wl.WordId == word.Id))
                {
                    lesson.WordInLessons.Add(new WordInLesson
                    {
                        LessonId = id,
                        WordId = word.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            lesson.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}/words")]
        public async Task<IActionResult> RemoveWords(int id, AssignWordsDto removeDto)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await context.Lessons
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            var wordsInLesson = await context.Set<WordInLesson>()
                .Where(wl => wl.LessonId == id && removeDto.WordIds.Contains(wl.WordId))
                .ToListAsync();

            if (!wordsInLesson.Any())
            {
                return NotFound();
            }

            context.Set<WordInLesson>().RemoveRange(wordsInLesson);
            lesson.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return NoContent();
        }
    }
}