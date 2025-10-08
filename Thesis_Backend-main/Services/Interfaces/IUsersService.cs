using Thesis_backend.Models;

namespace Thesis_backend.Services.Interfaces;

public interface IUsersService
{
    public Task<User?> GetUserData(int userId);
    public Task<User> UpdateUserAccount(int userId, string? username, string? password);
    public Task<bool> DeleteUserAccount(int userId);
    public Task<User> CreateUserAccount(string email, string username, string password);
    public Task<User> GetUserWithAllData(int userId);
}