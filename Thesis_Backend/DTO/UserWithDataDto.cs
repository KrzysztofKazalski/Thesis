namespace Thesis_backend.DTO;

public class UserWithDataDto
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string Username { get; set; }
    public ICollection<DocumentWithCategoriesDto> Documents { get; set; } = new List<DocumentWithCategoriesDto>();
    public ICollection<SpendingCategoryDto> SpendingCategories { get; set; } = new List<SpendingCategoryDto>();
} 