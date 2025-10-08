using System.ComponentModel.DataAnnotations;

namespace Thesis_backend.Models
{
    public class Document
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Timestamp is required.")]
        public DateTime Timestamp { get; set; }

        [Required(ErrorMessage = "Name is required.")]
        [StringLength(30, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 30 characters.")]
        [RegularExpression(@".*[a-zA-Z\s]+.*", ErrorMessage = "Name cannot contain only numbers or special characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1024, ErrorMessage = "Description cannot exceed 1024 characters.")]
        public string Description { get; set; } = string.Empty;

        public string ImageLink { get; set; } = string.Empty;

        public string ImageContent { get; set; } = string.Empty;

        [Required(ErrorMessage = "AmountSpent is required.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public double AmountSpent { get; set; }
        
        [RegularExpression(@".*[a-zA-Z\s]+.*", ErrorMessage = "Company name cannot contain only numbers or special characters.")]
        public string Company { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "HasWarranty is required")]
        public bool HasWarranty { get; set; }

        // Optional fields for warranty
        public int? WarrantyDuration { get; set; }
        
        /**
         * We have a reference to both the User class and UserId
         * The User class is added for easy navigation
         * The UserId integer is added for lightweight operations and mentioned in the AppDbContext foreign key
         */
        public User User { get; set; }
        
        public ICollection<SpendingCategory> SpendingCategories { get; set; } = new List<SpendingCategory>();
        
        [Required(ErrorMessage = "UserId is required.")]
        public int UserId { get; set; }
    }
}