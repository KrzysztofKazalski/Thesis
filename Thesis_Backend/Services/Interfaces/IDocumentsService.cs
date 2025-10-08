using Thesis_backend.DTO;
using Thesis_backend.Models;

namespace Thesis_backend.Services.Interfaces;

public interface IDocumentsService
{
    public Task<Document> CreateNewDocument (PostDocumentRequest request);
    public Task<Document?> GetDocument (int documentId);
    public Task<List<Document>> GetAllDocumentsByUserId (int userId);
    public Task<Document> UpdateDocument (int documentId, DocumentUpdateRequest request);
    public Task<bool> DeleteDocument (int documentId);
    public Task<List<SpendingCategory>> GetSpendingCategoriesByDocumentId(int documentId);
}