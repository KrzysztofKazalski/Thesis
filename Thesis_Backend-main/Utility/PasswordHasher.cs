namespace Thesis_backend.Utility;

using BCrypt.Net;

public static class PasswordHasher
{
    public static string HashPassword(string password) => BCrypt.HashPassword(password);

    public static bool VerifyPassword(string password, string hashedPassword) => 
        BCrypt.Verify(password, hashedPassword);
}