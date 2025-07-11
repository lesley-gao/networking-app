using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using NetworkingApp.Controllers;
using NetworkingApp.Models;
using NetworkingApp.Models.DTOs;
using NetworkingApp.Services;
using System.Threading.Tasks;

namespace NetworkingApp.Tests.Controllers
{
    [TestClass]
    public class AuthControllerTests
    {
        private Mock<UserManager<User>> _userManagerMock;
        private Mock<SignInManager<User>> _signInManagerMock;
        private Mock<IEmailService> _emailServiceMock;
        private AuthController _controller;

        [TestInitialize]
        public void Setup()
        {
            var userStoreMock = new Mock<IUserStore<User>>();
            _userManagerMock = new Mock<UserManager<User>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
            var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            var userClaimsPrincipalFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
            _signInManagerMock = new Mock<SignInManager<User>>(_userManagerMock.Object, contextAccessor.Object, userClaimsPrincipalFactory.Object, null, null, null, null);
            _emailServiceMock = new Mock<IEmailService>();
            _controller = new AuthController(_userManagerMock.Object, _signInManagerMock.Object, _emailServiceMock.Object);
        }

        [TestMethod]
        public async Task Register_ReturnsOk_WhenRegistrationSucceeds()
        {
            var dto = new RegisterDto { Email = "test@example.com", Password = "Password123!" };
            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), dto.Password)).ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<User>(), "User")).ReturnsAsync(IdentityResult.Success);

            var result = await _controller.Register(dto);
            Assert.IsInstanceOfType(result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Login_ReturnsOk_WhenLoginSucceeds()
        {
            var dto = new LoginDto { Email = "test@example.com", Password = "Password123!", RememberMe = false };
            var user = new User { Email = dto.Email, UserName = dto.Email };
            _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
            _signInManagerMock.Setup(x => x.PasswordSignInAsync(user, dto.Password, dto.RememberMe, true)).ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            var result = await _controller.Login(dto);
            Assert.IsInstanceOfType(result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task Logout_ReturnsOk()
        {
            _signInManagerMock.Setup(x => x.SignOutAsync()).Returns(Task.CompletedTask);
            var result = await _controller.Logout();
            Assert.IsInstanceOfType(result, typeof(OkObjectResult));
        }

        [TestMethod]
        public async Task PasswordReset_ReturnsOk_AndSendsEmail()
        {
            var dto = new PasswordResetRequestDto { Email = "test@example.com", ResetUrlBase = "https://example.com/reset" };
            var user = new User { Email = dto.Email, UserName = dto.Email };
            _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
            _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("token");
            _emailServiceMock.Setup(x => x.SendPasswordResetEmailAsync(dto.Email, It.IsAny<string>())).Returns(Task.CompletedTask);

            var result = await _controller.PasswordReset(dto);
            Assert.IsInstanceOfType(result, typeof(OkObjectResult));
            _emailServiceMock.Verify(x => x.SendPasswordResetEmailAsync(dto.Email, It.IsAny<string>()), Times.Once);
        }
    }
}
