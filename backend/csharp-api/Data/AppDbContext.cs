using Microsoft.EntityFrameworkCore;
using PlantSystem.API.Models;

namespace PlantSystem.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Plant> Plants { get; set; }
        public DbSet<Disease> Diseases { get; set; }
        public DbSet<QuizResult> QuizResults { get; set; }
        public DbSet<QuizResultDetail> QuizResultDetails { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<QuizQuestion> QuizQuestions { get; set; }
        public DbSet<LearningMaterial> LearningMaterials { get; set; }
        public DbSet<Bookmark> Bookmarks { get; set; }
        public DbSet<ScanResult> ScanResults { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Navigation/Relationship config for custom quizzes:
            modelBuilder.Entity<Quiz>()
                .HasOne(q => q.Creator)
                .WithMany()
                .HasForeignKey(q => q.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<QuizQuestion>()
                .HasOne(qq => qq.Quiz)
                .WithMany(q => q.Questions)
                .HasForeignKey(qq => qq.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Bookmark>()
                .HasIndex(b => new { b.UserId, b.ItemType, b.ItemId })
                .IsUnique();
        }

    }

}