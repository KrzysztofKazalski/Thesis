using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Thesis_backend.Models;

public class SpendingCategory
{
    public int Id { get; set; }
    
    [Required(ErrorMessage = "Name is required")]
    [StringLength(30, MinimumLength = 4, ErrorMessage = "Name must be between 4 and 30 characters")]
    [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Category name can only contain letters and spaces")]
    public string Name { get; set; }
    
    //TODO potentially add icons?? Icons could be based on the icons in react, idk
    
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    
    public User User { get; set; }
    
    public int UserId { get; set; }
}