using Thesis_backend.DTO;
using Thesis_backend.Models;

namespace Thesis_backend.Services.Interfaces;

public interface ISpendingCategoriesService
{
    public Task<SpendingCategory> CreateNewSpendingCategory(PostSpendingCategoryRequest request);
    public Task<SpendingCategory?> GetSpendingCategory(int spendingCategoryId);
    public Task<List<SpendingCategory>> GetAllSpendingCategoriesByUserId(int userId);
    public Task<SpendingCategory> UpdateSpendingCategory(int spendingCategoryId, UpdateSpendingCategoryRequest request);
    public Task<bool> DeleteSpendingCategory(int spendingCategoryId);
    public Task<List<Document>> GetDocumentsBySpendingCategoryId(int spendingCategoryId);
    public Task<SpendingCategory?> GetSpendingCategoryByNameAndUserId(string name, int userId);
}