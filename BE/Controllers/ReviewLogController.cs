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
    /// Updates the FSRS weights for all users. This method is called by a scheduled job
    /// that runs daily at 2:00 AM.
    /// </summary>
    /// <example>
    /// GET /api/ReviewLog/weights
    /// </example>
    [HttpGet("update")]
    [AllowAnonymous]
    public async Task<ActionResult> UpdateParameters()
    {
        try
        {
            // Get all users
            var users = await userManager.Users.ToListAsync();

            foreach (var user in users)
            {
                // Get all review logs for words that belong to the current user
                var formattedLogs = await context.ReviewLogs
                    .Include(rl => rl.Word)
                    .ThenInclude(w => w.Language)
                    .Where(rl => rl.Word.Language.UserId == user.Id)
                    .OrderBy(rl => rl.ReviewDateTime)
                    .Take(100000) // Takes most recent 100000 records
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
                    continue;
                }

                // Serialize the review logs
                var serializedLogs = JsonSerializer.Serialize(formattedLogs);

                // Prepare the Python process
                string pythonPath;
                string currentDirectory = Directory.GetCurrentDirectory();
                string optimizerScriptPath = Path.Combine(currentDirectory, "fsrs", "optimizer.py");
                string arguments = optimizerScriptPath;

                if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                {
                    pythonPath = "python";
                }
                else
                {
                    pythonPath = "/opt/venv/bin/python";
                }

                // Start Python process
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = pythonPath,
                    Arguments = arguments,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = currentDirectory
                };

                using var process = new Process { StartInfo = processStartInfo };
                process.Start();

                await process.StandardInput.WriteAsync(serializedLogs);
                process.StandardInput.Close();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    continue;
                }

                // Parse the output to get optimized weights
                try
                {
                    if (string.IsNullOrWhiteSpace(output))
                    {
                        continue;
                    }

                    var optimizedWeights = JsonSerializer.Deserialize<List<double>>(output);

                    if (optimizedWeights == null || optimizedWeights.Count == 0)
                    {
                        continue;
                    }

                    // Store the optimized weights in the user's Weights property
                    user.FSRSParameters = JsonSerializer.Serialize(optimizedWeights);
                    user.UpdatedAt = DateTime.UtcNow;
                    await userManager.UpdateAsync(user);
                }
                catch (JsonException)
                {
                    // Skip the user if output can't be parsed
                    continue;
                }
            }

            return Ok();
        }
        catch (Exception)
        {
            return StatusCode(500);
        }
    }

    /// <summary>
    /// Gets the current user's FSRS weights.
    /// </summary>
    /// <returns>The user's optimized FSRS weights as a list of doubles.</returns>
    /// <example>
    /// GET /api/ReviewLog/weights/user
    /// </example>
    [HttpGet("load")]
    public async Task<ActionResult<List<double>>> GetUserParameters()
    {
        try
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized("User not authenticated");
            }

            // Deserialize the weights from the user's Weights property
            var parameters = JsonSerializer.Deserialize<List<double>>(user.FSRSParameters);

            if (parameters == null || parameters.Count == 0)
            {
                return NotFound("No weights found for user");
            }

            return Ok(parameters);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while retrieving user weights");
        }
    }
}
