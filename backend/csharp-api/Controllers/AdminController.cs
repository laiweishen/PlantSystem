using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PlantSystem.API.Data;
using PlantSystem.API.Models;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.Role,
                        u.CreatedAt,
                        LastActivity = u.UpdatedAt ?? u.CreatedAt,
                        Status = u.IsActive ? "Active" : "Inactive"
                    })
                    .OrderByDescending(u => u.CreatedAt)
                    .ToListAsync();

                return Ok(new { success = true, users });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                // ⭐ PERMANENT DELETE - Remove from database
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "User permanently deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPatch("users/{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(int userId, [FromBody] UserStatusUpdate statusUpdate)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                // Update IsActive based on status string
                user.IsActive = statusUpdate.Status?.ToLower() == "active";
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"User {statusUpdate.Status?.ToLower()}d successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            try
            {
                var totalUsers = await _context.Users
                    .CountAsync(u => u.Role != "Admin");
                var activeUsers = await _context.Users
                    .CountAsync(u => u.IsActive && u.Role != "Admin");
                var studentCount = await _context.Users.CountAsync(u => u.Role == "Student");
                var researcherCount = await _context.Users.CountAsync(u => u.Role == "Researcher");
                var enthusiastCount = await _context.Users.CountAsync(u => u.Role == "Enthusiast" || u.Role == "Nature Enthusiast");
                var teacherCount = await _context.Users.CountAsync(u => u.Role == "Teacher");
                var farmerCount = await _context.Users.CountAsync(u => u.Role == "Farmer");

                var totalQuizzes = 3 + await _context.Quizzes.CountAsync();

                var recentActivities = await _context.ActivityLogs
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(3)
                    .Select(a => new
                    {
                        title = a.Title,
                        author = _context.Users
                            .Where(u => u.Id == a.UserId)
                            .Select(u => u.Name)
                            .FirstOrDefault() ?? "System",
                        time = a.CreatedAt
                    })
                    .ToListAsync();

                var overviewData = new
                {
                    totalUsers,
                    activeUsers,
                    totalQuizzes,
                    studentCount,
                    researcherCount,
                    enthusiastCount,
                    teacherCount,
                    farmerCount,
                    recentActivities
                };

                return Ok(new { success = true, data = overviewData });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] RegisterRequest request)
        {
            try
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    return BadRequest(new { success = false, message = "User already exists" });
                }

                string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                var newUser = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    PasswordHash = passwordHash,
                    Role = request.Role,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "User created successfully",
                    user = new
                    {
                        id = newUser.Id,
                        name = newUser.Name,
                        email = newUser.Email,
                        role = newUser.Role,
                        status = "Active",
                        lastActivity = newUser.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                // Update user properties
                user.Name = request.Name;
                user.Email = request.Email;
                user.Role = request.Role;
                user.IsActive = request.Status?.ToLower() == "active";
                user.UpdatedAt = DateTime.UtcNow;

                // Only update password if provided
                if (!string.IsNullOrEmpty(request.Password))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "User updated successfully",
                    user = new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role,
                        status = user.IsActive ? "Active" : "Inactive",
                        lastActivity = user.UpdatedAt ?? user.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("verify-password")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> VerifyPassword([FromBody] PasswordVerificationRequest request)
        {
            try
            {
                // Get email from token
                var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email)
                              ?? User.FindFirst("email");

                if (emailClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Cannot identify user from token" });
                }

                // Find admin by email
                var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailClaim.Value);

                if (admin == null)
                {
                    return NotFound(new { success = false, message = "Admin not found" });
                }

                // Verify password
                bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash);

                if (!isPasswordCorrect)
                {
                    return BadRequest(new { success = false, message = "Incorrect password" });
                }

                return Ok(new
                {
                    success = true,
                    message = "Password verified",
                    adminName = admin.Name
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("quizzes")]
        public async Task<IActionResult> GetQuizzes()
        {
            try
            {
                // Quiz statistics from results
                var plantQuizStats = await _context.QuizResults
                    .Where(q => q.QuizType == "plant")
                    .GroupBy(q => 1)
                    .Select(g => new
                    {
                        completion = g.Count(),
                        averageScore = Math.Round(g.Average(q => (q.Score * 100.0) / q.TotalQuestions), 0)
                    })
                    .FirstOrDefaultAsync();

                var diseaseQuizStats = await _context.QuizResults
                    .Where(q => q.QuizType == "disease")
                    .GroupBy(q => 1)
                    .Select(g => new
                    {
                        completion = g.Count(),
                        averageScore = Math.Round(g.Average(q => (q.Score * 100.0) / q.TotalQuestions), 0)
                    })
                    .FirstOrDefaultAsync();

                // You no longer have fixed question tables, so you can:
                // - Either hard-code question counts (e.g. 10/15), or
                // - Infer from last quiz run, or leave as 0/not tracked.
                var quizzes = new List<object>
        {
            new
            {
                id = 1,
                title = "Plant Identification Quiz",
                category = "Identification",
                difficulty = "Medium",
                status = "Active",
                questions = 10, // or any default you want to show
                completion = plantQuizStats?.completion ?? 0,
                averageScore = (int)(plantQuizStats?.averageScore ?? 0),
                createdAt = DateTime.UtcNow
            },
            new
            {
                id = 2,
                title = "Disease Detection Quiz",
                category = "Disease",
                difficulty = "Hard",
                status = "Active",
                questions = 10,
                completion = diseaseQuizStats?.completion ?? 0,
                averageScore = (int)(diseaseQuizStats?.averageScore ?? 0),
                createdAt = DateTime.UtcNow
            }
        };

                return Ok(new { success = true, quizzes });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("quizzes/{id}")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            try
            {
                // For now, you can't delete the built-in quizzes
                // This would be implemented when you add custom quiz creation
                return BadRequest(new { success = false, message = "Cannot delete system quizzes" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("activities")]
        public async Task<IActionResult> GetRecentActivities()
        {
            var activities = await _context.ActivityLogs
               .OrderByDescending(a => a.CreatedAt)
               .Take(50)
               .Select(a => new
               {
                   title = a.Title,
                   author = _context.Users
                       .Where(u => u.Id == a.UserId)
                       .Select(u => u.Name)
                       .FirstOrDefault() ?? "System",
                   time = a.CreatedAt
               })
               .ToListAsync();

            return Ok(new { success = true, activities });
        }


    }

    public class PasswordVerificationRequest
    {
        public string Password { get; set; } = string.Empty;
    }

    // ⭐ FIXED: Added null safety
    public class UpdateUserRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? Password { get; set; }
    }

    // ⭐ FIXED: Added null safety
    public class UserStatusUpdate
    {
        public string? Status { get; set; }
    }
}
