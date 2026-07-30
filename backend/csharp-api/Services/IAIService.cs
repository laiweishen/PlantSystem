using Microsoft.AspNetCore.Http;

namespace PlantSystem.API.Services
{
    public interface IAIService
    {
        Task<PlantSpeciesResult> ClassifyPlantSpeciesAsync(IFormFile imageFile);
        Task<PlantDiseaseResult> DetectPlantDiseaseAsync(IFormFile imageFile);
    }

    // Response models
    public class PlantSpeciesResult
    {
        public bool Success { get; set; }
        public PlantSpeciesData? Data { get; set; }
        public string? Error { get; set; }
    }

    public class PlantSpeciesData
    {
        public string Species { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public Dictionary<string, double>? AllPredictions { get; set; }
    }

    public class PlantDiseaseResult
    {
        public bool Success { get; set; }
        public PlantDiseaseData? Data { get; set; }
        public string? Error { get; set; }
    }

    public class PlantDiseaseData
    {
        public string Disease { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public bool IsHealthy { get; set; }
    }
}
