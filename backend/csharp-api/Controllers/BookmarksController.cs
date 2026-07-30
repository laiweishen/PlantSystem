using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Models;
using PlantSystem.API.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookmarksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookmarksController(AppDbContext context)
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

        // POST: api/bookmarks/toggle
        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleBookmark([FromBody] BookmarkRequest request)
        {
            try
            {
                var userId = GetUserId();

                // Validate item type
                if (request.ItemType != "plant" && request.ItemType != "disease")
                {
                    return BadRequest(new { success = false, message = "Invalid item type. Must be 'plant' or 'disease'" });
                }

                // Check if item exists
                if (request.ItemType == "plant")
                {
                    var plantExists = await _context.Plants.AnyAsync(p => p.Id == request.ItemId);
                    if (!plantExists)
                    {
                        return NotFound(new { success = false, message = "Plant not found" });
                    }
                }
                else if (request.ItemType == "disease")
                {
                    var diseaseExists = await _context.Diseases.AnyAsync(d => d.Id == request.ItemId);
                    if (!diseaseExists)
                    {
                        return NotFound(new { success = false, message = "Disease not found" });
                    }
                }

                var existingBookmark = await _context.Bookmarks
                    .FirstOrDefaultAsync(b => b.UserId == userId &&
                                             b.ItemType == request.ItemType &&
                                             b.ItemId == request.ItemId);

                if (existingBookmark != null)
                {
                    // Remove bookmark
                    _context.Bookmarks.Remove(existingBookmark);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        bookmarked = false,
                        message = "Bookmark removed successfully"
                    });
                }
                else
                {
                    // Add bookmark
                    var newBookmark = new Bookmark
                    {
                        UserId = userId,
                        ItemType = request.ItemType,
                        ItemId = request.ItemId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Bookmarks.Add(newBookmark);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        bookmarked = true,
                        message = "Bookmark added successfully"
                    });
                }
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Invalid user token" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error toggling bookmark",
                    error = ex.Message
                });
            }
        }

        // GET: api/bookmarks
        [HttpGet]
        public async Task<IActionResult> GetUserBookmarks()
        {
            try
            {
                var userId = GetUserId();

                var bookmarks = await _context.Bookmarks
                    .Where(b => b.UserId == userId)
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();

                var bookmarkDtos = new List<BookmarkDto>();

                foreach (var bookmark in bookmarks)
                {
                    var dto = new BookmarkDto
                    {
                        Id = bookmark.Id,
                        ItemType = bookmark.ItemType,
                        ItemId = bookmark.ItemId,
                        CreatedAt = bookmark.CreatedAt
                    };

                    // Fetch plant or disease details based on itemType
                    if (bookmark.ItemType == "plant")
                    {
                        var plant = await _context.Plants.FindAsync(bookmark.ItemId);
                        if (plant != null)
                        {
                            dto.Name = plant.Name;
                            dto.ScientificName = plant.ScientificName;
                            dto.ImageUrl = plant.ImageUrl;
                            dto.Description = plant.Description;
                        }
                    }
                    else if (bookmark.ItemType == "disease")
                    {
                        var disease = await _context.Diseases.FindAsync(bookmark.ItemId);
                        if (disease != null)
                        {
                            dto.Name = disease.Name;
                            dto.ScientificName = disease.PathogenName;
                            dto.ImageUrl = disease.ImageUrl;
                            dto.Description = disease.Symptoms;
                        }
                    }

                    // Only add if we found the item
                    if (!string.IsNullOrEmpty(dto.Name))
                    {
                        bookmarkDtos.Add(dto);
                    }
                }

                return Ok(new
                {
                    success = true,
                    bookmarks = bookmarkDtos,
                    count = bookmarkDtos.Count
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Invalid user token" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error fetching bookmarks",
                    error = ex.Message
                });
            }
        }

        // GET: api/bookmarks/check?itemType=plant&itemId=5
        [HttpGet("check")]
        public async Task<IActionResult> CheckBookmarkStatus(string itemType, int itemId)
        {
            try
            {
                var userId = GetUserId();

                var isBookmarked = await _context.Bookmarks
                    .AnyAsync(b => b.UserId == userId &&
                                  b.ItemType == itemType &&
                                  b.ItemId == itemId);

                return Ok(new
                {
                    success = true,
                    isBookmarked
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Invalid user token" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error checking bookmark status",
                    error = ex.Message
                });
            }
        }
    }
}