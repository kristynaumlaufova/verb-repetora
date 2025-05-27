using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Models;
using BE.Models.Dto;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;

namespace BE.Controllers;

/// <summary>
/// Controller for user related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[EnableCors]
public class AppUserController(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    LanguageController languageController) : ControllerBase
{

    /// <summary>
    /// Registers a new user.
    /// </summary>
    /// <param name="request">The registration details.</param>
    /// <returns>A response indicating the result of the registration.</returns>
    /// <example>
    /// POST /api/AppUser/register
    /// {
    ///     "username": "johndoe",
    ///     "password": "P@ssw0rd",
    ///     "language": "English"
    /// }
    /// </example>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await userManager.FindByNameAsync(request.Username) != null)
        {
            return BadRequest("Username already exists");
        }

        var user = new AppUser
        {
            UserName = request.Username,
            Email = request.Username + "@placeholder.com", // Identity requires email
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.First().Description);
        }

        // Add user to the User role
        await userManager.AddToRoleAsync(user, "User");

        // Create the language for the user
        var language = new Language
        {
            Name = request.Language,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }; var languageResult = await languageController.CreateLanguage(language);
        if (languageResult.Result is CreatedAtActionResult)
        {
            await signInManager.SignInAsync(user, isPersistent: false);

            return Ok(new AuthResponse
            {
                Message = "Registration successful",
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? string.Empty,
                    Languages = new List<LanguageDto>
                    {
                        new LanguageDto
                        {
                            Name = request.Language
                        }
                    }
                }
            });
        }

        // If language creation failed, delete the user and return error
        await userManager.DeleteAsync(user);
        return BadRequest("Failed to create language");
    }

    /// <summary>
    /// Logs in an existing user.
    /// </summary>
    /// <param name="request">The login credentials.</param>
    /// <returns>A response containing the authentication token and user details.</returns>
    /// <example>
    /// POST /api/AppUser/login
    /// {
    ///     "username": "johndoe",
    ///     "password": "P@ssw0rd"
    /// }
    /// </example>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            return Unauthorized("Invalid username or password");
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized("Invalid username or password");
        }

        // Load user's languages
        var languages = await userManager.Users
            .Where(u => u.Id == user.Id)
            .SelectMany(u => u.Languages)
            .Select(l => new LanguageDto { Id = l.Id, Name = l.Name })
            .ToListAsync();

        return Ok(new AuthResponse
        {
            Message = "Login successful",
            User = new UserDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Languages = languages
            }
        });
    }

    /// <summary>
    /// Retrieves a user by their ID.
    /// </summary>
    /// <param name="id">The ID of the user to retrieve.</param>
    /// <returns>The requested user.</returns>
    /// <example>
    /// GET /api/AppUser/5
    /// </example>
    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<AppUser>> GetUser(int id)
    {
        if (User.FindFirstValue(ClaimTypes.NameIdentifier) != id.ToString())
        {
            return Forbid();
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return NotFound();
        }

        var languages = await userManager.Users
            .Where(u => u.Id == id)
            .SelectMany(u => u.Languages)
            .Select(l => new { id = l.Id, name = l.Name })
            .ToListAsync();

        return Ok(new
        {
            id = user.Id,
            username = user.UserName,
            languages = languages
        });
    }

    /// <summary>
    /// Logs out the current user.
    /// </summary>
    /// <example>
    /// POST /api/AppUser/logout
    /// </example>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok(new { message = "Successfully logged out" });
    }
}
