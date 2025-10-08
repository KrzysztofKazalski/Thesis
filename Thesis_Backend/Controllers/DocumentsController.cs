using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Thesis_backend.Database;
using Thesis_backend.DTO;
using Thesis_backend.Services.Interfaces;
using Thesis_backend.Utility;

namespace Thesis_backend.Controllers;

[ApiController]
[Route("[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly JwtSettings _jwtSettings;
    private readonly IUsersService _usersService;
    private readonly IDocumentsService _documentsService;

    public DocumentsController(AppDbContext dbContext, IOptions<JwtSettings> options, IUsersService usersService, IDocumentsService documentsService)
    {
        _dbContext = dbContext;
        _jwtSettings = options.Value;
        _usersService = usersService;
        _documentsService = documentsService;
    }

    [HttpPost()]
    public async Task<IActionResult> AddDocument([FromBody] PostDocumentRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        if (request.UserId != currentUserId)
        {
            return Forbid();
        }
        
        try
        {
            // Check if ModelState is valid (this will validate the data annotations)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Validate timestamp is not in the future
            if (DateTime.TryParse(request.TimeStamp, out DateTime timestamp))
            {
                if (timestamp > DateTime.Now)
                {
                    return BadRequest("Date cannot be in the future");
                }
            }
            
            // Validate warranty duration if HasWarranty is true
            if (request.HasWarranty && (!request.WarrantyDuration.HasValue || request.WarrantyDuration <= 0))
            {
                return BadRequest("Warranty duration must be greater than zero when warranty is enabled");
            }

            var document = await _documentsService.CreateNewDocument(request);
            return Ok(new DocumentWithCategoriesDto
            {
                Id = document.Id,
                Timestamp = document.Timestamp,
                Name = document.Name,
                Description = document.Description,
                ImageLink = document.ImageLink,
                ImageContent = document.ImageContent,
                AmountSpent = document.AmountSpent,
                Company = document.Company,
                HasWarranty = document.HasWarranty,
                WarrantyDuration = document.WarrantyDuration,
                UserId = document.UserId,
                SpendingCategories = document.SpendingCategories.Select(sc => new SpendingCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    UserId = sc.UserId,
                }).ToList()
            });
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(e.Message);
        }
        catch (Exception e)
        {
            Console.Write(e); //TODO replace with logger
            return StatusCode(500, "An unexpected error has occurred");
        }
    }

    [HttpGet("{documentId:int}")]
    public async Task<IActionResult> GetDocument(int documentId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        
        try
        {
            var document = await _documentsService.GetDocument(documentId);
            if (document == null)
                return NotFound($"Document with id {documentId} does not exist");
            if (document.UserId != currentUserId)
            {
                return Forbid();
            }
            return Ok(new DocumentWithCategoriesDto
                {
                    Id = document.Id,
                    Timestamp = document.Timestamp,
                    Name = document.Name,
                    Description = document.Description,
                    ImageLink = document.ImageLink,
                    ImageContent = document.ImageContent,
                    AmountSpent = document.AmountSpent,
                    Company = document.Company,
                    HasWarranty = document.HasWarranty,
                    WarrantyDuration = document.WarrantyDuration,
                    UserId = document.UserId,
                    SpendingCategories = document.SpendingCategories.Select(sc => new SpendingCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        UserId = sc.UserId,
                    }).ToList()
                });
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }
    
    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetDocumentListByUserId(int userId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        if (userId != currentUserId)
        {
            return Forbid();
        }
        
        try
        {
            var documents = await _documentsService.GetAllDocumentsByUserId(userId);
            var result = documents.Select(document => new DocumentWithCategoriesDto
            {
                Id = document.Id,
                Timestamp = document.Timestamp,
                Name = document.Name,
                Description = document.Description,
                ImageLink = document.ImageLink,
                ImageContent = document.ImageContent,
                AmountSpent = document.AmountSpent,
                Company = document.Company,
                HasWarranty = document.HasWarranty,
                WarrantyDuration = document.WarrantyDuration,
                UserId = document.UserId,
                SpendingCategories = document.SpendingCategories.Select(sc => new SpendingCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    UserId = sc.UserId
                }).ToList()
            });
            return Ok(result);
        }
        catch (InvalidOperationException e)
        {
            return NotFound(e.Message);
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }

    [HttpPut("{documentId:int}")]
    public async Task<IActionResult> EditDocument(int documentId, DocumentUpdateRequest request)
    {
        
        // TODO probably fix not being able to update the document because the DocumentUpdateRequest isn't what the
        // front one looks like
        
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        
        try
        {
            // Check if ModelState is valid (this will validate the data annotations)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Validate timestamp is not in the future
            if (DateTime.TryParse(request.TimeStamp, out DateTime timestamp))
            {
                if (timestamp > DateTime.Now)
                {
                    return BadRequest("Date cannot be in the future");
                }
            }
            
            // Validate warranty duration if HasWarranty is true
            if (request.HasWarranty && (!request.WarrantyDuration.HasValue || request.WarrantyDuration <= 0))
            {
                return BadRequest("Warranty duration must be greater than zero when warranty is enabled");
            }

            var doc = await _documentsService.GetDocument(documentId);
            if(doc==null)
                return NotFound($"Document with id {documentId} does not exist");
            if (doc.UserId != currentUserId)
            {
                return Forbid();
            }
            
            var document = await _documentsService.UpdateDocument(documentId, request);
            return Ok(new DocumentWithCategoriesDto
            {
                Id = document.Id,
                Timestamp = document.Timestamp,
                Name = document.Name,
                Description = document.Description,
                ImageLink = document.ImageLink,
                ImageContent = document.ImageContent,
                AmountSpent = document.AmountSpent,
                Company = document.Company,
                HasWarranty = document.HasWarranty,
                WarrantyDuration = document.WarrantyDuration,
                UserId = document.UserId,
                SpendingCategories = document.SpendingCategories.Select(sc => new SpendingCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    UserId = sc.UserId
                }).ToList()
            });
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(e.Message);
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }
    
    [HttpDelete("{documentId:int}")]
    public async Task<IActionResult> DeleteDocument(int documentId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        
        try
        {
            var document = await _documentsService.GetDocument(documentId);
            if (document == null)
                return NotFound($"Document with id {documentId} does not exist");
            if (document.UserId != currentUserId)
            {
                return Forbid();
            }
            var result = await _documentsService.DeleteDocument(documentId);
            return result
                ? Ok("Document deleted successfully")
                : BadRequest($"Document with id {documentId} does not exist");
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }

    [HttpGet("{documentId:int}/categories")]
    public async Task<IActionResult> GetSpendingCategories(int documentId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        
        try
        {
            var document = await _documentsService.GetDocument(documentId);
            if (document == null)
                return NotFound($"Document with id {documentId} does not exist");
            if (document.UserId != currentUserId)
            {
                return Forbid();
            }
            var categories = await _documentsService.GetSpendingCategoriesByDocumentId(documentId);
            var result = categories.Select(category => new SpendingCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                UserId = category.UserId
            });
            return Ok(result);
        }
        catch (InvalidOperationException e)
        {
            return NotFound(e.Message);
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }
}