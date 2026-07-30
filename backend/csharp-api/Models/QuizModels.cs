namespace PlantSystem.API.Models
{
    public class QuizResult
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string QuizType { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public DateTime CompletedAt { get; set; }
    }

    public class QuizSubmission
    {
        public string QuizType { get; set; }
        public List<QuizAnswer> Answers { get; set; }
    }

    public class QuizAnswer
    {
        public int QuestionId { get; set; }
        public string? UserAnswer { get; set; }
        public string? UserAnswerLetter { get; set; }
        public string? CorrectAnswer { get; set; }
        public string? CorrectAnswerLetter { get; set; }
        public string? QuestionText { get; set; }
        public string? ImageUrl { get; set; }
        public object? Options { get; set; }
    }

    public class QuizResultDetail
    {
        public int Id { get; set; }
        public int QuizResultId { get; set; }
        public int QuestionId { get; set; }
        public string QuestionText { get; set; }
        public string? ImageUrl { get; set; }
        public string? UserAnswer { get; set; }
        public string? CorrectAnswer { get; set; }
        public bool IsCorrect { get; set; }
        public string? UserAnswerLetter { get; set; }
        public string? CorrectAnswerLetter { get; set; }
        public string OptionsJson { get; set; }

        // Navigation property
        public QuizResult QuizResult { get; set; }
    }

    public class Quiz
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; } 
        public string Difficulty { get; set; } //
        public int CreatedBy { get; set; }
        public string ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public User Creator { get; set; }
        public ICollection<QuizQuestion> Questions { get; set; }
    }

    public class QuizQuestion
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public string QuestionText { get; set; }
        public string? ImageUrl { get; set; }
        public string OptionA { get; set; }
        public string OptionB { get; set; }
        public string OptionC { get; set; }
        public string OptionD { get; set; }
        public string CorrectAnswer { get; set; } // "A", "B", "C", "D"
        public int OrderIndex { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Quiz Quiz { get; set; }
    }


}