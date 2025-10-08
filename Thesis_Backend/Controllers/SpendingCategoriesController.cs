using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Thesis_backend.DTO;
using Thesis_backend.Services.Interfaces;

namespace Thesis_backend.Controllers;

[ApiController]
[Route("[controller]")]
public class SpendingCategoriesController : ControllerBase
{
    private readonly ISpendingCategoriesService _spendingCategoriesService;

    public SpendingCategoriesController(ISpendingCategoriesService spendingCategoriesService)
    {
        _spendingCategoriesService = spendingCategoriesService;
    }

    [HttpPost]
    public async Task<IActionResult> AddSpendingCategory([FromBody] PostSpendingCategoryRequest request)
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

            // Check for duplicate category names for the same user
            var existingCategory = await _spendingCategoriesService.GetSpendingCategoryByNameAndUserId(request.Name, request.UserId);
            if (existingCategory != null)
            {
                return BadRequest("A category with this name already exists for this user");
            }

            var category = await _spendingCategoriesService.CreateNewSpendingCategory(request);
            return Ok(new SpendingCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                UserId = category.UserId
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

    [HttpGet("{spendingCategoryId:int}")]
    public async Task<IActionResult> GetSpendingCategory(int spendingCategoryId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        
        try
        {
            var category = await _spendingCategoriesService.GetSpendingCategory(spendingCategoryId);
            if (category == null)
                return BadRequest($"SpendingCategory with id {spendingCategoryId} does not exist.");
            
            //JWT
            if (category.UserId != currentUserId)
            {
                return Forbid();
            }
            
            return Ok(new SpendingCategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    UserId = category.UserId
                }
            );
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetSpendingCategoryListByUserId(int userId)
    {
        // var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
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
            var categories = await _spendingCategoriesService.GetAllSpendingCategoriesByUserId(userId);
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
            return BadRequest(e.Message);
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }

    [HttpPut("{spendingCategoryId:int}")]
    public async Task<IActionResult> EditSpendingCategory(int spendingCategoryId, [FromBody] UpdateSpendingCategoryRequest request)
    {
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
            
            // Get the current category to check its user ID
            var currentCategory = await _spendingCategoriesService.GetSpendingCategory(spendingCategoryId);
            if (currentCategory == null)
            {
                return NotFound($"SpendingCategory with ID {spendingCategoryId} not found.");
            }
            if (currentCategory.UserId != currentUserId)
            {
                return Forbid();
            }
            
            // Check for duplicate category names for the same user (excluding the current category)
            var existingCategory = await _spendingCategoriesService.GetSpendingCategoryByNameAndUserId(request.Name, currentCategory.UserId);
            if (existingCategory != null && existingCategory.Id != spendingCategoryId)
            {
                return BadRequest("A category with this name already exists for this user");
            }

            var category = await _spendingCategoriesService.UpdateSpendingCategory(spendingCategoryId, request);
            return Ok(new SpendingCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                UserId = category.UserId
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

    [HttpDelete("{spendingCategoryId:int}")]
    public async Task<IActionResult> DeleteSpendingCategory(int spendingCategoryId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }
        
        try
        {
            var category = await _spendingCategoriesService.GetSpendingCategory(spendingCategoryId);
            if (category == null)
                return BadRequest($"SpendingCategory with id {spendingCategoryId} does not exist");
            if (category.UserId != currentUserId)
            {
                return Forbid();
            }
            var result = await _spendingCategoriesService.DeleteSpendingCategory(spendingCategoryId);
            return result
                ? Ok("SpendingCategory deleted successfully") :
                BadRequest($"An error occured while deleting spending category with id {spendingCategoryId}");
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

    [HttpGet("{spendingCategoryId:int}/documents")]
    public async Task<IActionResult> GetDocuments(int spendingCategoryId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized("Invalid user ID claim");
        }

        
        try
        {
            var category = await _spendingCategoriesService.GetSpendingCategory(spendingCategoryId);
            if(category==null)
                return BadRequest($"SpendingCategory with id {spendingCategoryId} does not exist");
            if (category.UserId != currentUserId)
            {
                return Forbid();
            }
            var documents = await _spendingCategoriesService.GetDocumentsBySpendingCategoryId(spendingCategoryId);
            
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
} 