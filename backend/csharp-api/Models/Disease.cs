namespace PlantSystem.API.Models
{
    public class Disease
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string CommonNames { get; set; }
        public string Category { get; set; }
        public string PathogenName { get; set; }
        public string Class { get; set; }
        public string Species { get; set; }
        public string Genus { get; set; }
        public string Characteristics { get; set; }
        public string Symptoms { get; set; }
        public string Treatment { get; set; }
        public string Prevention { get; set; }
        public string Severity { get; set; }
        public string AffectedPlants { get; set; }
        public string GrowthConditions { get; set; }
        public string ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}