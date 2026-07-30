using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Models;
using PlantSystem.API.Services;
using PlantSystem.API.Data;
using Microsoft.AspNetCore.Authorization;
using PlantSystem.API.Helpers;
using System.Security.Claims;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public AuthController(IAuthService authService, AppDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _authService = authService;
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var response = await _authService.RegisterAsync(request);

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        // ⭐ NEW: Verify any authenticated user
        [HttpGet("verify")]
        [Authorize]
        public async Task<IActionResult> Verify()
        {
            try
            {
                var userIdClaim = User.FindFirst("userId")
                               ?? User.FindFirst(ClaimTypes.NameIdentifier)
                               ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user token" });
                }

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found" });
                }

                return Ok(new
                {
                    success = true,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        name = user.Name,
                        role = user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ⭐ NEW: Verify admin user only
        [HttpGet("verify-admin")]
        [Authorize]
        public async Task<IActionResult> VerifyAdmin()
        {
            try
            {
                var userIdClaim = User.FindFirst("userId")
                               ?? User.FindFirst(ClaimTypes.NameIdentifier)
                               ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user token" });
                }

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not found" });
                }

                // Check if user is admin
                if (user.Role?.ToLower() != "admin")
                {
                    return StatusCode(403, new
                    {
                        success = false,
                        message = "Admin access required"
                    });
                }

                return Ok(new
                {
                    success = true,
                    isAdmin = true,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        name = user.Name,
                        role = user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();

                var userList = users.Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.Name,
                    u.Role,
                    u.ImageUrl,
                    u.Bio,
                    u.CreatedAt

                }).ToList();

                return Ok(new
                {
                    success = true,
                    count = users.Count,
                    users = userList
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst("userId")
                               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                               ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user" });
                }

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                var imageUrl = user.ImageUrl != null
                    ? $"{Request.Scheme}://{Request.Host}{user.ImageUrl}"
                    : null;

                return Ok(new
                {
                    success = true, 
                    user = new    
                    {
                        Name = user.Name ?? "User",
                        Email = user.Email ?? "",
                        Role = user.Role ?? "Student",
                        Bio = user.Bio ?? "",
                        ImageUrl = imageUrl
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        [HttpPut("profile")]
        [Authorize]
        [RequestSizeLimit(10485760)] // ⭐ 10MB limit
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("userId")
                               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                               ?? User.FindFirst("sub");

                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "User ID not found in token" });
                }

                if (!int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest(new { success = false, message = "Invalid user ID" });
                }

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                // Validate email
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.Id != userId);

                if (existingUser != null)
                {
                    return BadRequest(new { success = false, message = "Email is already taken" });
                }

                // Update basic info
                user.Name = request.Name;
                user.Email = request.Email;
                user.Bio = request.Bio;
                user.UpdatedAt = DateTime.UtcNow;

                // Handle image upload
                if (request.ProfileImage != null && request.ProfileImage.Length > 0)
                {

                    var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "profiles");

                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    // Delete old image
                    if (!string.IsNullOrEmpty(user.ImageUrl))
                    {
                        var oldImagePath = Path.Combine(_webHostEnvironment.WebRootPath, user.ImageUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldImagePath))
                        {
                            System.IO.File.Delete(oldImagePath);
                        }
                    }

                    // Save new image
                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(request.ProfileImage.FileName)}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await request.ProfileImage.CopyToAsync(stream);
                    }

                    user.ImageUrl = $"/uploads/profiles/{fileName}";
                }

                await _context.SaveChangesAsync();

                var imageUrl = user.ImageUrl != null
                    ? $"{Request.Scheme}://{Request.Host}{user.ImageUrl}"
                    : null;

                return Ok(new
                {
                    success = true,
                    message = "Profile updated successfully",
                    user = new
                    {
                        user.Name,
                        user.Email,
                        user.Role,
                        user.Bio,
                        ImageUrl = imageUrl,
                        Username = user.Email.Split('@')[0]
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Server error: {ex.Message}" });
            }
        }


        [HttpPost("forgot")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null) return Ok(new { success = false, message = "If this email exists, you’ll get an email." });

            // 1. Generate secure token
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            user.ResetToken = token;
            user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1); // 1-hour expiry
            await _context.SaveChangesAsync();

            // 2. Email (pseudo, use real smtp/email sender)
            var resetLink = $"http://localhost:3000/reset-password?token={token}";
            await EmailHelper.SendAsync(user.Email, "Password Reset", $"Reset: {resetLink}");

            return Ok(new { success = true });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ResetToken == req.Token && u.ResetTokenExpiry > DateTime.UtcNow);
            if (user == null) return BadRequest(new { success = false, message = "Invalid/expired token" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiry = null;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Password has been reset" });
        }


        public class UpdateProfileRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
            public string? Bio { get; set; }
            public IFormFile? ProfileImage { get; set; }
        }


    }
}