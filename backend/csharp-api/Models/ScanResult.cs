public class ScanResult
{
    public int Id { get; set; }
    public int UserId { get; set; }

    // "plant" or "disease"
    public string ScanType { get; set; }

    public string ImageFileName { get; set; }
    public string PredictedName { get; set; }
    public double Confidence { get; set; }
    public bool? IsHealthy { get; set; }
    public string ImageUrl { get; set; }

    public int? PlantId { get; set; }    // for plant scans
    public int? DiseaseId { get; set; }  // for disease scans

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
