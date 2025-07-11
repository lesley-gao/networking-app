using System.Security.Claims;
using NetworkingApp.Models;

namespace NetworkingApp.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user, IList<string> roles);
    }
}
