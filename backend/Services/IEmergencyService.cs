using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;

namespace NetworkingApp.Services
{
    public interface IEmergencyService
    {
        Task<EmergencyResponseDto> CreateEmergencyAsync(int userId, CreateEmergencyDto emergencyDto);
        Task<EmergencyResponseDto> ResolveEmergencyAsync(int emergencyId, ResolveEmergencyDto resolveDto);
        Task<IEnumerable<EmergencyResponseDto>> GetUserEmergenciesAsync(int userId);
        Task<IEnumerable<EmergencyResponseDto>> GetActiveEmergenciesAsync();
        Task<bool> SendEmergencyNotificationsAsync(int emergencyId);
        Task<bool> CancelEmergencyAsync(int emergencyId, int userId);
    }
}
