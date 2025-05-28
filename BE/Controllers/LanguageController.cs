using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

using BE.Data;
using BE.Models;
using BE.Models.Dto;

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
    public async Task<ActionResult<PaginatedResponse<Language>>> GetLanguages([FromQuery] LanguageQueryParameters parameters)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized("User not authenticated");
        }

        var userId = int.Parse(userIdClaim.Value);
        var query = context.Languages
            .Where(l => l.UserId == userId);

        // Add search
        if (!string.IsNullOrEmpty(parameters.SearchTerm))
        {
            query = query.Where(l => l.Name.Contains(parameters.SearchTerm));
        }

        // Add sorting
        query = parameters.SortBy?.ToLower() switch
        {
            "name" => parameters.SortDescending
                ? query.OrderByDescending(l => l.Name)
                : query.OrderBy(l => l.Name),
            "createdat" => parameters.SortDescending
                ? query.OrderByDescending(l => l.CreatedAt)
                : query.OrderBy(l => l.CreatedAt),
            _ => query.OrderByDescending(l => l.UpdatedAt) // default sort
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .ToListAsync();

        return Ok(new PaginatedResponse<Language>(
            items,
            totalCount,
            parameters.PageNumber,
            parameters.PageSize
        ));
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
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        var language = await context.Languages
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

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
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

            // Check if user already has a language with this name
            var existingLanguage = await context.Languages
                .FirstOrDefaultAsync(l => l.UserId == userId && l.Name == language.Name);

            if (existingLanguage != null)
            {
                return BadRequest("A language with this name already exists");
            }

            // Set additional properties
            language.UserId = userId;
            language.CreatedAt = DateTime.UtcNow;
            language.UpdatedAt = DateTime.UtcNow;

            context.Languages.Add(language);
            await context.SaveChangesAsync();

            return Ok(language);
        }
        catch (DbUpdateException)
        {
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
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

        // Check if the language exists and belongs to the user
        var existingLanguage = await context.Languages
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (existingLanguage == null)
        {
            return NotFound();
        }

        // Check if the new name conflicts with another language
        var nameConflict = await context.Languages
            .FirstOrDefaultAsync(l =>
                l.UserId == userId &&
                l.Name == language.Name &&
                l.Id != id);

        if (nameConflict != null)
        {
            return BadRequest("A language with this name already exists");
        }

        existingLanguage.Name = language.Name;
        existingLanguage.UpdatedAt = DateTime.UtcNow;

        try
        {
            await context.SaveChangesAsync();
            return Ok(existingLanguage);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!LanguageExists(id))
            {
                return NotFound();
            }
            throw;
        }
    }

    /// <summary>
    /// Deletes a specific language.
    /// </summary>
    /// <param name="id">The ID of the language to delete.</param>
    /// <example>
    /// DELETE /api/Language/5
    /// </example>    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLanguage(int id)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

        var language = await context.Languages
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

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
