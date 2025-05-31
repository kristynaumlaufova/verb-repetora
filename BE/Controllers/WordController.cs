using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using BE.Data;
using BE.Models;
using BE.Models.Dto;

namespace BE.Controllers;

/// <summary>
/// Controller for word related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WordController(ApplicationDbContext context, UserManager<AppUser> userManager) : ControllerBase
{
    /// <summary>
    /// Retrieves all words from the database.
    /// </summary>    
    /// <returns>A paginated list of words.</returns>
    /// <example>
    /// GET /api/Word?langId=1&pageNumber=1&pageSize=10&searchTerm=text&sortBy=keyword&sortDescending=false
    /// </example>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<WordDto>>> GetWords([FromQuery] WordQueryParameters parameters)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var query = context.Words
            .Include(w => w.Language)
            .Include(w => w.WordType)
            .Where(w => w.LanguageId == parameters.LangId && w.Language.UserId == user.Id);

        // Add search
        if (!string.IsNullOrEmpty(parameters.SearchTerm))
        {
            query = query.Where(w => w.Keyword.Contains(parameters.SearchTerm));
        }

        // Add sorting
        query = parameters.SortBy?.ToLower() switch
        {
            "keyword" => parameters.SortDescending
                ? query.OrderByDescending(w => w.Keyword)
                : query.OrderBy(w => w.Keyword),
            "type" => parameters.SortDescending
                ? query.OrderByDescending(w => w.WordType.Name)
                : query.OrderBy(w => w.WordType.Name),
            _ => query.OrderBy(w => w.Keyword)
        };

        var totalCount = await query.CountAsync();

        // Add pagination
        var items = await query
            .Skip((parameters.PageNumber - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(w => new WordDto(
                w.Id,
                w.WordTypeId,
                w.LanguageId,
                w.Keyword,
                w.Fields,
                w.State,
                w.Step,
                w.Stability,
                w.Difficulty,
                w.Due,
                w.LastReview,
                w.FirstReview
            ))
            .ToListAsync();

        return Ok(new PaginatedResponse<WordDto>(
            items,
            totalCount,
            parameters.PageNumber,
            parameters.PageSize
        ));
    }

    /// <summary>
    /// Retrieves a specific word by its ID.
    /// </summary>
    /// <param name="id">The ID of the word to retrieve.</param>
    /// <example>
    /// GET /api/Word/5    
    /// /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<WordDto>> GetWord(int id)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var word = await context.Words
            .Include(w => w.Language)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (word == null || word.Language.UserId != user.Id)
        {
            return NotFound();
        }

        return new WordDto(
            word.Id,
            word.WordTypeId,
            word.LanguageId,
            word.Keyword,
            word.Fields
        );
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
    /// }    /// </example>
    [HttpPost]
    public async Task<ActionResult<WordDto>> CreateWord(CreateWordRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }
        var language = await context.Languages
            .FirstOrDefaultAsync(l => l.Id == request.LanguageId && l.UserId == user.Id);

        if (language == null)
        {
            return BadRequest("Language not found or you don't have access to it");
        }

        var wordType = await context.WordTypes
            .FirstOrDefaultAsync(wt => wt.Id == request.WordTypeId && wt.LangId == request.LanguageId);

        if (wordType == null)
        {
            return BadRequest("Word type not found or doesn't belong to the specified language");
        }

        var word = new Word
        {
            WordTypeId = request.WordTypeId,
            LanguageId = request.LanguageId,
            Keyword = request.Keyword,
            Fields = request.Fields
        };

        context.Words.Add(word);
        await context.SaveChangesAsync();

        var dto = new WordDto(
            word.Id,
            word.WordTypeId,
            word.LanguageId,
            word.Keyword,
            word.Fields
        );

        return CreatedAtAction(nameof(GetWord), new { id = word.Id }, dto);
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
    /// }    /// </example>
    [HttpPut("{id}")]
    public async Task<ActionResult<WordDto>> UpdateWord(int id, UpdateWordRequest request)
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
        var word = await context.Words
            .Include(w => w.Language)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (word == null || word.Language.UserId != user.Id)
        {
            return NotFound();
        }

        var wordType = await context.WordTypes
            .FirstOrDefaultAsync(wt => wt.Id == request.WordTypeId && wt.LangId == word.LanguageId);

        if (wordType == null)
        {
            return BadRequest("Word type not found or doesn't belong to the word's language");
        }

        word.WordTypeId = request.WordTypeId;
        word.Keyword = request.Keyword;
        word.Fields = request.Fields;

        try
        {
            await context.SaveChangesAsync();

            return new WordDto(
                word.Id,
                word.WordTypeId,
                word.LanguageId,
                word.Keyword,
                word.Fields
            );
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordExists(id))
            {
                return NotFound();
            }
            throw;
        }
    }

    /// <summary>
    /// Deletes a specific word.
    /// </summary>
    /// <param name="id">The ID of the word to delete.</param>
    /// <example>
    /// DELETE /api/Word/5    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWord(int id)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }
        var word = await context.Words
            .Include(w => w.Language)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (word == null || word.Language.UserId != user.Id)
        {
            return NotFound();
        }

        context.Words.Remove(word);
        await context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Retrieves words by their IDs.
    /// </summary>
    /// <param name="wordIds">The IDs of the words to retrieve.</param>
    /// <param name="filterByDue">Whether to filter words by their due date.</param>
    /// <returns>A list of words matching the provided IDs and optionally due for review.</returns>
    /// <example>
    /// POST /api/Word/byIds?filterByDue=true
    /// [1, 2, 3]
    /// </example>
    [Route("byIds")]
    [HttpPost]
    public async Task<ActionResult<IEnumerable<WordDto>>> GetWordsByIds([FromBody] int[] wordIds, [FromQuery] bool filterByDue = false)
    {
        if (wordIds == null || wordIds.Length == 0)
        {
            return Ok(new List<WordDto>());
        }

        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var query = context.Words
            .Include(w => w.Language)
            .Include(w => w.WordType)
            .Where(w => wordIds.Contains(w.Id) && w.Language.UserId == user.Id);

        if (filterByDue)
        {
            query = query.Where(w => w.Due <= DateTime.UtcNow);
        }

        var words = await query.ToListAsync();

        var wordDtos = words.Select(word => new WordDto(
            word.Id,
            word.WordTypeId,
            word.LanguageId,
            word.Keyword,
            word.Fields,
            word.State,
            word.Step,
            word.Stability,
            word.Difficulty,
            word.Due,
            word.LastReview,
            word.FirstReview
        )).ToList();

        return Ok(wordDtos);
    }

    private bool WordExists(int id)
    {
        return context.Words.Any(e => e.Id == id);
    }

    /// <summary>
    /// Updates the FSRS data for a specific word.
    /// </summary>
    /// <param name="id">The ID of the word to update.</param>
    /// <param name="data">The updated FSRS data.</param>
    /// <returns>The updated word.</returns>
    /// <example>
    /// PUT /api/Word/updateFSRS/5
    /// {
    ///     "id": 5,
    ///     "state": 2,
    ///     "step": null,
    ///     "stability": 3.45,
    ///     "difficulty": 0.3,
    ///     "due": "2025-06-15T10:00:00Z",
    ///     "lastReview": "2025-05-31T10:00:00Z"
    /// }
    /// </example>
    [HttpPut("updateFSRS/{id}")]
    public async Task<ActionResult<WordDto>> UpdateFSRSData(int id, UpdateFSRSDataRequest data)
    {
        if (id != data.Id)
        {
            return BadRequest("ID mismatch");
        }

        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        var word = await context.Words
            .Include(w => w.Language)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (word == null || word.Language.UserId != user.Id)
        {
            return NotFound();
        }

        // Update FSRS fields
        word.State = data.State;
        word.Step = data.Step;
        word.Stability = data.Stability;
        word.Difficulty = data.Difficulty;
        word.Due = data.Due;
        word.LastReview = data.LastReview;

        if (data.FirstReview.HasValue && !word.FirstReview.HasValue)
        {
            word.FirstReview = data.FirstReview;
        }

        try
        {
            await context.SaveChangesAsync();

            return new WordDto(
                word.Id,
                word.WordTypeId,
                word.LanguageId,
                word.Keyword,
                word.Fields,
                word.State,
                word.Step,
                word.Stability,
                word.Difficulty,
                word.Due,
                word.LastReview,
                word.FirstReview
            );
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordExists(id))
            {
                return NotFound();
            }
            throw;
        }
    }

    /// <summary>
    /// Updates the FSRS data for multiple words in a batch.
    /// </summary>
    /// <param name="dataList">A list of FSRS data updates.</param>
    /// <returns>No content if successful.</returns>
    /// <example>
    /// POST /api/Word/updateBatchFSRS
    /// [
    ///     {
    ///         "id": 1,
    ///         "state": 2,
    ///         "step": null,
    ///         "stability": 3.45,
    ///         "difficulty": 0.3,
    ///         "due": "2025-06-15T10:00:00Z",
    ///         "lastReview": "2025-05-31T10:00:00Z"
    ///     },
    ///     {
    ///         "id": 2,
    ///         "state": 1,
    ///         "step": 2,
    ///         "stability": null,
    ///         "difficulty": null,
    ///         "due": "2025-06-01T10:00:00Z",
    ///         "lastReview": "2025-05-31T10:00:00Z"
    ///     }
    /// ]
    /// </example>
    [HttpPost("updateBatchFSRS")]
    public async Task<IActionResult> UpdateBatchFSRSData([FromBody] List<UpdateFSRSDataRequest> dataList)
    {
        if (dataList == null || dataList.Count == 0)
        {
            return BadRequest("No data provided");
        }

        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        // Get all word IDs from the request
        var wordIds = dataList.Select(d => d.Id).ToList();

        // Load all words in a single query
        var words = await context.Words
            .Include(w => w.Language)
            .Where(w => wordIds.Contains(w.Id) && w.Language.UserId == user.Id)
            .ToListAsync();

        // Dictionary for faster lookup
        var wordDict = words.ToDictionary(w => w.Id, w => w);

        foreach (var data in dataList)
        {
            if (wordDict.TryGetValue(data.Id, out var word))
            {
                // Update FSRS fields
                word.State = data.State;
                word.Step = data.Step;
                word.Stability = data.Stability;
                word.Difficulty = data.Difficulty;
                word.Due = data.Due;
                word.LastReview = data.LastReview;

                if (data.FirstReview.HasValue && !word.FirstReview.HasValue)
                {
                    word.FirstReview = data.FirstReview;
                }
            }
        }

        await context.SaveChangesAsync();
        return NoContent();
    }
}
