using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using BE.Data;
using BE.Models;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WordTypeController(ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Retrieves all word types from the database.
    /// </summary>
    /// <returns>A list of all word types.</returns>
    /// <example>
    /// GET /api/WordType
    /// </example>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WordType>>> GetWordTypes()
    {
        return await context.WordTypes.ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific word type by its ID.
    /// </summary>
    /// <param name="id">The ID of the word type to retrieve.</param>
    /// <returns>The requested word type if found.</returns>
    /// <example>
    /// GET /api/WordType/5
    /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<WordType>> GetWordType(int id)
    {
        var wordType = await context.WordTypes.FindAsync(id);

        if (wordType == null)
        {
            return NotFound();
        }

        return wordType;
    }

    /// <summary>
    /// Creates a new word type.
    /// </summary>
    /// <param name="wordType">The word type object to create.</param>
    /// <returns>The created word type.</returns>
    /// <example>
    /// POST /api/WordType
    /// {
    ///     "name": "Noun",
    ///     "description": "A word that represents a person, place, thing, or idea"
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<WordType>> CreateWordType(WordType wordType)
    {
        context.WordTypes.Add(wordType);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWordType), new { id = wordType.Id }, wordType);
    }

    /// <summary>
    /// Updates a specific word type.
    /// </summary>
    /// <param name="id">The ID of the word type to update.</param>
    /// <param name="wordType">The updated word type object.</param>
    /// <example>
    /// PUT /api/WordType/5
    /// {
    ///     "id": 5,
    ///     "name": "Noun Updated",
    ///     "description": "Updated description for nouns"
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWordType(int id, WordType wordType)
    {
        if (id != wordType.Id)
        {
            return BadRequest();
        }

        context.Entry(wordType).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordTypeExists(id))
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
    /// Deletes a specific word type.
    /// </summary>
    /// <param name="id">The ID of the word type to delete.</param>
    /// <example>
    /// DELETE /api/WordType/5
    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWordType(int id)
    {
        var wordType = await context.WordTypes.FindAsync(id);
        if (wordType == null)
        {
            return NotFound();
        }

        context.WordTypes.Remove(wordType);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool WordTypeExists(int id)
    {
        return context.WordTypes.Any(e => e.Id == id);
    }
}
