using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

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
public class LanguageController(ApplicationDbContext context, UserManager<AppUser> userManager) : ControllerBase
{
    private static LanguageDto ToDto(Language language) => new(
        language.Id,
        language.Name,
        language.CreatedAt,
        language.UpdatedAt
    );

    /// <summary>
    /// Retrieves all languages from the database.
    /// </summary>
    /// <returns>A list of all languages.</returns>
    /// <example>
    /// GET /api/Language
    /// </example>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<LanguageDto>>> GetLanguages([FromQuery] LanguageQueryParameters parameters)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var query = context.Languages
            .Where(l => l.UserId == user.Id);

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
            _ => query.OrderBy(l => l.Name)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(l => ToDto(l))
            .ToListAsync();

        return Ok(new PaginatedResponse<LanguageDto>(
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
    public async Task<ActionResult<LanguageDto>> GetLanguage(int id)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var language = await LanguageExistsForCurrentUser(id, user.Id);

        if (language == null)
        {
            return NotFound();
        }

        return ToDto(language);
    }

    /// <summary>
    /// Creates a new language.
    /// </summary>
    /// <param name="request">The language to create.</param>
    /// <returns>The created language.</returns>
    /// <example>
    /// POST /api/Language
    /// {
    ///     "name": "Spanish"
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<LanguageDto>> CreateLanguage(CreateLanguageRequest request)
    {
        try
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized("User not authenticated");
            }

            if (await IsNameCollision(user.Id, request.Name))
            {
                return BadRequest("A language with this name already exists");
            }

            var language = new Language
            {
                UserId = user.Id,
                Name = request.Name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Languages.Add(language);
            await context.SaveChangesAsync();

            return Ok(ToDto(language));
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
    /// <param name="request">The updated language.</param>
    /// <example>
    /// PUT /api/Language/5
    /// {
    ///     "id": 5,
    ///     "name": "Spanish"
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<ActionResult<LanguageDto>> UpdateLanguage(int id, UpdateLanguageRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var existingLanguage = await LanguageExistsForCurrentUser(id, user.Id);
        if (existingLanguage == null)
        {
            return NotFound();
        }

        if (await IsNameCollision(user.Id, request.Name))
        {
            return BadRequest("A language with this name already exists");
        }

        existingLanguage.Name = request.Name;
        existingLanguage.UpdatedAt = DateTime.UtcNow;

        try
        {
            await context.SaveChangesAsync();
            return Ok(ToDto(existingLanguage));
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
    /// </example>    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLanguage(int id)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        if (await IsLastLanguage(user.Id))
        {
            return BadRequest("Cannot delete your last language. At least one language must remain.");
        }

        var language = await context.Languages
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == user.Id);

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

    private Task<Language?> LanguageExistsForCurrentUser(int langId, int userId)
    {
        return context.Languages.FirstOrDefaultAsync(l => l.Id == langId && l.UserId == userId);
    }

    private async Task<bool> IsNameCollision(int userId, string name)
    {
        return await context.Languages
            .FirstOrDefaultAsync(l =>
                l.UserId == userId &&
                l.Name == name) != null;
    }

    private async Task<bool> IsLastLanguage(int userId)
    {
        return await context.Languages.CountAsync(l => l.UserId == userId) <= 1;
    }
}
