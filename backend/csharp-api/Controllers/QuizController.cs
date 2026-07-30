using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PlantSystem.API.Data;
using PlantSystem.API.Models;
using System.Security.Claims;
using System.Text.Json;


namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<QuizController> _logger;

        public QuizController(AppDbContext context, ILogger<QuizController> logger)
        {
            _context = context;
            _logger = logger;
        }

       
        //get quiz from created by admin
        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetQuizById(int id)
        {
            try
            {
                var quiz = await _context.Quizzes
                    .Include(q => q.Questions)
                    .Where(q => q.Id == id)
                    .Select(q => new
                    {
                        q.Id,
                        q.Title,
                        q.Description,
                        q.Category,
                        q.Difficulty,
                        Questions = q.Questions.Select(qq => new
                        {
                            qq.Id,
                            qq.QuestionText,
                            qq.ImageUrl,
                            // This next line builds the needed options object for the frontend
                            Options = new Dictionary<string, string> {
                                { "A", qq.OptionA ?? "" },
                                { "B", qq.OptionB ?? "" },
                                { "C", qq.OptionC ?? "" },
                                { "D", qq.OptionD ?? "" }
                            },
                            qq.CorrectAnswer
                        }).ToList(),
                        q.CreatedAt,
                        q.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (quiz == null)
                    return NotFound(new { success = false, message = "Quiz not found" });

                return Ok(new { success = true, quiz });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quiz by id");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("submit")]
        [Authorize]
        public async Task<IActionResult> SubmitQuiz([FromBody] QuizSubmission submission)
        {
            try
            {
                var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized(new { success = false, message = "User not found in token" });

                var userId = int.Parse(userIdClaim.Value);
                int score = 0;
                var results = new List<object>();
                var resultDetails = new List<QuizResultDetail>();

                foreach (var answer in submission.Answers)
                {
                    // Normalize letters
                    var userLetter = (answer.UserAnswerLetter ?? "").Trim().ToUpper();
                    var correctLetter = (answer.CorrectAnswerLetter ?? answer.CorrectAnswer ?? "").Trim().ToUpper();

                    bool isCorrect = !string.IsNullOrEmpty(userLetter) &&
                                     !string.IsNullOrEmpty(correctLetter) &&
                                     userLetter == correctLetter;

                    if (isCorrect) score++;

                    // Ensure options object exists for review
                    var options = answer.Options ?? new
                    {
                        A = "",
                        B = "",
                        C = "",
                        D = ""
                    };

                    // For display, you can keep UserAnswer text as you already send it from frontend
                    resultDetails.Add(new QuizResultDetail
                    {
                        QuestionId = answer.QuestionId,
                        QuestionText = answer.QuestionText ?? "Question",
                        ImageUrl = answer.ImageUrl ?? "",
                        UserAnswer = answer.UserAnswer,
                        CorrectAnswer = answer.CorrectAnswer, // letter
                        IsCorrect = isCorrect,
                        UserAnswerLetter = userLetter,
                        CorrectAnswerLetter = correctLetter,
                        OptionsJson = JsonSerializer.Serialize(options)
                    });

                    results.Add(new
                    {
                        questionId = answer.QuestionId,
                        questionText = answer.QuestionText ?? "Question",
                        imageUrl = answer.ImageUrl ?? "",
                        userAnswer = answer.UserAnswer,
                        correctAnswer = answer.CorrectAnswer,
                        isCorrect = isCorrect,
                        userAnswerLetter = userLetter == "" ? "?" : userLetter,
                        correctAnswerLetter = correctLetter == "" ? "?" : correctLetter,
                        options = options
                    });
                }

                // Save quiz result
                var quizResult = new QuizResult
                {
                    UserId = userId,
                    QuizType = submission.QuizType,  // "plant", "disease", "mixed"
                    Score = score,
                    TotalQuestions = submission.Answers.Count,
                    CompletedAt = DateTime.UtcNow
                };

                _context.QuizResults.Add(quizResult);
                await _context.SaveChangesAsync();

                _context.ActivityLogs.Add(new ActivityLog
                {
                    UserId = userId,
                    ActionType = "QUIZ_COMPLETED",
                    Title = "Quiz completed",
                    Description = $"{submission.QuizType} quiz, score {score}/{submission.Answers.Count}"
                });
                await _context.SaveChangesAsync();


                // Link details
                foreach (var detail in resultDetails)
                {
                    detail.QuizResultId = quizResult.Id;
                }

                _context.QuizResultDetails.AddRange(resultDetails);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    quizResultId = quizResult.Id,
                    score = score,
                    total = submission.Answers.Count,
                    percentage = Math.Round((score * 100.0) / submission.Answers.Count, 2),
                    results = results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting quiz");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to submit quiz",
                    error = ex.Message
                });
            }
        }



        [HttpGet("history")]
        [Authorize]
        public async Task<IActionResult> GetHistory()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("userId")?.Value);

                var history = await _context.QuizResults
                    .Where(qr => qr.UserId == userId)
                    .OrderByDescending(qr => qr.CompletedAt)
                    .Select(qr => new
                    {
                        qr.Id,
                        qr.QuizType,
                        qr.Score,
                        qr.TotalQuestions,
                        Percentage = Math.Round((qr.Score * 100.0) / qr.TotalQuestions, 2),
                        qr.CompletedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, history });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quiz history");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("result/{resultId}")]
        [Authorize]
        public async Task<IActionResult> GetQuizResultDetails(int resultId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("userId")?.Value);

                var quizResult = await _context.QuizResults
                    .Where(qr => qr.Id == resultId && qr.UserId == userId)
                    .FirstOrDefaultAsync();

                if (quizResult == null)
                    return NotFound(new { success = false, message = "Quiz result not found" });

                var details = await _context.QuizResultDetails
                    .Where(qrd => qrd.QuizResultId == resultId)
                    .ToListAsync();

                var detailedResults = new List<object>();

                foreach (var detail in details)
                {
                    // Try to load options from OptionsJson first
                    object options = null;

                    if (!string.IsNullOrEmpty(detail.OptionsJson))
                    {
                        try
                        {
                            var optionsDict = JsonSerializer.Deserialize<Dictionary<string, string>>(detail.OptionsJson);
                            options = new
                            {
                                A = optionsDict.ContainsKey("A") ? optionsDict["A"] : "",
                                B = optionsDict.ContainsKey("B") ? optionsDict["B"] : "",
                                C = optionsDict.ContainsKey("C") ? optionsDict["C"] : "",
                                D = optionsDict.ContainsKey("D") ? optionsDict["D"] : ""
                            };
                        }
                        catch
                        {
                            // If JSON parsing fails, options will remain null
                            options = null;
                        }
                    }

                    // If OptionsJson is empty or failed to parse, just return empty options
                    if (options == null)
                    {
                        options = new
                        {
                            A = "",
                            B = "",
                            C = "",
                            D = ""
                        };
                    }


                    // Get the options object for letter lookup
                    var optionsObj = options.GetType().GetProperty("A") != null
                        ? new
                        {
                            A = options.GetType().GetProperty("A")?.GetValue(options)?.ToString() ?? "",
                            B = options.GetType().GetProperty("B")?.GetValue(options)?.ToString() ?? "",
                            C = options.GetType().GetProperty("C")?.GetValue(options)?.ToString() ?? "",
                            D = options.GetType().GetProperty("D")?.GetValue(options)?.ToString() ?? ""
                        }
                        : new { A = "", B = "", C = "", D = "" };

                    // Get user answer letter
                    string userAnswerLetter = detail.UserAnswerLetter ?? "?";
                    string correctAnswerLetter = detail.CorrectAnswerLetter ?? "?";

                    // If letters are not stored, try to derive them from the options
                    if (userAnswerLetter == "?" && !string.IsNullOrEmpty(detail.UserAnswer))
                    {
                        var tempQuestion = new
                        {
                            OptionA = optionsObj.A,
                            OptionB = optionsObj.B,
                            OptionC = optionsObj.C,
                            OptionD = optionsObj.D
                        };
                        userAnswerLetter = GetOptionLetter(tempQuestion, detail.UserAnswer);
                    }

                    // Determine correct answer text
                    string correctAnswerText = detail.CorrectAnswer;

                    // If correct answer is just a letter, convert to text
                    if (detail.CorrectAnswer?.Length == 1 && "ABCD".Contains(detail.CorrectAnswer.ToUpper()))
                    {
                        correctAnswerText = detail.CorrectAnswer.ToUpper() switch
                        {
                            "A" => optionsObj.A,
                            "B" => optionsObj.B,
                            "C" => optionsObj.C,
                            "D" => optionsObj.D,
                            _ => detail.CorrectAnswer
                        };
                    }

                    if (correctAnswerLetter == "?" && !string.IsNullOrEmpty(correctAnswerText))
                    {
                        var tempQuestion = new
                        {
                            OptionA = optionsObj.A,
                            OptionB = optionsObj.B,
                            OptionC = optionsObj.C,
                            OptionD = optionsObj.D
                        };
                        correctAnswerLetter = GetOptionLetter(tempQuestion, correctAnswerText);
                    }

                    detailedResults.Add(new
                    {
                        detail.QuestionId,
                        detail.QuestionText,
                        detail.ImageUrl,
                        userAnswer = detail.UserAnswer,
                        correctAnswer = correctAnswerText,
                        userAnswerLetter = userAnswerLetter,
                        correctAnswerLetter = correctAnswerLetter,
                        detail.IsCorrect,
                        options = options
                    });
                }

                return Ok(new
                {
                    success = true,
                    quizResult = new
                    {
                        quizResult.QuizType,
                        quizResult.Score,
                        quizResult.TotalQuestions,
                        Percentage = Math.Round((quizResult.Score * 100.0) / quizResult.TotalQuestions, 2),
                        quizResult.CompletedAt
                    },
                    details = detailedResults
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quiz result details");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        [HttpPost]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { success = false, message = "Quiz data is required" });

                // Get userId from JWT token
                var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized(new { success = false, message = "User not found in token" });

                var userId = int.Parse(userIdClaim.Value);

                // Create Quiz with Questions
                var quiz = new Quiz
                {
                    Title = request.Title,
                    Description = request.Description,
                    Category = request.Category,
                    Difficulty = request.Difficulty,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Questions = request.Questions.Select((q, index) => new QuizQuestion
                    {
                        QuestionText = q.QuestionText,
                        ImageUrl = q.ImageUrl,
                        OptionA = q.OptionA,
                        OptionB = q.OptionB,
                        OptionC = q.OptionC,
                        OptionD = q.OptionD,
                        CorrectAnswer = q.CorrectAnswer,
                        OrderIndex = index,
                        CreatedAt = DateTime.UtcNow
                    }).ToList()
                };

                _context.Quizzes.Add(quiz);
                await _context.SaveChangesAsync();

                _context.ActivityLogs.Add(new ActivityLog
                {
                    UserId = userId,
                    ActionType = "QUIZ_CREATED",
                    Title = "New quiz created",
                    Description = $"\"{quiz.Title}\" ({quiz.Category})"
                });
                await _context.SaveChangesAsync();


                return Ok(new
                {
                    success = true,
                    message = "Quiz created successfully",
                    quizId = quiz.Id,
                    questionCount = quiz.Questions.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating quiz");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("admin/all")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> GetAllQuizzes()
        {
            try
            {
                var quizzes = await _context.Quizzes
                    .Include(q => q.Questions)
                    .Select(q => new
                    {
                        q.Id,
                        q.Title,
                        q.Description,
                        q.Category,
                        q.Difficulty,
                        Questions = q.Questions.Count,
                        q.CreatedAt,
                        q.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, quizzes = quizzes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all quizzes");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("admin/{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> GetQuiz(int id)
        {
            try
            {
                var quiz = await _context.Quizzes
                    .Include(q => q.Questions)
                    .Where(q => q.Id == id)
                    .Select(q => new
                    {
                        q.Id,
                        q.Title,
                        q.Description,
                        q.Category,
                        q.Difficulty,
                        Questions = q.Questions,
                        q.CreatedAt,
                        q.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (quiz == null)
                    return NotFound(new { success = false, message = "Quiz not found" });

                return Ok(new { success = true, quiz = quiz });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quiz");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        [HttpPut("admin/{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> UpdateQuiz(int id, [FromBody] UpdateQuizRequest request)
        {
            try
            {
                // ⭐ Include Questions in the query
                var quiz = await _context.Quizzes
                    .Include(q => q.Questions)
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quiz == null)
                    return NotFound(new { success = false, message = "Quiz not found" });

                // Update quiz basic info
                quiz.Title = request.Title;
                quiz.Description = request.Description;
                quiz.Category = request.Category;
                quiz.Difficulty = request.Difficulty;
                quiz.UpdatedAt = DateTime.UtcNow;

                // ⭐ Update Questions (remove old, add/update new)
                if (request.Questions != null && request.Questions.Any())
                {
                    // Remove all existing questions
                    _context.QuizQuestions.RemoveRange(quiz.Questions);

                    // Add updated questions
                    quiz.Questions = request.Questions.Select((q, index) => new QuizQuestion
                    {
                        QuestionText = q.QuestionText,
                        ImageUrl = q.ImageUrl,
                        OptionA = q.OptionA,
                        OptionB = q.OptionB,
                        OptionC = q.OptionC,
                        OptionD = q.OptionD,
                        CorrectAnswer = q.CorrectAnswer,
                        OrderIndex = index,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Quiz updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quiz");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        [HttpDelete("admin/{id}")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            try
            {
                var quiz = await _context.Quizzes.FindAsync(id);
                if (quiz == null)
                    return NotFound(new { success = false, message = "Quiz not found" });

                _context.Quizzes.Remove(quiz);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Quiz deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting quiz");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("upload-image")]
        [Authorize(Policy = "Admin")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "No file uploaded" });

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(file.FileName).ToLower();

                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest(new { success = false, message = "Invalid file type. Only images allowed." });

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

                // Create uploads directory if it doesn't exist
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "quiz-images");
                if (!Directory.Exists(uploadsPath))
                    Directory.CreateDirectory(uploadsPath);

                // Save file
                var filePath = Path.Combine(uploadsPath, uniqueFileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return the URL path
                var imageUrl = $"/uploads/quiz-images/{uniqueFileName}";

                return Ok(new
                {
                    success = true,
                    imageUrl = imageUrl,
                    message = "Image uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


        //get admin created quiz
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllPublicQuizzes()
        {
            try
            {
                var quizzes = await _context.Quizzes
                    .Include(q => q.Questions)
                    .Select(q => new
                    {
                        q.Id,
                        q.Title,
                        q.Description,
                        q.Category,
                        q.Difficulty,
                        q.ImageUrl,
                        QuestionCount = q.Questions.Count,
                        q.CreatedAt,
                        q.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, quizzes });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public quizzes");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }



        private string GetOptionLetter(dynamic question, string userAnswer)
        {
            if (userAnswer?.Trim().ToLower() == question.OptionA?.Trim().ToLower()) return "A";
            if (userAnswer?.Trim().ToLower() == question.OptionB?.Trim().ToLower()) return "B";
            if (userAnswer?.Trim().ToLower() == question.OptionC?.Trim().ToLower()) return "C";
            if (userAnswer?.Trim().ToLower() == question.OptionD?.Trim().ToLower()) return "D";
            return "?";
        }

    }

    public class CreateQuizRequest
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public string Difficulty { get; set; }
        public List<CreateQuizQuestionRequest> Questions { get; set; }
    }

    public class CreateQuizQuestionRequest
    {
        public string QuestionText { get; set; }
        public string? ImageUrl { get; set; }
        public string OptionA { get; set; }
        public string OptionB { get; set; }
        public string OptionC { get; set; }
        public string OptionD { get; set; }
        public string CorrectAnswer { get; set; }
    }

    public class UpdateQuizRequest
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public string Difficulty { get; set; }
        public List<UpdateQuizQuestionRequest> Questions { get; set; }
    }

    public class UpdateQuizQuestionRequest
    {
        public string QuestionText { get; set; }
        public string? ImageUrl { get; set; }
        public string OptionA { get; set; }
        public string OptionB { get; set; }
        public string OptionC { get; set; }
        public string OptionD { get; set; }
        public string CorrectAnswer { get; set; }
    }

}
