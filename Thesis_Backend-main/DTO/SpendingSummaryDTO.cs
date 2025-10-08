namespace Thesis_backend.DTO;

public class SpendingSummaryDTO
{
    public ICollection<DocumentSpendingSummaryDTO> Documents { get; set; } = new List<DocumentSpendingSummaryDTO>();
    public ICollection<SpendingCategorySpendingSummaryDTO> SpendingCategories { get; set; } = new List<SpendingCategorySpendingSummaryDTO>();
}