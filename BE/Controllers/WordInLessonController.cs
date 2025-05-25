using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

/// <summary>
/// Controller for managing word-lesson related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class WordInLessonController(ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Retrieves all word-lesson assignments from the database.
    /// </summary>
    /// <returns>A list of all word-lesson assignments.</returns>
    /// <example>
    /// GET /api/WordInLesson
    /// </example>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WordInLesson>>> GetWordInLessons()
    {
        return await context.WordInLessons.ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific word-lesson assignment by its ID.
    /// </summary>
    /// <param name="id">The ID of the word-lesson assignment to retrieve.</param>
    /// <returns>The requested word-lesson assignment if found.</returns>
    /// <example>
    /// GET /api/WordInLesson/5
    /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<WordInLesson>> GetWordInLesson(int id)
    {
        var wordInLesson = await context.WordInLessons.FindAsync(id);

        if (wordInLesson == null)
        {
            return NotFound();
        }

        return wordInLesson;
    }

    /// <summary>
    /// Creates a new word-lesson assignment.
    /// </summary>
    /// <param name="wordInLesson">The word-lesson assignment object to create.</param>
    /// <returns>The created word-lesson assignment.</returns>
    /// <example>
    /// POST /api/WordInLesson
    /// {
    ///     "wordId": 1,
    ///     "lessonId": 1,
    ///     "order": 1
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<WordInLesson>> CreateWordInLesson(WordInLesson wordInLesson)
    {
        context.WordInLessons.Add(wordInLesson);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWordInLesson), new { id = wordInLesson.Id }, wordInLesson);
    }

    /// <summary>
    /// Updates a specific word-lesson assignment.
    /// </summary>
    /// <param name="id">The ID of the word-lesson assignment to update.</param>
    /// <param name="wordInLesson">The updated word-lesson assignment object.</param>
    /// <example>
    /// PUT /api/WordInLesson/5
    /// {
    ///     "id": 5,
    ///     "wordId": 1,
    ///     "lessonId": 1,
    ///     "order": 2
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWordInLesson(int id, WordInLesson wordInLesson)
    {
        if (id != wordInLesson.Id)
        {
            return BadRequest();
        }

        context.Entry(wordInLesson).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordInLessonExists(id))
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
    /// Deletes a specific word-lesson assignment.
    /// </summary>
    /// <param name="id">The ID of the word-lesson assignment to delete.</param>
    /// <example>
    /// DELETE /api/WordInLesson/5
    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWordInLesson(int id)
    {
        var wordInLesson = await context.WordInLessons.FindAsync(id);
        if (wordInLesson == null)
        {
            return NotFound();
        }

        context.WordInLessons.Remove(wordInLesson);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool WordInLessonExists(int id)
    {
        return context.WordInLessons.Any(e => e.Id == id);
    }
}
