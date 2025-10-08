using Microsoft.EntityFrameworkCore;
using Thesis_backend.Database;
using Thesis_backend.DTO;
using Thesis_backend.Models;
using Thesis_backend.Services.Interfaces;

namespace Thesis_backend.Services;

public class SpendingCategoriesService : ISpendingCategoriesService
{
    private readonly AppDbContext _context;
    private readonly IUsersService _usersService;

    public SpendingCategoriesService(AppDbContext context, IUsersService usersService)
    {
        _context = context;
        _usersService = usersService;
    }

    public async Task<SpendingCategory> CreateNewSpendingCategory(PostSpendingCategoryRequest request)
    {
        var user = await _context.Users.Include(u => u.SpendingCategories)
            .FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user == null)
            throw new InvalidOperationException($"User with ID {request.UserId} not found.");

        var spendingCategory = new SpendingCategory
        {
            Name = request.Name,
            UserId = request.UserId
        };

        _context.SpendingCategories.Add(spendingCategory);
        user.SpendingCategories.Add(spendingCategory);
        await _context.SaveChangesAsync();

        return spendingCategory;
    }

    public async Task<SpendingCategory?> GetSpendingCategory(int spendingCategoryId)
    {
        return await _context.SpendingCategories
            .SingleOrDefaultAsync(category => category.Id == spendingCategoryId);
    }

    public async Task<List<SpendingCategory>> GetAllSpendingCategoriesByUserId(int userId)
    {
        var user = await _usersService.GetUserData(userId);
        if (user == null)
            throw new InvalidOperationException($"User with ID {userId} not found.");

        return await _context.SpendingCategories
            .Where(category => category.UserId == userId)
            .ToListAsync();
    }

    public async Task<SpendingCategory> UpdateSpendingCategory(int spendingCategoryId, UpdateSpendingCategoryRequest request)
    {
        var category = await GetSpendingCategory(spendingCategoryId);
        if (category == null)
            throw new InvalidOperationException($"SpendingCategory with ID {spendingCategoryId} not found.");
        
        if (category.Name == "Other")
            throw new InvalidOperationException("The 'Other' category cannot be modified.");

        category.Name = request.Name;
        _context.Update(category);
        await _context.SaveChangesAsync();

        return category;
    }

    public async Task<bool> DeleteSpendingCategory(int spendingCategoryId)
    {
        var category = await _context.SpendingCategories
            .Include(c => c.Documents)
            .SingleOrDefaultAsync(c => c.Id == spendingCategoryId);

        if (category == null)
            return false;
        
        if (category.Name == "Other")
            throw new InvalidOperationException("The 'Other' category cannot be deleted.");
            
        // Check if the category contains any documents
        if (category.Documents.Any())
            throw new InvalidOperationException("Cannot delete a category that contains documents. Remove all documents from this category first.");

        _context.SpendingCategories.Remove(category);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<List<Document>> GetDocumentsBySpendingCategoryId(int spendingCategoryId)
    {
        var category = await _context.SpendingCategories
            .Include(sc => sc.Documents)
            .SingleOrDefaultAsync(sc => sc.Id == spendingCategoryId);

        if (category == null)
            throw new InvalidOperationException($"SpendingCategory with ID {spendingCategoryId} not found.");

        return category.Documents.ToList();
    }
    
    public async Task<SpendingCategory?> GetSpendingCategoryByNameAndUserId(string name, int userId)
    {
        return await _context.SpendingCategories
            .FirstOrDefaultAsync(sc => sc.Name.ToLower() == name.ToLower() && sc.UserId == userId);
    }
} 