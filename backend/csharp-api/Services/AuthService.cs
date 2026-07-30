using PlantSystem.API.Data;
using PlantSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace PlantSystem.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthService(AppDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return new AuthResponse { Success = false, Message = "User not found" };
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return new AuthResponse { Success = false, Message = "Invalid password" };
            }

            var token = _tokenService.GenerateJwtToken(user);
            var imageUrl = user.ImageUrl != null && user.ImageUrl != ""
            ? $"http://localhost:5011{user.ImageUrl}"  // ⭐ Add full URL
            : null;

            return new AuthResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                User = new UserData
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = user.Role,
                    Name = user.Name,
                    ImageUrl = imageUrl,
                    Bio = user.Bio ?? ""
                }
            };
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return new AuthResponse { Success = false, Message = "Email already exists" };
            }

            var newUser = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                Name = request.Name,
                Bio = null,
                ImageUrl = null
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Log activity
            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = newUser.Id,
                ActionType = "USER_REGISTERED",
                Title = "New user registered",
                Description = $"{newUser.Name} ({newUser.Role}) created an account."
            });
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(newUser);

            return new AuthResponse
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                User = new UserData
                {
                    Id = newUser.Id,
                    Email = newUser.Email,
                    Role = newUser.Role,
                    Name = newUser.Name,
                    ImageUrl = newUser.ImageUrl,
                    Bio = newUser.Bio
                }
            };
        }


    }
}