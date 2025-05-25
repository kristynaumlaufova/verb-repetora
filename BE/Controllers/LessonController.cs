using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

/// <summary>
/// Controller for lesson related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class LessonController(ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Retrieves all lessons from the database.
    /// </summary>
    /// <returns>A list of all lessons.</returns>
    /// <example>
    /// GET /api/Lesson
    /// </example>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Lesson>>> GetLessons()
    {
        return await context.Lessons.ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific lesson by its ID.
    /// </summary>
    /// <param name="id">The ID of the lesson to retrieve.</param>
    /// <returns>The requested lesson if found.</returns>
    /// <example>
    /// GET /api/Lesson/5
    /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<Lesson>> GetLesson(int id)
    {
        var lesson = await context.Lessons.FindAsync(id);

        if (lesson == null)
        {
            return NotFound();
        }

        return lesson;
    }

    /// <summary>
    /// Creates a new lesson.
    /// </summary>
    /// <param name="lesson">The lesson object to create.</param>
    /// <returns>The created lesson.</returns>
    /// <example>
    /// POST /api/Lesson
    /// {
    ///     "name": "Basic Greetings",
    ///     "description": "Learn common greeting phrases",
    ///     "languageId": 1
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<Lesson>> CreateLesson(Lesson lesson)
    {
        context.Lessons.Add(lesson);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLesson), new { id = lesson.Id }, lesson);
    }

    /// <summary>
    /// Updates a specific lesson.
    /// </summary>
    /// <param name="id">The ID of the lesson to update.</param>
    /// <param name="lesson">The updated lesson object.</param>
    /// <example>
    /// PUT /api/Lesson/5
    /// {
    ///     "id": 5,
    ///     "name": "Updated Greetings",
    ///     "description": "Updated lesson description",
    ///     "languageId": 1
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLesson(int id, Lesson lesson)
    {
        if (id != lesson.Id)
        {
            return BadRequest();
        }

        context.Entry(lesson).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!LessonExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    /// <summary>
    /// Deletes a specific lesson.
    /// </summary>
    /// <param name="id">The ID of the lesson to delete.</param>
    /// <example>
    /// DELETE /api/Lesson/5
    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLesson(int id)
    {
        var lesson = await context.Lessons.FindAsync(id);
        if (lesson == null)
        {
            return NotFound();
        }

        context.Lessons.Remove(lesson);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool LessonExists(int id)
    {
        return context.Lessons.Any(e => e.Id == id);
    }
}