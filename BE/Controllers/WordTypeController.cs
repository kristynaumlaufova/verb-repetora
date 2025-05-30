using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using BE.Data;
using BE.Models;
using BE.Models.Dto;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WordTypeController(ApplicationDbContext context, UserManager<AppUser> userManager) : ControllerBase
{
    private static WordTypeDto ToDto(WordType wordType) => new(
        wordType.Id,
        wordType.UserId,
        wordType.LangId,
        wordType.Name,
        wordType.Fields
    );

    /// <summary>
    /// Retrieves word types with pagination, sorting and filtering support.
    /// </summary>
    /// <param name="parameters">Query parameters including pagination, sorting and search options.</param>
    /// <returns>A paginated list of word types.</returns>
    /// <example>
    /// GET /api/WordType?langId=1&pageNumber=1&pageSize=10&searchTerm=noun&sortBy=name&sortDescending=false
    /// </example>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<WordTypeDto>>> GetWordTypes([FromQuery] WordTypeQueryParameters parameters)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var query = context.WordTypes.Where(wt => wt.LangId == parameters.LangId && wt.UserId == user.Id);

        // Add search
        if (!string.IsNullOrEmpty(parameters.SearchTerm))
        {
            query = query.Where(wt => wt.Name.Contains(parameters.SearchTerm));
        }

        // Add sorting
        query = parameters.SortBy?.ToLower() switch
        {
            "name" => parameters.SortDescending
                ? query.OrderByDescending(wt => wt.Name)
                : query.OrderBy(wt => wt.Name),
            _ => query.OrderBy(wt => wt.Name)
        };

        var totalCount = await query.CountAsync();

        // Add pagination
        var items = await query
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(wt => ToDto(wt))
            .ToListAsync();

        return Ok(new PaginatedResponse<WordTypeDto>(
            items,
            totalCount,
            parameters.PageNumber,
            parameters.PageSize
        ));
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
    public async Task<ActionResult<WordTypeDto>> GetWordType(int id)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var wordType = await GetWordTypeOfUser(id, user.Id);

        if (wordType == null)
        {
            return NotFound();
        }

        return Ok(ToDto(wordType));
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
    public async Task<ActionResult<WordTypeDto>> CreateWordType(CreateWordTypeRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        if (!await LanguageExists(request.LangId))
        {
            return BadRequest("Language not found");
        }

        if (await IsNameColision(request.LangId, request.Name))
        {
            return BadRequest("A word type with this name already exists in this language");
        }

        var wordType = new WordType
        {
            UserId = user.Id,
            LangId = request.LangId,
            Name = request.Name,
            Fields = request.Fields
        };

        context.WordTypes.Add(wordType);
        await context.SaveChangesAsync();

        return Ok(ToDto(wordType));
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
    public async Task<ActionResult<WordTypeDto>> UpdateWordType(int id, UpdateWordTypeRequest request)
    {
        if (id != request.Id)
        {
            return BadRequest();
        }

        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var wordType = await GetWordTypeOfUser(id, user.Id);

        if (wordType == null)
        {
            return NotFound();
        }

        wordType.Name = request.Name;
        wordType.Fields = request.Fields;

        try
        {
            await context.SaveChangesAsync();
            return Ok(ToDto(wordType));
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordTypeExists(id))
            {
                return NotFound();
            }
            throw;
        }
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
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var wordType = await GetWordTypeOfUser(id, user.Id);

        if (wordType == null)
        {
            return NotFound();
        }

        context.WordTypes.Remove(wordType);
        await context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Retrieves multiple word types by their IDs.
    /// </summary>
    /// <param name="wordTypeIds">An array of word type IDs to retrieve.</param>
    /// <returns>The requested word types if found.</returns>
    /// <example>
    /// POST /api/WordType/byIds
    /// [1, 2, 3]
    /// </example>
    [Route("byIds")]
    [HttpPost]
    public async Task<ActionResult<IEnumerable<WordTypeDto>>> GetWordTypesByIds([FromBody] int[] wordTypeIds)
    {
        if (wordTypeIds == null || wordTypeIds.Length == 0)
        {
            return Ok(new List<WordTypeDto>());
        }

        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var wordTypes = await context.WordTypes
            .Where(wt => wordTypeIds.Contains(wt.Id) && wt.UserId == user.Id)
            .ToListAsync();

        var wordTypeDtos = wordTypes.Select(wt => ToDto(wt)).ToList();

        return Ok(wordTypeDtos);
    }

    private bool WordTypeExists(int id)
    {
        return context.WordTypes.Any(e => e.Id == id);
    }

    private Task<WordType?> GetWordTypeOfUser(int id, int userId)
    {
        return context.WordTypes
           .FirstOrDefaultAsync(wt => wt.Id == id && wt.UserId == userId);
    }

    private async Task<bool> LanguageExists(int langId)
    {
        return await context.Languages
            .FirstOrDefaultAsync(l => l.Id == langId) != null;
    }
    private async Task<bool> IsNameColision(int langId, string name)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return false;
        }

        return await context.WordTypes
            .FirstOrDefaultAsync(wt =>
                wt.LangId == langId
                && wt.Name == name
            ) != null;
    }
}
