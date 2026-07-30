using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Data;
using PlantSystem.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LearningMaterialController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LearningMaterialController> _logger;

        public LearningMaterialController(AppDbContext context, ILogger<LearningMaterialController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("admin/all")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var materials = await _context.LearningMaterials
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
            return Ok(new { success = true, materials });
        }

        [HttpGet("admin/{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> Get(int id)
        {
            var mat = await _context.LearningMaterials.FindAsync(id);
            if (mat == null) return NotFound(new { success = false, message = "Not found" });
            return Ok(new { success = true, material = mat });
        }

        [HttpPost("admin")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> Create([FromBody] LearningMaterial mat)
        {
            mat.CreatedAt = DateTime.UtcNow;
            mat.UpdatedAt = DateTime.UtcNow;
            _context.LearningMaterials.Add(mat);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, material = mat });
        }

        [HttpPut("admin/{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] LearningMaterial mat)
        {
            var existing = await _context.LearningMaterials.FindAsync(id);
            if (existing == null) return NotFound(new { success = false, message = "Not found" });
            existing.Title = mat.Title;
            existing.Description = mat.Description;
            existing.Category = mat.Category;
            existing.Difficulty = mat.Difficulty;
            existing.Content = mat.Content;
            existing.ImageUrl = mat.ImageUrl;
            existing.PdfUrl = mat.PdfUrl;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, material = existing });
        }

        [HttpDelete("admin/{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var mat = await _context.LearningMaterials.FindAsync(id);
            if (mat == null) return NotFound(new { success = false, message = "Not found" });
            _context.LearningMaterials.Remove(mat);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("upload-pdf")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> UploadPdf([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "No file received" });

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "File type not allowed. Only PDF accepted." });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "pdfs");
            Directory.CreateDirectory(uploadsDir);

            var uniqueFile = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsDir, uniqueFile);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var pdfUrl = $"{baseUrl}/uploads/pdfs/{uniqueFile}";

            return Ok(new { success = true, pdfUrl });
        }

        [HttpPost("upload-image")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "No image file received" });

            var validTypes = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!validTypes.Contains(ext))
                return BadRequest(new { success = false, message = "Only image files (jpg, png, gif, bmp) allowed." });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "images");
            Directory.CreateDirectory(uploadsDir);

            var uniqueFile = Guid.NewGuid().ToString() + ext;
            var filePath = Path.Combine(uploadsDir, uniqueFile);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var imageUrl = $"{baseUrl}/uploads/images/{uniqueFile}";

            return Ok(new { success = true, imageUrl });
        }

        // Get material created by admin
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllMaterials()
        {
            try
            {
                var materials = await _context.LearningMaterials  // Fixed: Use LearningMaterials consistently
                    .Select(m => new {
                        m.Id,
                        m.Title,
                        m.Description,
                        m.Category,
                        m.Difficulty,
                        m.ImageUrl,
                        m.PdfUrl,
                        m.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, materials });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting learning materials");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetMaterial(int id)
        {
            var material = await _context.LearningMaterials  // Fixed: Use LearningMaterials consistently
                .Where(m => m.Id == id)
                .Select(m => new {
                    m.Id,
                    m.Title,
                    m.Description,
                    m.Content,
                    m.Category,
                    m.Difficulty,
                    m.ImageUrl,
                    m.PdfUrl,
                    m.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (material == null)
                return NotFound(new { success = false, message = "Material not found" });

            return Ok(new { success = true, material });
        }
    }
}