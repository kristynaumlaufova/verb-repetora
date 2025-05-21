using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WordController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WordController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Word
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Word>>> GetWords()
    {
        return await _context.Words.ToListAsync();
    }

    // GET: api/Word/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Word>> GetWord(int id)
    {
        var word = await _context.Words.FindAsync(id);

        if (word == null)
        {
            return NotFound();
        }

        return word;
    }

    // POST: api/Word
    [HttpPost]
    public async Task<ActionResult<Word>> CreateWord(Word word)
    {
        _context.Words.Add(word);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWord), new { id = word.Id }, word);
    }

    // PUT: api/Word/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWord(int id, Word word)
    {
        if (id != word.Id)
        {
            return BadRequest();
        }

        _context.Entry(word).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordExists(id))
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

    // DELETE: api/Word/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWord(int id)
    {
        var word = await _context.Words.FindAsync(id);
        if (word == null)
        {
            return NotFound();
        }

        _context.Words.Remove(word);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool WordExists(int id)
    {
        return _context.Words.Any(e => e.Id == id);
    }
}
