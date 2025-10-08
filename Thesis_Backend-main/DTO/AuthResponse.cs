using Thesis_backend.Utility;

namespace Thesis_backend.DTO;

public class AuthResponse
{
    // Backend response after logging in
    public int Id { get; set; }
    public string Token { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
}