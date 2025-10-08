namespace Thesis_backend.DTO;

public class DocumentSpendingSummaryDTO
{
    public DateTime Timestamp { get; set; }
    public double AmountSpent { get; set; }
    public ICollection<SpendingCategorySpendingSummaryDTO> SpendingCategories { get; set; } = new List<SpendingCategorySpendingSummaryDTO>();
}