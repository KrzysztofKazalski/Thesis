using System.Globalization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Thesis_backend.Database;
using Thesis_backend.DTO;
using Thesis_backend.Models;
using Thesis_backend.Services.Interfaces;

namespace Thesis_backend.Services;


public class DocumentsService : IDocumentsService
{
    private readonly AppDbContext _context;
    private readonly IUsersService _usersService;

    public DocumentsService(AppDbContext context, IUsersService usersService)
    {
        _context = context;
        _usersService = usersService;
    }

    public async Task<Document?> GetDocument(int documentId)
    {
        return await _context.Documents
            .Include(d => d.SpendingCategories)
            .SingleOrDefaultAsync(document => document.Id == documentId);
    }

    public async Task<List<Document>> GetAllDocumentsByUserId(int userId)
    {
        var user = await _usersService.GetUserData(userId);

        if (user == null)
            throw new InvalidOperationException($"User with ID {userId} not found");
        
        return await _context.Documents
            .Include(d => d.SpendingCategories)
            .Where(document => document.UserId == userId)
            .ToListAsync();
    }

    public async Task<Document> CreateNewDocument(PostDocumentRequest request)
    {
        //TODO Extra validation
        //test image link

        // "WarrantyDuration missing or WarrantyDuration exists while HasWarranty is false."
        if (request.HasWarranty == false && request.WarrantyDuration != 0)
        {
            throw new InvalidOperationException(
                "WarrantyDuration is larger than 0 despite the document having no warranty.");
        }

        if (request.HasWarranty && request.WarrantyDuration <= 0)
        {
            throw new InvalidOperationException(
                "The WarrantyDuration cannot be smaller or equal to 0 if the product is under warranty");
        }

        var user = await _context.Users.Include(u => u.Documents)
            .FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user == null)
            throw new InvalidOperationException($"User with ID {request.UserId} not found.");

        var document = new Document
        {
            Timestamp = DateTime.Parse(request.TimeStamp, null, DateTimeStyles.RoundtripKind),
            Name = request.Name,
            Description = request.Description,
            ImageLink = request.ImageLink,
            ImageContent = request.ImageContent,
            AmountSpent = request.AmountSpent,
            Company = request.Company,
            HasWarranty = request.HasWarranty,
            WarrantyDuration = request.HasWarranty ? request.WarrantyDuration : null,
            UserId = request.UserId
        };

        // If no categories were selected, add the "Other" category
        if (!request.SpendingCategoryIds.Any())
        {
            var otherCategory = await _context.SpendingCategories
                .FirstOrDefaultAsync(sc => sc.UserId == request.UserId && sc.Name == "Other");
            
            if (otherCategory != null)
            {
                document.SpendingCategories.Add(otherCategory);
                otherCategory.Documents.Add(document);
            }
        }
        else
        {
            // Add all selected categories
            var categories = await _context.SpendingCategories
                .Where(sc => sc.UserId == request.UserId && request.SpendingCategoryIds.Contains(sc.Id))
                .ToListAsync();

            // Verify all requested categories were found and belong to the user
            if (categories.Count != request.SpendingCategoryIds.Count)
                throw new InvalidOperationException("One or more selected categories were not found or do not belong to this user.");

            foreach (var category in categories)
            {
                document.SpendingCategories.Add(category);
                category.Documents.Add(document);
            }
        }

        _context.Documents.Add(document);
        user.Documents.Add(document);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<Document> UpdateDocument(int documentId, DocumentUpdateRequest request)
    {
        var document = await _context.Documents
            .Include(d => d.SpendingCategories)
            .SingleOrDefaultAsync(d => d.Id == documentId);
        
        if (document == null)
            throw new InvalidOperationException($"Document with id {documentId} does not exist");

        if (request.HasWarranty == true && request.WarrantyDuration == null)
            throw new InvalidOperationException("WarrantyDuration is null while HasWarranty is true");

        document.Timestamp = DateTime.Parse(request.TimeStamp, null, DateTimeStyles.RoundtripKind);
        document.Name = request.Name;         
        document.Description = request.Description;         
        document.ImageContent = request.ImageContent;
        // Only update ImageLink if a new one is provided, otherwise preserve the existing one
        if (!string.IsNullOrEmpty(request.ImageLink))
        {
            document.ImageLink = request.ImageLink;
        }
        document.AmountSpent = request.AmountSpent;
        document.Company = request.Company;
        document.HasWarranty = request.HasWarranty;
        document.WarrantyDuration = request.HasWarranty ? request.WarrantyDuration : null;

        // Clear existing categories
        document.SpendingCategories.Clear();

        // If no categories were selected, add the "Other" category
        if (!request.SpendingCategoryIds.Any())
        {
            var otherCategory = await _context.SpendingCategories
                .FirstOrDefaultAsync(sc => sc.UserId == document.UserId && sc.Name == "Other");
            
            if (otherCategory != null)
            {
                document.SpendingCategories.Add(otherCategory);
            }
        }
        else
        {
            // Add all selected categories
            var categories = await _context.SpendingCategories
                .Where(sc => sc.UserId == document.UserId && request.SpendingCategoryIds.Contains(sc.Id))
                .ToListAsync();

            // Verify all requested categories were found and belong to the user
            if (categories.Count != request.SpendingCategoryIds.Count)
                throw new InvalidOperationException("One or more selected categories were not found or do not belong to this user.");

            foreach (var category in categories)
            {
                document.SpendingCategories.Add(category);
            }
        }

        _context.Update(document);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<bool> DeleteDocument(int documentId)
    {
        var document = await _context.Documents.SingleOrDefaultAsync(d => d.Id == documentId);
        
        if (document == null)
            return false;
        
        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<List<SpendingCategory>> GetSpendingCategoriesByDocumentId(int documentId)
    {
        var document = await _context.Documents
            .Include(d => d.SpendingCategories)
            .SingleOrDefaultAsync(d => d.Id == documentId);

        if (document == null)
            throw new InvalidOperationException($"Document with ID {documentId} not found.");

        return document.SpendingCategories.ToList();
    }
}