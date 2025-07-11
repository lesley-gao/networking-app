// Tests/Common/TestDataFactory.cs
using NetworkingApp.Data;
using NetworkingApp.Data.SeedData;

namespace NetworkingApp.Tests.Common
{
    public static class TestDataFactory
    {
        public static void SeedUsers(ApplicationDbContext context)
        {
            var users = UserSeedDataFactory.CreateSeedUsers();
            context.Users.AddRange(users);
            context.SaveChanges();
        }

        public static void SeedFlightCompanionData(ApplicationDbContext context)
        {
            var requests = FlightCompanionSeedDataFactory.CreateSeedRequests();
            context.FlightCompanionRequests.AddRange(requests);
            
            var offers = FlightCompanionSeedDataFactory.CreateSeedOffers();
            context.FlightCompanionOffers.AddRange(offers);
            
            context.SaveChanges();
        }

        public static void SeedPickupData(ApplicationDbContext context)
        {
            var requests = PickupSeedDataFactory.CreateSeedRequests();
            context.PickupRequests.AddRange(requests);
            
            var offers = PickupSeedDataFactory.CreateSeedOffers();
            context.PickupOffers.AddRange(offers);
            
            context.SaveChanges();
        }
    }
}