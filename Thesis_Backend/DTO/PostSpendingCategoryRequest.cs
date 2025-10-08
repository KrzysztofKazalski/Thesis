using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Thesis_backend.DTO;

public class PostSpendingCategoryRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(30, MinimumLength = 4, ErrorMessage = "Category name must be between 4 and 30 characters")]
    [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Category name can only contain letters and spaces")]
    public string Name { get; set; }
    
    [Required(ErrorMessage = "UserId is required")]
    public int UserId { get; set; }
}