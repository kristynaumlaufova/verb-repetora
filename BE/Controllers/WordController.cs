using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

/// <summary>
/// Controller for word related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class WordController(ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Retrieves all words from the database.
    /// </summary>
    /// <returns>A list of all words.</returns>
    /// <example>
    /// GET /api/Word
    /// </example>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Word>>> GetWords()
    {
        return await context.Words.ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific word by its ID.
    /// </summary>
    /// <param name="id">The ID of the word to retrieve.</param>
    /// <example>
    /// GET /api/Word/5
    /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<Word>> GetWord(int id)
    {
        var word = await context.Words.FindAsync(id);

        if (word == null)
        {
            return NotFound();
        }

        return word;
    }

    /// <summary>
    /// Creates a new word.
    /// </summary>
    /// <param name="word">The word object to create.</param>
    /// <returns>The created word.</returns>
    /// <example>
    /// POST /api/Word
    /// {
    ///     "text": "hello",
    ///     "translation": "hola",
    ///     "languageId": 1,
    ///     "typeId": 1
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<Word>> CreateWord(Word word)
    {
        context.Words.Add(word);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWord), new { id = word.Id }, word);
    }

    /// <summary>
    /// Updates a specific word.
    /// </summary>
    /// <param name="id">The ID of the word to update.</param>
    /// <param name="word">The updated word object.</param>
    /// <example>
    /// PUT /api/Word/5
    /// {
    ///     "id": 5,
    ///     "text": "hello updated",
    ///     "translation": "hola actualizado",
    ///     "languageId": 1,
    ///     "typeId": 1
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWord(int id, Word word)
    {
        if (id != word.Id)
        {
            return BadRequest();
        }

        context.Entry(word).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordExists(id))
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
    /// Deletes a specific word.
    /// </summary>
    /// <param name="id">The ID of the word to delete.</param>
    /// <example>
    /// DELETE /api/Word/5
    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWord(int id)
    {
        var word = await context.Words.FindAsync(id);
        if (word == null)
        {
            return NotFound();
        }

        context.Words.Remove(word);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool WordExists(int id)
    {
        return context.Words.Any(e => e.Id == id);
    }
}
