using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Thesis_backend.DTO;

public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    public string Username { get; set; }
    
    [Required(ErrorMessage = "Password is required")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,64}$", 
        ErrorMessage = "Password must be 8-64 characters, with at least 1 capital letter, 1 small letter, and 1 number")]
    public string Password { get; set; }
    
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }
}