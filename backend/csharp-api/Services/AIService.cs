using System.Net.Http.Headers;

namespace PlantSystem.API.Services
{
    public class AIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AIService> _logger;

        public AIService(HttpClient httpClient, ILogger<AIService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<PlantSpeciesResult> ClassifyPlantSpeciesAsync(IFormFile imageFile)
        {
            try
            {
                using var content = new MultipartFormDataContent();
                using var fileStream = imageFile.OpenReadStream();
                using var streamContent = new StreamContent(fileStream);

                streamContent.Headers.ContentType = new MediaTypeHeaderValue(imageFile.ContentType);
                content.Add(streamContent, "file", imageFile.FileName);

                var response = await _httpClient.PostAsync("species/classify", content);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<PlantSpeciesResult>();
                    return result ?? new PlantSpeciesResult { Success = false, Error = "Empty response" };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"AI API Error: {response.StatusCode} - {errorContent}");
                    return new PlantSpeciesResult
                    {
                        Success = false,
                        Error = $"AI service error: {response.StatusCode}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling AI service for plant classification");
                return new PlantSpeciesResult
                {
                    Success = false,
                    Error = $"Error: {ex.Message}"
                };
            }
        }

        public async Task<PlantDiseaseResult> DetectPlantDiseaseAsync(IFormFile imageFile)
        {
            try
            {
                using var content = new MultipartFormDataContent();
                using var fileStream = imageFile.OpenReadStream();
                using var streamContent = new StreamContent(fileStream);

                streamContent.Headers.ContentType = new MediaTypeHeaderValue(imageFile.ContentType);
                content.Add(streamContent, "file", imageFile.FileName);

                var response = await _httpClient.PostAsync("disease/detect", content);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<PlantDiseaseResult>();
                    return result ?? new PlantDiseaseResult { Success = false, Error = "Empty response" };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"AI API Error: {response.StatusCode} - {errorContent}");
                    return new PlantDiseaseResult
                    {
                        Success = false,
                        Error = $"AI service error: {response.StatusCode}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling AI service for disease detection");
                return new PlantDiseaseResult
                {
                    Success = false,
                    Error = $"Error: {ex.Message}"
                };
            }
        }
    }
}
