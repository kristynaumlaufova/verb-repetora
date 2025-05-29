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



        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDto>> GetLesson(int id)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await context.Lessons
                .Include(l => l.Words)
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
                WordIds = lesson.Words.Select(wl => wl.Id).ToList()
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
                    lesson.Words.Add(word);
                }
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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto updateDto)
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var lesson = await context.Lessons
                .Include(l => l.Words)
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
            var currentWordIds = lesson.Words.Select(w => w.Id).ToHashSet();
            var newWordIds = updateDto.WordIds.ToHashSet();

            // Get all current words as a collection to modify
            var currentWords = new List<Word>(lesson.Words);

            // Remove words that are no longer in the list
            foreach (var word in currentWords)
            {
                if (!newWordIds.Contains(word.Id))
                {
                    lesson.Words.Remove(word);
                    shouldUpdate = true;
                }
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
                    lesson.Words.Add(word);
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
                .Include(l => l.Words)
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
                // Check if lesson already has this word
                if (!lesson.Words.Any(w => w.Id == word.Id))
                {
                    lesson.Words.Add(word);
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
                .Include(l => l.Words)
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

            if (lesson == null)
            {
                return NotFound();
            }

            // Find words to remove
            var wordsToRemove = lesson.Words
                .Where(w => removeDto.WordIds.Contains(w.Id))
                .ToList();

            if (!wordsToRemove.Any())
            {
                return NotFound();
            }

            // Remove words from the relationship
            foreach (var word in wordsToRemove)
            {
                lesson.Words.Remove(word);
            }

            lesson.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return NoContent();
        }
    }
}