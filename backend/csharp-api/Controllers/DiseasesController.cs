using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Data;
using PlantSystem.API.Models;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiseasesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiseasesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDiseases()
        {
            try
            {
                var diseases = await _context.Diseases.ToListAsync();
                return Ok(new { success = true, diseases });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDisease(int id)
        {
            try
            {
                var disease = await _context.Diseases.FindAsync(id);
                if (disease == null)
                    return NotFound(new { success = false, message = "Disease not found" });

                return Ok(new { success = true, disease });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.Diseases
                    .GroupBy(d => d.Category)
                    .Select(g => new {
                        Category = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                return Ok(new { success = true, categories });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}