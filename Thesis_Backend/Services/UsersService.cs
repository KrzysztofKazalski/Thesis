using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Thesis_backend.Database;
using Thesis_backend.Models;
using Thesis_backend.Services.Interfaces;
using Thesis_backend.Utility;

namespace Thesis_backend.Services;

public class UsersService : IUsersService
{
    private readonly AppDbContext _context;

    public UsersService(AppDbContext context)
    {
        _context = context;
    }
    
    public async Task<User?> GetUserData(int userId)
    {
        return await _context.Users.SingleOrDefaultAsync(user => user.Id == userId);
    }
    
    public async Task<User> UpdateUserAccount(int userId, string? username, string? password)
    {
        if(username == null && password == null)
            throw new ArgumentException("Request username and password are both null");
        var result = await GetUserData(userId);
        if (result == null)
            throw new InvalidOperationException("User with id {userId} does not exist");
        if (username != null)
            result.Username = username;
        if (password != null)
            result.PasswordHash = PasswordHasher.HashPassword(password);
        _context.Update(result);
        await _context.SaveChangesAsync();
        return result;
    }

    public async Task<bool> DeleteUserAccount(int userId)
    {
        var user = await GetUserData(userId);
        
        if(user == null)
            throw new InvalidOperationException("User with id {userId} does not exist");

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<User> CreateUserAccount(string email, string username, string password)
    {
        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = PasswordHasher.HashPassword(password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Automatically create default "Other" category for the new user
        var otherCategory = new SpendingCategory
        {
            Name = "Other",
            UserId = user.Id
        };

        _context.SpendingCategories.Add(otherCategory);
        user.SpendingCategories.Add(otherCategory);
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<User> GetUserWithAllData(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Documents)
                .ThenInclude(d => d.SpendingCategories)
            .Include(u => u.SpendingCategories)
            .SingleOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new InvalidOperationException($"User with ID {userId} not found");

        return user;
    }
}