using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;

using BE.Data;
using BE.Models;
using BE.Models.Dto;

namespace BE.Controllers;

/// <summary>
/// Controller for review log related operations including FSRS weight optimization.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewLogController(ApplicationDbContext context, UserManager<AppUser> userManager, ILogger<ReviewLogController> logger) : ControllerBase
{
    /// <summary>
    /// Creates multiple review logs in a batch operation during recommended reviews.
    /// </summary>
    /// <param name="reviewLogBatch">A batch of review logs to be saved.</param>
    /// <returns>A result indicating success or failure.</returns>
    /// <example>
    /// POST /api/ReviewLog/batch
    /// </example>
    [HttpPost("batch")]
    public async Task<ActionResult> CreateBatchReviewLogs([FromBody] ReviewLogBatchDto reviewLogBatch)
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        if (reviewLogBatch.ReviewLogs.Count == 0)
        {
            return BadRequest("No review logs provided");
        }

        try
        {
            // Get all word IDs from the review logs
            var wordIds = reviewLogBatch.ReviewLogs.Select(rl => rl.WordId).ToList();

            // Verify that all words belong to the current user
            var userWords = await context.Words
                .Where(w => wordIds.Contains(w.Id))
                .Select(w => new { w.Id, w.Language.UserId })
                .ToListAsync();

            // Check if all words belong to the current user
            if (userWords.Any(w => w.UserId != user.Id))
            {
                return Forbid("Access to one or more words is forbidden");
            }

            // Create review logs
            var reviewLogs = reviewLogBatch.ReviewLogs.Select(rlDto => new ReviewLog
            {
                WordId = rlDto.WordId,
                Rating = rlDto.Rating,
                ReviewDateTime = rlDto.ReviewDateTime,
                ReviewDuration = rlDto.ReviewDuration
            }).ToList();

            // Add review logs to database
            await context.ReviewLogs.AddRangeAsync(reviewLogs);
            await context.SaveChangesAsync();

            return Ok(new { message = "Review logs created successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating batch review logs");
            return StatusCode(500, "An error occurred while creating review logs");
        }
    }

    /// <summary>
    /// Loads all stored review logs and runs the optimizer.py script to optimize FSRS weights.
    /// </summary>
    /// <returns>The optimized FSRS weights.</returns>
    /// <example>
    /// GET /api/ReviewLog/weights
    /// </example>
    [HttpGet("weights")]
    public async Task<ActionResult<object>> LoadWeights()
    {
        var user = await userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized("User not authenticated");
        }

        try
        {
            // Get all review logs for words that belong to the current user
            var formattedLogs = await context.ReviewLogs
                .Include(rl => rl.Word)
                .ThenInclude(w => w.Language)
                .Where(rl => rl.Word.Language.UserId == user.Id)
                .OrderBy(rl => rl.ReviewDateTime)
                .Take(10000) //Takes most recent 10000 thousand records
                .Select(rl => new
                {
                    card_id = rl.WordId,
                    rating = (int)rl.Rating,
                    review_datetime = rl.ReviewDateTime.ToString("o"), // ISO 8601 format
                    review_duration = rl.ReviewDuration
                })
                .ToListAsync();

            if (formattedLogs.Count == 0)
            {
                return Ok(new { message = "No review logs found, using default weights" });
            }

            // Serialize the review logs
            var serializedLogs = JsonSerializer.Serialize(formattedLogs);

            // Prepare the Python process
            var pythonPath = Environment.OSVersion.Platform == PlatformID.Win32NT ? "python" : "python3";
            var optimizerScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "fsrs", "optimizer.py");

            // Start Python process
            var processStartInfo = new ProcessStartInfo
            {
                FileName = pythonPath,
                Arguments = $"{optimizerScriptPath}",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();

            // Write serialized data directly to the Python process's standard input
            await process.StandardInput.WriteAsync(serializedLogs);
            process.StandardInput.Close();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                logger.LogError("Python script error: {Error}", error);
                return StatusCode(500, "Error optimizing weights");
            }

            // Parse the output to get optimized weights
            try
            {
                var optimizedWeights = JsonSerializer.Deserialize<List<double>>(output);
                return Ok(new { weights = optimizedWeights });
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Error parsing optimizer output: {Output}", output);
                return StatusCode(500, "Error parsing optimizer output");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error optimizing weights");
            return StatusCode(500, "An error occurred while optimizing weights");
        }
    }
}
