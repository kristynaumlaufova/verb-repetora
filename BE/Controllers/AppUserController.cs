using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

/// <summary>
/// Controller for user related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AppUserController(ApplicationDbContext context) : ControllerBase
{
    /// <summary>
    /// Retrieves all users from the database.
    /// </summary>
    /// <returns>A list of all users.</returns>
    /// <example>
    /// GET /api/AppUser
    /// </example>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
    {
        return await context.Users.ToListAsync();
    }

    /// <summary>
    /// Retrieves a user by their ID.
    /// </summary>
    /// <param name="id">The ID of the user to retrieve.</param>
    /// <returns>The requested user.</returns>
    /// <example>
    /// GET /api/AppUser/5
    /// </example>
    [HttpGet("{id}")]
    public async Task<ActionResult<AppUser>> GetUser(int id)
    {
        var user = await context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound();
        }

        return user;
    }

    /// <summary>
    /// Creates a new user.
    /// </summary>
    /// <param name="user">The user object to create.</param>
    /// <returns>The created user.</returns>
    /// <example>
    /// POST /api/AppUser
    /// {
    ///     "email": "john.doe@example.com",
    ///     "name": "John Doe"
    /// }
    /// </example>
    [HttpPost]
    public async Task<ActionResult<AppUser>> CreateUser(AppUser user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    /// <summary>
    /// Updates a specific user.
    /// </summary>
    /// <param name="id">The ID of the user to update.</param>
    /// <param name="user">The updated user object.</param>
    /// <example>
    /// PUT /api/AppUser/5
    /// {
    ///     "id": 5,
    ///     "email": "john.doe.updated@example.com",
    ///     "name": "John Doe"
    /// }
    /// </example>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, AppUser user)
    {
        if (id != user.Id)
        {
            return BadRequest();
        }

        context.Entry(user).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!UserExists(id))
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
    /// Deletes a specific user.
    /// </summary>
    /// <param name="id">The ID of the user to delete.</param>
    /// <example>
    /// DELETE /api/AppUser/5
    /// </example>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        context.Users.Remove(user);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private bool UserExists(int id)
    {
        return context.Users.Any(e => e.Id == id);
    }
}
