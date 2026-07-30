namespace PlantSystem.API.Models
{
    public class Plant
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public string ScientificName { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public string Habitat { get; set; }
        public string CommonNames { get; set; }
        public string Height { get; set; }
        public string BloomTime { get; set; }
        public string FlowerColor { get; set; }
        public string Fragrance { get; set; }
        public string Thorns { get; set; }
        public string Family { get; set; }
        public string Class { get; set; }
        public string Species { get; set; }
        public string Genus { get; set; }
        public string CareTips { get; set; }
        public string CommonUse { get; set; }
        public string GrowthConditions { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}