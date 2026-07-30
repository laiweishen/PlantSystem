namespace PlantSystem.API.Models
{
    public class ActivityLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }       
        public string ActionType { get; set; } 
        public string Title { get; set; }      
        public string Description { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}