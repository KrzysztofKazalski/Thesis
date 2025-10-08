namespace Thesis_backend.DTO;

public class DocumentWithCategoriesDto
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string ImageLink { get; set; }
    public string ImageContent { get; set; }
    public double AmountSpent { get; set; }
    public string Company { get; set; }
    public bool HasWarranty { get; set; }
    public int? WarrantyDuration { get; set; }
    public int UserId { get; set; }
    public ICollection<SpendingCategoryDto> SpendingCategories { get; set; } = new List<SpendingCategoryDto>();
} 