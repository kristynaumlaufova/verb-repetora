using BE.Data;
using BE.Controllers;
using BE.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Get the connection string from appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register LanguageController as a service
builder.Services.AddScoped<LanguageController>();

// Configure Identity
builder.Services.AddIdentity<AppUser, IdentityRole<int>>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;

    // User settings
    options.User.RequireUniqueEmail = false;
    options.SignIn.RequireConfirmedEmail = false;
})

.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.ExpireTimeSpan = TimeSpan.FromHours(4);
    options.SlidingExpiration = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    // Custom redirection for unauthorized or logged out users
    options.LoginPath = "/login";
    options.LogoutPath = "/logout";
    options.AccessDeniedPath = "/login";

    // Cookie events
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api") &&
            context.Response.StatusCode == 200)
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.SetIsOriginAllowed(_ => true) // Allow any origin in development
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "VerbRepetora API",
        Version = "v1",
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VerbRepetora API V1");
        c.RoutePrefix = "swagger";
    });
}

// Configure static files
var staticFileOptions = new StaticFileOptions
{
    ServeUnknownFileTypes = true
};

// Configure default files
var defaultFilesOptions = new DefaultFilesOptions();
defaultFilesOptions.DefaultFileNames.Clear();
defaultFilesOptions.DefaultFileNames.Add("index.html");

app.UseRouting();

// Configure CORS before authentication
app.UseCors(options => options
    .WithOrigins("http://localhost:3000")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());

// In development, don't force HTTPS
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles(defaultFilesOptions);
app.UseStaticFiles(staticFileOptions);

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map API controllers
app.MapControllers();

// Apply migrations at startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogInformation("Starting database migration...");
        await context.Database.MigrateAsync();
        logger.LogInformation("Database migration completed successfully.");

        // Initialize role manager
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
        if (!await roleManager.RoleExistsAsync("User"))
        {
            logger.LogInformation("Creating 'User' role...");
            await roleManager.CreateAsync(new IdentityRole<int>("User"));
            logger.LogInformation("'User' role created successfully.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database or initializing roles.");
        throw; // Rethrow the exception to prevent the application from starting with an incomplete database
    }
}

app.Run();
