using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Data;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminAnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("user-stats")]
    public async Task<IActionResult> GetUserStats()
    {
        var totalUsers = await _context.Users.CountAsync(u => u.Role != "Admin");
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive && u.Role != "Admin");
        var userRoles = await _context.Users
            .Where(u => u.Role != "Admin")
            .GroupBy(u => u.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            activeUsers,
            inactiveUsers = totalUsers - activeUsers,
            userRoles
        });
    }

    [HttpGet("quiz-completion-rate")]
    public async Task<IActionResult> GetQuizCompletionRate()
    {
        var userIdsNoAdmin = await _context.Users
         .Where(u => u.Role != "Admin")
         .Select(u => u.Id)
         .ToListAsync();

        var totalUsers = userIdsNoAdmin.Count;

        var usersWithCompletedQuiz = await _context.QuizResults
            .Where(q => q.CompletedAt != null && userIdsNoAdmin.Contains(q.UserId))
            .Select(q => q.UserId)
            .Distinct()
            .CountAsync();

        double rate = totalUsers == 0 ? 0 : (double)usersWithCompletedQuiz / totalUsers * 100;

        return Ok(new { completionRate = Math.Round(rate, 2) });
    }



    [HttpGet("average-score")]
    public async Task<IActionResult> GetAverageScore()
    {
        // Highest score per user per quiz type
        var userBestScores = await _context.QuizResults
            .GroupBy(q => new { q.UserId, q.QuizType })
            .Select(g => g.Max(x => x.Score))
            .ToListAsync();

        var avg = userBestScores.Any()
            ? userBestScores.Average()
            : 0;

        return Ok(new { averageScore = Math.Round(avg, 2) });
    }



    [HttpGet("subject-performance")]
    public async Task<IActionResult> GetSubjectPerformance()
    {
        var subjectStats = await _context.QuizResults
            .GroupBy(q => q.QuizType.Trim().ToLower())
            .Select(g => new
            {
                QuizType = char.ToUpper(g.Key[0]) + g.Key.Substring(1),
                AvgScore = Math.Round(
                    g.Average(x => (x.Score * 100.0) / x.TotalQuestions),
                    2
                )
            })
            .ToListAsync();

        return Ok(subjectStats);
    }


    [HttpGet("student-engagement")]
    public async Task<IActionResult> GetStudentEngagement()
    {
        var buckets = await _context.QuizResults
            .GroupBy(q => q.UserId)
            .Select(g => new {
                UserId = g.Key,
                Attempts = g.Count()
            }).ToListAsync();

        int highlyEngaged = buckets.Count(b => b.Attempts >= 10);
        int moderatelyEngaged = buckets.Count(b => b.Attempts >= 5 && b.Attempts < 10);
        int lowEngagement = buckets.Count(b => b.Attempts >= 1 && b.Attempts < 5);

        return Ok(new
        {
            highlyEngaged,
            moderatelyEngaged,
            lowEngagement
        });
    }





}

