using System.ComponentModel.DataAnnotations;

namespace Thesis_backend.DTO;

public class DocumentUpdateRequest
{
    [Required(ErrorMessage = "Timestamp is required")]
    public string TimeStamp { get; set; }
    
    [Required(ErrorMessage = "Name is required")]
    [StringLength(30, MinimumLength = 2, ErrorMessage = "Document name must be between 2 and 30 characters")]
    [RegularExpression(@".*[a-zA-Z\s]+.*", ErrorMessage = "Document name cannot contain only numbers or special characters")]
    public string Name { get; set; }
    
    public string Description { get; set; }
    
    public string ImageContent { get; set; }
    public string ImageLink { get; set; }
    
    [Required(ErrorMessage = "AmountSpent is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero")]
    public double AmountSpent { get; set; }
    
    [RegularExpression(@".*[a-zA-Z\s]+.*", ErrorMessage = "Company name cannot contain only numbers or special characters")]
    public string Company { get; set; }
    
    [Required(ErrorMessage = "HasWarranty is required")]
    public bool HasWarranty { get; set; }
    
    public int? WarrantyDuration { get; set; }
    
    public List<int> SpendingCategoryIds { get; set; } = new List<int>();
}