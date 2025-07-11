using Microsoft.AspNetCore.DataProtection;

namespace NetworkingApp.Services
{
    public interface IDataProtectionService
    {
        string Protect(string plaintext, string purpose);
        string Unprotect(string protectedData, string purpose);
    }

    public class DataProtectionService : IDataProtectionService
    {
        private readonly IDataProtectionProvider _provider;
        public DataProtectionService(IDataProtectionProvider provider)
        {
            _provider = provider;
        }
        public string Protect(string plaintext, string purpose)
        {
            var protector = _provider.CreateProtector(purpose);
            return protector.Protect(plaintext);
        }
        public string Unprotect(string protectedData, string purpose)
        {
            var protector = _provider.CreateProtector(purpose);
            return protector.Unprotect(protectedData);
        }
    }
}
