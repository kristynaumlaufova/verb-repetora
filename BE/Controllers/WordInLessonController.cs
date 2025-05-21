using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE.Data;
using BE.Models;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WordInLessonController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WordInLessonController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/WordInLesson
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WordInLesson>>> GetWordInLessons()
    {
        return await _context.WordInLessons.ToListAsync();
    }

    // GET: api/WordInLesson/5
    [HttpGet("{id}")]
    public async Task<ActionResult<WordInLesson>> GetWordInLesson(int id)
    {
        var wordInLesson = await _context.WordInLessons.FindAsync(id);

        if (wordInLesson == null)
        {
            return NotFound();
        }

        return wordInLesson;
    }

    // POST: api/WordInLesson
    [HttpPost]
    public async Task<ActionResult<WordInLesson>> CreateWordInLesson(WordInLesson wordInLesson)
    {
        _context.WordInLessons.Add(wordInLesson);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWordInLesson), new { id = wordInLesson.Id }, wordInLesson);
    }

    // PUT: api/WordInLesson/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWordInLesson(int id, WordInLesson wordInLesson)
    {
        if (id != wordInLesson.Id)
        {
            return BadRequest();
        }

        _context.Entry(wordInLesson).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WordInLessonExists(id))
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

    // DELETE: api/WordInLesson/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWordInLesson(int id)
    {
        var wordInLesson = await _context.WordInLessons.FindAsync(id);
        if (wordInLesson == null)
        {
            return NotFound();
        }

        _context.WordInLessons.Remove(wordInLesson);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool WordInLessonExists(int id)
    {
        return _context.WordInLessons.Any(e => e.Id == id);
    }
}
