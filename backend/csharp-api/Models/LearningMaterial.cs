namespace PlantSystem.API.Models
{
    public class LearningMaterial
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public string Difficulty { get; set; } 
        public string? Content { get; set; } 
        public string? ImageUrl { get; set; }
        public string? PdfUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
