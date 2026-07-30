using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Data;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScanResultsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ScanResultsController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst("userId")
                       ?? User.FindFirst(ClaimTypes.NameIdentifier)
                       ?? User.FindFirst("sub");

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }

        return userId;
    }

    public class CreateScanResultRequest
    {
        public string ScanType { get; set; }       // "plant" or "disease"
        public string ImageFileName { get; set; }
        public string PredictedName { get; set; }
        public double Confidence { get; set; }
        public bool? IsHealthy { get; set; }
        public int? PlantId { get; set; }
        public int? DiseaseId { get; set; }
        public string ImageUrl { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> CreateScanResult([FromBody] CreateScanResultRequest request)
    {
        try
        {
            var userId = GetUserId();

            if (request.ScanType != "plant" && request.ScanType != "disease")
            {
                return BadRequest(new { success = false, message = "Invalid scan type" });
            }

            var scan = new ScanResult
            {
                UserId = userId,
                ScanType = request.ScanType,
                ImageFileName = request.ImageFileName,
                PredictedName = request.PredictedName,
                Confidence = request.Confidence,
                IsHealthy = request.IsHealthy,
                PlantId = request.ScanType == "plant" ? request.PlantId : null,
                DiseaseId = request.ScanType == "disease" ? request.DiseaseId : null,
                ImageUrl = request.ImageUrl,
                CreatedAt = DateTime.UtcNow
            };

            _context.ScanResults.Add(scan);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, id = scan.Id });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "Invalid user token" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error saving scan", error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetUserScanResults()
    {
        try
        {
            var userId = GetUserId();

            var scans = await _context.ScanResults
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(new { success = true, scans });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "Invalid user token" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error fetching scans", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetScanResult(int id)
    {
        try
        {
            var userId = GetUserId();

            var scan = await _context.ScanResults
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (scan == null)
            {
                return NotFound(new { success = false, message = "Scan not found" });
            }

            return Ok(new { success = true, scan });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { success = false, message = "Invalid user token" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error fetching scan", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteScanResult(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { success = false, message = "User not found in token" });

            var userId = int.Parse(userIdClaim.Value);

            var scan = await _context.ScanResults
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (scan == null)
                return NotFound(new { success = false, message = "Scan not found" });

            _context.ScanResults.Remove(scan);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Scan deleted" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { success = false, message = "Failed to delete scan" });
        }
    }





}
