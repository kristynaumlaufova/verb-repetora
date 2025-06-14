using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

using BE.Data;
using BE.Models;
using BE.Models.Dto;

namespace BE.Controllers;

/// <summary>
/// Controller for user related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AppUserController(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Registers a new user.
    /// </summary>
    /// <param name="request">The registration details.</param>
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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.First().Description);
        }

        await userManager.AddToRoleAsync(user, "User");

        // Create the language for the user
        var language = new Language
        {
            Name = request.Language,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            context.Languages.Add(language);
            await context.SaveChangesAsync();

            await signInManager.SignInAsync(user, isPersistent: false);

            return Ok(new AuthResponse(
                Message: "Registration successful",
                User: new UserDto(
                    Id: user.Id,
                    Username: user.UserName ?? ""
                )
            ));
        }
        catch (Exception)
        {
            await userManager.DeleteAsync(user);
            return BadRequest("Failed to create language");
        }
    }

    /// <summary>
    /// Logs in an existing user.
    /// </summary>
    /// <param name="request">The login credentials.</param>
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

        var result = await signInManager.PasswordSignInAsync(user, request.Password, isPersistent: true, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            return Unauthorized("Invalid username or password");
        }

        await signInManager.SignInAsync(user, isPersistent: false);

        return Ok(new AuthResponse(
            Message: "Login successful",
            User: new UserDto(
                Id: user.Id,
                Username: user.UserName ?? ""
            )
        ));
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
