using Microsoft.AspNetCore.Identity;
using NetworkingApp.Models;

namespace NetworkingApp.Services
{
    public interface IRoleService
    {
        Task InitializeRolesAsync();
        Task<bool> AssignRoleToUserAsync(int userId, string roleName);
        Task<bool> RemoveRoleFromUserAsync(int userId, string roleName);
        Task<IList<string>> GetUserRolesAsync(int userId);
        Task<bool> IsUserInRoleAsync(int userId, string roleName);
    }

    public class RoleService : IRoleService
    {
        private readonly RoleManager<IdentityRole<int>> _roleManager;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<RoleService> _logger;

        // Define application roles
        public static class Roles
        {
            public const string Admin = "Admin";
            public const string Helper = "Helper";
            public const string User = "User";
        }

        public RoleService(
            RoleManager<IdentityRole<int>> roleManager,
            UserManager<User> userManager,
            ILogger<RoleService> logger)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task InitializeRolesAsync()
        {
            try
            {
                string[] roleNames = { Roles.Admin, Roles.Helper, Roles.User };

                foreach (var roleName in roleNames)
                {
                    if (!await _roleManager.RoleExistsAsync(roleName))
                    {
                        var role = new IdentityRole<int>(roleName);
                        var result = await _roleManager.CreateAsync(role);
                        
                        if (result.Succeeded)
                        {
                            _logger.LogInformation("Created role: {RoleName}", roleName);
                        }
                        else
                        {
                            _logger.LogError("Failed to create role {RoleName}: {Errors}", 
                                roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while initializing roles");
                throw;
            }
        }

        public async Task<bool> AssignRoleToUserAsync(int userId, string roleName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found", userId);
                    return false;
                }

                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    _logger.LogWarning("Role {RoleName} does not exist", roleName);
                    return false;
                }

                var result = await _userManager.AddToRoleAsync(user, roleName);
                if (result.Succeeded)
                {
                    _logger.LogInformation("Assigned role {RoleName} to user {UserId}", roleName, userId);
                    return true;
                }

                _logger.LogWarning("Failed to assign role {RoleName} to user {UserId}: {Errors}",
                    roleName, userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while assigning role {RoleName} to user {UserId}", roleName, userId);
                return false;
            }
        }

        public async Task<bool> RemoveRoleFromUserAsync(int userId, string roleName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found", userId);
                    return false;
                }

                var result = await _userManager.RemoveFromRoleAsync(user, roleName);
                if (result.Succeeded)
                {
                    _logger.LogInformation("Removed role {RoleName} from user {UserId}", roleName, userId);
                    return true;
                }

                _logger.LogWarning("Failed to remove role {RoleName} from user {UserId}: {Errors}",
                    roleName, userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while removing role {RoleName} from user {UserId}", roleName, userId);
                return false;
            }
        }

        public async Task<IList<string>> GetUserRolesAsync(int userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found", userId);
                    return new List<string>();
                }

                return await _userManager.GetRolesAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting roles for user {UserId}", userId);
                return new List<string>();
            }
        }

        public async Task<bool> IsUserInRoleAsync(int userId, string roleName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found", userId);
                    return false;
                }

                return await _userManager.IsInRoleAsync(user, roleName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking if user {UserId} is in role {RoleName}", userId, roleName);
                return false;
            }
        }
    }
}
