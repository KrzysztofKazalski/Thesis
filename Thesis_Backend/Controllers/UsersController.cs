using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Thesis_backend.Database;
using Thesis_backend.DTO;
using Thesis_backend.Models;
using Thesis_backend.Services.Interfaces;
using Thesis_backend.Utility;

namespace Thesis_backend.Controllers;

[ApiController]
[Route("[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly JwtSettings _jwtSettings;
    private readonly IUsersService _usersService;
    private readonly IConfiguration _configuration;

    public UsersController(AppDbContext dbContext, IOptions<JwtSettings> options, IUsersService usersService, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _jwtSettings = options.Value;
        _usersService = usersService;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if ModelState is valid (this will validate the data annotations on the RegisterRequest)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Username uniqueness validation
            if (_dbContext.Users.Any(u => u.Username == request.Username))
            {
                return BadRequest("Username already in use.");
            }
        
            // Email uniqueness validation
            if (_dbContext.Users.Any(u => u.Email == request.Email))
            {
                return BadRequest("Email already in use.");
            }

            // Create new user account (this will also create the "Other" SpendingCategory)
            var user = await _usersService.CreateUserAccount(request.Email, request.Username, request.Password);

            var token = JwtHelper.GenerateToken(user.Username, user.Id, _configuration);
            
            return Ok(new AuthResponse
            {
                Id = user.Id,
                Token = token,
                Username = user.Username,
                Email = user.Email,
            });
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }
    
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        var user = _dbContext.Users.FirstOrDefault(u => u.Username == request.Username);
        
        if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized("Invalid Username or Password");

        var token = JwtHelper.GenerateToken(user.Username, user.Id, _configuration);
        
        return Ok(new AuthResponse
        {
            Id = user.Id,
            Token = token,
            Username = user.Username,
            Email = user.Email,
        });
    }
    
    [HttpPut("{userId:int}")]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
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
        
        // Check if ModelState is valid (this will validate the data annotations on the UpdateUserRequest)
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        // If both username and password are null, there's nothing to update
        if (request.Username == null && request.Password == null)
        {
            return BadRequest("At least one field (username or password) must be provided for update.");
        }
        
        // Username uniqueness validation
        if (request.Username != null)
        {
            if (_dbContext.Users.Any(u => u.Username == request.Username && u.Id != userId))
            {
                return BadRequest("Username already in use.");
            }
        }
        
        try
        {
            var result = await _usersService.UpdateUserAccount(userId, request.Username, request.Password);
            return Ok(new UpdateUserResponse
            {
                Username = result.Username,
            });
        }
        catch (InvalidOperationException e)
        {
            return NotFound($"User with id {userId} does not exist");
        }
        catch (ArgumentException e)
        {
            return BadRequest(e.Message);
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occurred");
        }
    }
    
    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> DeleteUser(int userId)
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
            var success = await _usersService.DeleteUserAccount(userId);
            return success ? Ok() : NotFound();
        }
        catch (InvalidOperationException)
        {
            return NotFound("User with id {userId} does not exist");
        }
        catch (Exception e)
        {
            Console.Write(e);
            return StatusCode(500, "An unexpected error occured");
        }
    }

    [HttpGet("{userId:int}/data")]
    public async Task<IActionResult> GetAllUserData(int userId)
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
            var user = await _usersService.GetUserWithAllData(userId);
            
            return Ok(new UserWithDataDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Documents = user.Documents.Select(d => new DocumentWithCategoriesDto
                {
                    Id = d.Id,
                    Timestamp = d.Timestamp,
                    Name = d.Name,
                    Description = d.Description,
                    ImageLink = d.ImageLink,
                    ImageContent = d.ImageContent,
                    AmountSpent = d.AmountSpent,
                    Company = d.Company,
                    HasWarranty = d.HasWarranty,
                    WarrantyDuration = d.WarrantyDuration,
                    UserId = d.UserId,
                    SpendingCategories = d.SpendingCategories.Select(sc => new SpendingCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        UserId = sc.UserId
                    }).ToList()
                }).ToList(),
                SpendingCategories = user.SpendingCategories.Select(sc => new SpendingCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    UserId = sc.UserId
                }).ToList()
            });
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
    
    [HttpGet("{userId:int}/spendingSummary")]
    public async Task<IActionResult> GetUserSpendingSummary(int userId)
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
            var user = await _usersService.GetUserWithAllData(userId);
            
            return Ok(new SpendingSummaryDTO
            {
                Documents = user.Documents.Select(d => new DocumentSpendingSummaryDTO
                {
                    Timestamp = d.Timestamp,
                    AmountSpent = d.AmountSpent,
                    SpendingCategories = d.SpendingCategories.Select(sc => new SpendingCategorySpendingSummaryDTO
                    {
                        Name = sc.Name,
                    }).ToList(),
                }).ToList(),
                SpendingCategories = user.SpendingCategories.Select(sc => new SpendingCategorySpendingSummaryDTO
                {
                    Name = sc.Name,
                }).ToList()
            });
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