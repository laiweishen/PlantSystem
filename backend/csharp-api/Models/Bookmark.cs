using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlantSystem.API.Models
{
    public class Bookmark
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        [StringLength(50)]
        public string ItemType { get; set; }
        public int ItemId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User User { get; set; }
    }

    public class BookmarkRequest
    {
        public string ItemType { get; set; }
        public int ItemId { get; set; }
    }

    public class BookmarkDto
    {
        public int Id { get; set; }
        public string ItemType { get; set; }
        public int ItemId { get; set; }
        public string Name { get; set; }
        public string ScientificName { get; set; }
        public string ImageUrl { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}