using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WordTypeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WordTypeController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/WordType
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WordType>>> GetWordTypes()
    {
        return await _context.WordTypes.ToListAsync();
    }

    // GET: api/WordType/5
    [HttpGet("{id}")]
    public async Task<ActionResult<WordType>> GetWordType(int id)
    {
        var wordType = await _context.WordTypes.FindAsync(id);

        if (wordType == null)
        {
            return NotFound();
        }

        return wordType;
    }

    // POST: api/WordType
    [HttpPost]
    public async Task<ActionResult<WordType>> CreateWordType(WordType wordType)
    {
        _context.WordTypes.Add(wordType);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWordType), new { id = wordType.Id }, wordType);
    }

    // PUT: api/WordType/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWordType(int id, WordType wordType)
    {
        if (id != wordType.Id)
        {
            return BadRequest();
        }

        _context.Entry(wordType).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordTypeExists(id))
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

    // DELETE: api/WordType/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWordType(int id)
    {
        var wordType = await _context.WordTypes.FindAsync(id);
        if (wordType == null)
        {
            return NotFound();
        }

        _context.WordTypes.Remove(wordType);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool WordTypeExists(int id)
    {
        return _context.WordTypes.Any(e => e.Id == id);
    }
}
