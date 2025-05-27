using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

/// <summary>
/// Controller for language related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LanguageController(ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Retrieves all languages from the database.
    /// </summary>
    /// <returns>A list of all languages.</returns>
    /// <example>
    /// GET /api/Language
    /// </example>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Language>>> GetLanguages()
    {
        return await context.Languages.ToListAsync();
    }

    /// <summary>
    /// Retrieves a language by its ID.
    /// </summary>
    /// <param name="id">The ID of the language to retrieve.</param>
    /// <returns>Language with the given ID.</returns>
    /// <example>
    /// GET /api/Language/5
    /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<Language>> GetLanguage(int id)
    {
        var language = await context.Languages.FindAsync(id);

        if (language == null)
        {
            return NotFound();
        }

        return language;
    }

    /// <summary>
    /// Creates a new language.
    /// </summary>
    /// <param name="language">The language object to create.</param>
    /// <returns>The created language.</returns>
    /// <example>
    /// POST /api/Language
    /// {
    ///     "name": "Spanish"
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<Language>> CreateLanguage(Language language)
    {
        try
        {
            // Check if a language with this name already exists for this user
            var existingLanguage = await context.Languages
                .FirstOrDefaultAsync(l => l.UserId == language.UserId && l.Name == language.Name);

            if (existingLanguage != null)
            {
                return BadRequest("A language with this name already exists");
            }

            context.Languages.Add(language);
            await context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLanguage), new { id = language.Id }, language);
        }
        catch (DbUpdateException ex)
        {
            // Log the exception details here
            return StatusCode(500, "Failed to create language. Please try again.");
        }
    }

    /// <summary>
    /// Updates a specific language.
    /// </summary>
    /// <param name="id">The ID of the language to update.</param>
    /// <param name="language">The updated language object.</param>
    /// <example>
    /// PUT /api/Language/5
    /// {
    ///     "id": 5,
    ///     "name": "Spanish"
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLanguage(int id, Language language)
    {
        if (id != language.Id)
        {
            return BadRequest();
        }

        context.Entry(language).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!LanguageExists(id))
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
    /// Deletes a specific language.
    /// </summary>
    /// <param name="id">The ID of the language to delete.</param>
    /// <example>
    /// DELETE /api/Language/5
    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLanguage(int id)
    {
        var language = await context.Languages.FindAsync(id);
        if (language == null)
        {
            return NotFound();
        }

        context.Languages.Remove(language);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool LanguageExists(int id)
    {
        return context.Languages.Any(e => e.Id == id);
    }
}
