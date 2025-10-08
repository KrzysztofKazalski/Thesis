using System.ComponentModel.DataAnnotations;

namespace Thesis_backend.Models;

public class User
{
    public int Id { get; set; }
    
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }
    
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    public string Username { get; set; }
    
    [Required(ErrorMessage = "PasswordHash is required")]
    public string PasswordHash { get; set; }

    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<SpendingCategory> SpendingCategories { get; set; } = new List<SpendingCategory>();
}