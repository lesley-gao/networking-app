// Tests/Services/TestHelpers/ServiceTestBase.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NetworkingApp.Data;
using NetworkingApp.Data.SeedData;
using NetworkingApp.Tests.Common;

namespace NetworkingApp.Tests.Services.TestHelpers
{
    public abstract class ServiceTestBase
    {
        protected ApplicationDbContext CreateInMemoryContext(string databaseName = null!)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>() 
                .UseInMemoryDatabase(databaseName ?? $"TestDb_{Guid.NewGuid()}")
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        protected Mock<ILogger<T>> CreateMockLogger<T>()
        {
            return new Mock<ILogger<T>>();
        }

        protected void SeedTestData(ApplicationDbContext context)
        {
            // Use the existing seed data factories
            var users = UserSeedDataFactory.CreateSeedUsers();
            context.Users.AddRange(users);
            
            var flightRequests = FlightCompanionSeedDataFactory.CreateSeedRequests();
            context.FlightCompanionRequests.AddRange(flightRequests);
            
            var flightOffers = FlightCompanionSeedDataFactory.CreateSeedOffers();
            context.FlightCompanionOffers.AddRange(flightOffers);
            
            var pickupRequests = PickupSeedDataFactory.CreateSeedRequests();
            context.PickupRequests.AddRange(pickupRequests);
            
            var pickupOffers = PickupSeedDataFactory.CreateSeedOffers();
            context.PickupOffers.AddRange(pickupOffers);
            
            context.SaveChanges();
        }
    }
}