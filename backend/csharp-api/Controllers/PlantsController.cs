using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Data;
using PlantSystem.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlantsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<PlantsController> _logger;
        private readonly IWebHostEnvironment _env;

        public PlantsController(
            AppDbContext context,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            ILogger<PlantsController> logger,
            IWebHostEnvironment env)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetPlants()
        {
            try
            {
                var plants = await _context.Plants.ToListAsync();
                return Ok(new { success = true, plants });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlant(int id)
        {
            try
            {
                var plant = await _context.Plants.FindAsync(id);
                if (plant == null)
                    return NotFound(new { success = false, message = "Plant not found" });

                return Ok(new { success = true, plant });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.Plants
                    .GroupBy(p => p.Category)
                    .Select(g => new {
                        Category = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                return Ok(new { success = true, categories });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ===== AI RECOGNITION ENDPOINT =====

        [HttpPost("recognize")]
        [Authorize]
        public async Task<IActionResult> RecognizePlant([FromForm] IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { success = false, message = "No image provided" });

            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
            if (!allowedTypes.Contains(image.ContentType.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid file type. Only JPEG and PNG images are allowed."
                });
            }

            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "File too large. Maximum size is 10MB."
                });
            }

            try
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "scans");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(fileStream);
                }

                var uploadedImagePath = $"/images/scans/{uniqueFileName}";

                var pythonApiUrl = _configuration["PythonAPI:BaseUrl"] ?? "http://localhost:5000";

                _logger.LogInformation($"Sending image to Python API: {pythonApiUrl}");

                var client = _httpClientFactory.CreateClient();
                using var content = new MultipartFormDataContent();
                using var stream = image.OpenReadStream();
                using var streamContent = new StreamContent(stream);

                streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(image.ContentType);
                content.Add(streamContent, "image", image.FileName);

                var response = await client.PostAsync($"{pythonApiUrl}/api/recognize-plant", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorText = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Python API non-success status: {response.StatusCode}, body: {errorText}");
                    return Ok(new
                    {
                        success = false,
                        message = "No plant detected in the image. Please try another photo."
                    });
                }

                var result = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Successfully received prediction from Python API");

                var pythonResult = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(result);

                return Ok(new
                {
                    // Forward the original structure
                    success = pythonResult.TryGetProperty("success", out var successProp)
                ? successProp.GetBoolean()
                : true,
                    prediction = pythonResult.TryGetProperty("prediction", out var predProp)
                ? predProp
                : pythonResult,
                    // ⭐ New: path of the uploaded user photo
                    uploadedImagePath = uploadedImagePath
                });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Python API");
                return StatusCode(503, new
                {
                    success = false,
                    message = "AI service is unavailable. Please ensure the Python API is running."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during plant recognition");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred during plant recognition.",
                    error = ex.Message
                });
            }
        }


        [HttpPost("detect-disease")]
        [Authorize]
        public async Task<IActionResult> DetectDisease([FromForm] IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { success = false, message = "No image provided" });

            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
            if (!allowedTypes.Contains(image.ContentType.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid file type. Only JPEG and PNG images are allowed."
                });
            }

            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "File too large. Maximum size is 10MB."
                });
            }

            try
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "disease-scans");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(fileStream);
                }

                // Web path to use in frontend/scan history
                var uploadedImagePath = $"/images/disease-scans/{uniqueFileName}";

                var pythonApiUrl = _configuration["PythonAPI:BaseUrl"] ?? "http://localhost:5000";
                _logger.LogInformation($"Sending image to Python API for disease detection: {pythonApiUrl}");

                var client = _httpClientFactory.CreateClient();
                using var content = new MultipartFormDataContent();
                using var stream = image.OpenReadStream();
                using var streamContent = new StreamContent(stream);

                streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(image.ContentType);
                content.Add(streamContent, "image", image.FileName);

                // ⭐ CALL THE CORRECT ENDPOINT: /api/predict-disease
                var response = await client.PostAsync($"{pythonApiUrl}/api/predict-disease", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorText = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Python API non-success status: {response.StatusCode}, body: {errorText}");
                    return Ok(new
                    {
                        success = false,
                        message = "No plant detected in the image. Please try another photo."
                    });
                }

                // ⭐ IMPORTANT: Read as string first to see the actual response
                var resultString = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Disease detection raw response: {resultString}");

                var pythonResult = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(resultString);

                return Ok(new
                {
                    success = pythonResult.TryGetProperty("success", out var successProp)
                         ? successProp.GetBoolean()
                         : true,
                    prediction = pythonResult.TryGetProperty("prediction", out var predProp)
                         ? predProp
                         : pythonResult,
                    uploadedImagePath = uploadedImagePath
                });

            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Python API");
                return StatusCode(503, new
                {
                    success = false,
                    message = "AI service is unavailable. Please ensure the Python API is running."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during disease detection");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred during disease detection.",
                    error = ex.Message
                });
            }
        }


        [HttpGet("info")]
        public async Task<IActionResult> GetPlantInfo([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { success = false, message = "Plant name required." });

            try
            {
                // Clean the name - remove extra spaces and make consistent
                var cleanName = name.Trim().ToLower();

                _logger.LogInformation($"Searching for plant: {cleanName}");

                // Try exact match first
                var plant = await _context.Plants
                    .FirstOrDefaultAsync(p => p.Name.ToLower() == cleanName);

                // If no exact match, try partial match
                if (plant == null)
                {
                    plant = await _context.Plants
                        .FirstOrDefaultAsync(p => p.Name.ToLower().Contains(cleanName));
                }

                // If still no match, try common names field
                if (plant == null)
                {
                    plant = await _context.Plants
                        .FirstOrDefaultAsync(p => p.CommonNames != null &&
                                                 p.CommonNames.ToLower().Contains(cleanName));
                }

                if (plant == null)
                {
                    _logger.LogWarning($"Plant '{cleanName}' not found in database");
                    return Ok(new
                    {
                        success = false,
                        message = $"Plant '{name}' not found in database.",
                        searchedName = cleanName
                    });
                }

                _logger.LogInformation($"Found plant: {plant.Name}");
                return Ok(new { success = true, data = plant });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching plant info for {PlantName}", name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Database error occurred.",
                    error = ex.Message
                });
            }
        }


        [HttpGet("disease-info")]
        public async Task<IActionResult> GetDiseaseInfo([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { success = false, message = "Disease name required." });

            try
            {
                var cleanName = name.Trim().ToLower();

                // create a version with spaces instead of underscores
                var normalizedName = cleanName.Replace("_", " ").Replace("-", " ");
                var searchNames = new List<string> { cleanName, normalizedName };

                _logger.LogInformation($"Searching for disease: '{cleanName}' (normalized: '{normalizedName}')");

                // Try exact match first with both original and normalized names
                var disease = await _context.Diseases
                    .FirstOrDefaultAsync(d =>
                        d.Name.ToLower() == cleanName ||
                        d.Name.ToLower() == normalizedName ||
                        d.Name.ToLower().Replace(" ", "_") == cleanName);

                // If no exact match, try partial match with multiple strategies
                if (disease == null)
                {
                    disease = await _context.Diseases
                        .FirstOrDefaultAsync(d =>
                            d.Name.ToLower().Contains(cleanName) ||
                            d.Name.ToLower().Contains(normalizedName) ||
                            d.Name.ToLower().Replace(" ", "_").Contains(cleanName) ||
                            d.Name.ToLower().Replace(" ", "-").Contains(cleanName));
                }

                // If still no match, try common names with normalization
                if (disease == null)
                {
                    disease = await _context.Diseases
                        .FirstOrDefaultAsync(d => d.CommonNames != null &&
                            (d.CommonNames.ToLower().Contains(cleanName) ||
                             d.CommonNames.ToLower().Contains(normalizedName) ||
                             d.CommonNames.ToLower().Replace(" ", "_").Contains(cleanName)));
                }

                // If still no match, try pathogen name
                if (disease == null)
                {
                    disease = await _context.Diseases
                        .FirstOrDefaultAsync(d => d.PathogenName != null &&
                            (d.PathogenName.ToLower().Contains(cleanName) ||
                             d.PathogenName.ToLower().Contains(normalizedName)));
                }

                if (disease == null)
                {
                    _logger.LogWarning($"Disease '{cleanName}' (normalized: '{normalizedName}') not found in database");
                    return Ok(new
                    {
                        success = false,
                        message = $"Disease '{name}' not found in database.",
                        searchedName = cleanName,
                        normalizedName = normalizedName
                    });
                }

                _logger.LogInformation($"Found disease: {disease.Name} (searched for: '{cleanName}')");
                return Ok(new { success = true, data = disease });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching disease info for {DiseaseName}", name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Database error occurred.",
                    error = ex.Message
                });
            }
        }


    }
}
