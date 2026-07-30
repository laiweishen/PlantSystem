using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Data;
using PlantSystem.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace PlantSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AutoQuizController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Random _rng = new Random();

        public AutoQuizController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("plant")]
        public async Task<IActionResult> GeneratePlantQuiz([FromQuery] int count = 10)
        {
            var plants = await _context.Plants
                .Where(p => !string.IsNullOrEmpty(p.ImageUrl))
                .ToListAsync();

            if (plants.Count < 4)
            {
                return Ok(new { success = false, message = "Need at least 4 plants with images." });
            }

            if (count > plants.Count) count = plants.Count;

            var selectedPlants = plants.OrderBy(p => _rng.Next()).Take(count).ToList();
            var questions = new List<object>();
            int id = 1;

            foreach (var plant in selectedPlants)
            {
                var wrongOptions = plants
                    .Where(p => p.Id != plant.Id)
                    .OrderBy(p => _rng.Next())
                    .Take(3)
                    .Select(p => p.Name)
                    .ToList();

                var allOptions = new List<string> { plant.Name };
                allOptions.AddRange(wrongOptions);
                allOptions = allOptions.OrderBy(o => _rng.Next()).ToList();

                char correctLetter = (char)('A' + allOptions.IndexOf(plant.Name));

                questions.Add(new
                {
                    id = id++,
                    questionText = "What plant is shown in this image?",
                    imageUrl = plant.ImageUrl,
                    optionA = allOptions[0],
                    optionB = allOptions[1],
                    optionC = allOptions[2],
                    optionD = allOptions[3],
                    correctAnswer = correctLetter.ToString()
                });
            }

            return Ok(new { success = true, total = questions.Count, questions });
        }

        [HttpGet("disease")]
        public async Task<IActionResult> GenerateDiseaseQuiz([FromQuery] int count = 10)
        {
            var diseases = await _context.Diseases
                .Where(d => !string.IsNullOrEmpty(d.ImageUrl))
                .ToListAsync();

            if (diseases.Count < 4)
            {
                return Ok(new { success = false, message = "Need at least 4 diseases with images." });
            }

            if (count > diseases.Count) count = diseases.Count;

            var selectedDiseases = diseases.OrderBy(d => _rng.Next()).Take(count).ToList();
            var questions = new List<object>();
            int id = 1;

            foreach (var disease in selectedDiseases)
            {
                var wrongOptions = diseases
                    .Where(d => d.Id != disease.Id)
                    .OrderBy(d => _rng.Next())
                    .Take(3)
                    .Select(d => d.Name)
                    .ToList();

                var allOptions = new List<string> { disease.Name };
                allOptions.AddRange(wrongOptions);
                allOptions = allOptions.OrderBy(o => _rng.Next()).ToList();

                char correctLetter = (char)('A' + allOptions.IndexOf(disease.Name));

                questions.Add(new
                {
                    id = id++,
                    questionText = "What disease is shown in this image?",
                    imageUrl = disease.ImageUrl,
                    optionA = allOptions[0],
                    optionB = allOptions[1],
                    optionC = allOptions[2],
                    optionD = allOptions[3],
                    correctAnswer = correctLetter.ToString()
                });
            }

            return Ok(new { success = true, total = questions.Count, questions });
        }

        [HttpGet("mixed")]
        public async Task<IActionResult> GenerateMixedQuiz([FromQuery] int count = 10)
        {
            var plants = await _context.Plants
                .Where(p => !string.IsNullOrEmpty(p.ImageUrl))
                .ToListAsync();
            var diseases = await _context.Diseases
                .Where(d => !string.IsNullOrEmpty(d.ImageUrl))
                .ToListAsync();

            if (plants.Count + diseases.Count < 4)
            {
                return Ok(new { success = false, message = "Need at least 4 total items with images." });
            }

            if (count > plants.Count + diseases.Count)
                count = plants.Count + diseases.Count;

            // target roughly half plant, half disease
            int plantCount = Math.Min(count / 2, plants.Count);
            int diseaseCount = Math.Min(count - plantCount, diseases.Count);

            var questions = new List<object>();
            int id = 1;

            // plant questions
            if (plantCount >= 1 && plants.Count >= 4)
            {
                var selectedPlants = plants.OrderBy(p => _rng.Next()).Take(plantCount).ToList();

                foreach (var plant in selectedPlants)
                {
                    var wrongOptions = plants
                        .Where(p => p.Id != plant.Id)
                        .OrderBy(p => _rng.Next())
                        .Take(3)
                        .Select(p => p.Name)
                        .ToList();

                    var allOptions = new List<string> { plant.Name };
                    allOptions.AddRange(wrongOptions);
                    allOptions = allOptions.OrderBy(o => _rng.Next()).ToList();

                    char correctLetter = (char)('A' + allOptions.IndexOf(plant.Name));

                    questions.Add(new
                    {
                        id = id++,
                        questionText = "What plant is shown in this image?",
                        imageUrl = plant.ImageUrl,
                        optionA = allOptions[0],
                        optionB = allOptions[1],
                        optionC = allOptions[2],
                        optionD = allOptions[3],
                        correctAnswer = correctLetter.ToString()
                    });
                }
            }

            // disease questions
            if (diseaseCount >= 1 && diseases.Count >= 4)
            {
                var selectedDiseases = diseases.OrderBy(d => _rng.Next()).Take(diseaseCount).ToList();

                foreach (var disease in selectedDiseases)
                {
                    var wrongOptions = diseases
                        .Where(d => d.Id != disease.Id)
                        .OrderBy(d => _rng.Next())
                        .Take(3)
                        .Select(d => d.Name)
                        .ToList();

                    var allOptions = new List<string> { disease.Name };
                    allOptions.AddRange(wrongOptions);
                    allOptions = allOptions.OrderBy(o => _rng.Next()).ToList();

                    char correctLetter = (char)('A' + allOptions.IndexOf(disease.Name));

                    questions.Add(new
                    {
                        id = id++,
                        questionText = "What disease is shown in this image?",
                        imageUrl = disease.ImageUrl,
                        optionA = allOptions[0],
                        optionB = allOptions[1],
                        optionC = allOptions[2],
                        optionD = allOptions[3],
                        correctAnswer = correctLetter.ToString()
                    });
                }
            }

            // Shuffle final mix
            questions = questions.OrderBy(q => _rng.Next()).ToList();

            return Ok(new { success = true, total = questions.Count, questions });
        }

    }
}
