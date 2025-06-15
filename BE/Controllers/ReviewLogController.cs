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
            }            // Serialize the review logs
            var serializedLogs = JsonSerializer.Serialize(formattedLogs);

            // Prepare the Python process
            // Check if we're in a Docker environment with virtual env
            string pythonPath;
            string optimizerScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "fsrs", "optimizer.py");
            string arguments = optimizerScriptPath;

            if (Environment.OSVersion.Platform == PlatformID.Win32NT)
            {
                pythonPath = "python";
            }
            else
            {
                // Check for the wrapper script first
                var wrapperScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "fsrs", "run_python.sh");
                if (System.IO.File.Exists(wrapperScriptPath))
                {
                    pythonPath = wrapperScriptPath;
                    arguments = optimizerScriptPath;
                }
                else if (System.IO.File.Exists("/opt/venv/bin/python"))
                {
                    pythonPath = "/opt/venv/bin/python";
                }
                else
                {
                    pythonPath = "python3";
                }
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
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };
            process.Start();

            // Write serialized data directly to the Python process's standard input
            await process.StandardInput.WriteAsync(serializedLogs);
            process.StandardInput.Close();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                logger.LogError("Python script error: {Error}", error);
                return StatusCode(500, new { message = "Error optimizing weights", details = error });
            }

            // Parse the output to get optimized weights
            try
            {
                if (string.IsNullOrWhiteSpace(output))
                {
                    logger.LogError("Empty output from Python script");
                    return StatusCode(500, new { message = "Empty output from Python script", details = "The Python script didn't produce any output." });
                }

                logger.LogInformation("Python script output: {Output}", output);
                var optimizedWeights = JsonSerializer.Deserialize<List<double>>(output);

                if (optimizedWeights == null || optimizedWeights.Count == 0)
                {
                    logger.LogError("No weights returned from Python script");
                    return StatusCode(500, new { message = "No weights returned from Python script", details = output });
                }

                return Ok(new { weights = optimizedWeights });
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Error parsing optimizer output: {Output}", output);
                return StatusCode(500, new { message = "Error parsing optimizer output", details = output, error = ex.Message });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error optimizing weights");
            return StatusCode(500, new { message = "An error occurred while optimizing weights", details = ex.Message });
        }
    }

    /// <summary>
    /// Diagnostic endpoint to check Python environment.
    /// </summary>
    /// <returns>Diagnostic information about the Python environment.</returns>
    /// <example>
    /// GET /api/ReviewLog/diagnostics
    /// </example>
    [HttpGet("diagnostics")]
    public async Task<ActionResult<object>> CheckPythonEnvironment()
    {
        try
        {
            var diagnosticInfo = new Dictionary<string, string>();

            // Check if Python is available
            string pythonPath;
            if (Environment.OSVersion.Platform == PlatformID.Win32NT)
            {
                pythonPath = "python";
            }
            else
            {
                var wrapperScriptPath = Path.Combine(Directory.GetCurrentDirectory(), "fsrs", "run_python.sh");
                if (System.IO.File.Exists(wrapperScriptPath))
                {
                    pythonPath = wrapperScriptPath;
                    diagnosticInfo["wrapper"] = "Using wrapper script";
                }
                else if (System.IO.File.Exists("/opt/venv/bin/python"))
                {
                    pythonPath = "/opt/venv/bin/python";
                    diagnosticInfo["venv"] = "Using virtual env";
                }
                else
                {
                    pythonPath = "python3";
                    diagnosticInfo["system"] = "Using system Python";
                }
            }

            // Check Python version
            var versionProcess = new ProcessStartInfo
            {
                FileName = pythonPath,
                Arguments = "-c \"import sys; print(sys.version)\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process1 = new Process { StartInfo = versionProcess };
            process1.Start();
            var versionOutput = await process1.StandardOutput.ReadToEndAsync();
            var versionError = await process1.StandardError.ReadToEndAsync();
            await process1.WaitForExitAsync();
            diagnosticInfo["python_version"] = versionOutput.Trim();

            if (!string.IsNullOrEmpty(versionError))
            {
                diagnosticInfo["version_error"] = versionError.Trim();
            }

            // Check installed packages
            var packagesProcess = new ProcessStartInfo
            {
                FileName = pythonPath,
                Arguments = "-c \"import sys; import pkg_resources; print('\\n'.join([f'{pkg.key}=={pkg.version}' for pkg in pkg_resources.working_set]))\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process2 = new Process { StartInfo = packagesProcess };
            process2.Start();
            var packagesOutput = await process2.StandardOutput.ReadToEndAsync();
            var packagesError = await process2.StandardError.ReadToEndAsync();
            await process2.WaitForExitAsync();
            diagnosticInfo["installed_packages"] = packagesOutput.Trim();

            if (!string.IsNullOrEmpty(packagesError))
            {
                diagnosticInfo["packages_error"] = packagesError.Trim();
            }

            // Try to import torch and pandas
            var importProcess = new ProcessStartInfo
            {
                FileName = pythonPath,
                Arguments = "-c \"try: import pandas; print(f'pandas={pandas.__version__}'); except Exception as e: print(f'pandas_error={str(e)}'); try: import torch; print(f'torch={torch.__version__}'); except Exception as e: print(f'torch_error={str(e)}')\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process3 = new Process { StartInfo = importProcess };
            process3.Start();
            var importOutput = await process3.StandardOutput.ReadToEndAsync();
            var importError = await process3.StandardError.ReadToEndAsync();
            await process3.WaitForExitAsync();
            diagnosticInfo["import_test"] = importOutput.Trim();

            if (!string.IsNullOrEmpty(importError))
            {
                diagnosticInfo["import_error"] = importError.Trim();
            }

            // Check if the optimizer.py file exists
            var optimizerPath = Path.Combine(Directory.GetCurrentDirectory(), "fsrs", "optimizer.py");
            diagnosticInfo["optimizer_exists"] = System.IO.File.Exists(optimizerPath).ToString();

            if (System.IO.File.Exists(optimizerPath))
            {
                diagnosticInfo["optimizer_size"] = new FileInfo(optimizerPath).Length.ToString() + " bytes";
            }

            return Ok(diagnosticInfo);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking Python environment");
            return StatusCode(500, new { error = "Error checking Python environment", details = ex.ToString() });
        }
    }
}
