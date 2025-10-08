using System.Text;
using Amazon;
using Amazon.Runtime;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Thesis_backend.Database;
using Thesis_backend.Services;
using Thesis_backend.Services.Interfaces;
using Thesis_backend.Utility;
using Amazon.S3;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// JwtSettings from JwtSettings.cs and appsettings.json
/*
 * builder.Services.Configure<JwtSettings>... binds the appsettings.txt section to a strongly
 * typed JwtSettings.cs class. This let's you inject IOptions<JwtSettings> into services,
 * controllers etc
 */
builder.Services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));

// AWS
builder.Services.AddAWSService<IAmazonS3>();

var awsOptions = builder.Configuration.GetSection("AWS");
var credentials = new BasicAWSCredentials(awsOptions["AccessKey"], awsOptions["SecretKey"]);
builder.Services.AddSingleton<IAmazonS3>(sp => new AmazonS3Client(credentials, RegionEndpoint.GetBySystemName(awsOptions["Region"])));



/*
 * This directly fetches and maps the JwtSettings section from appsettings.json into
 * a new JwtSettings object instance. This let's us call it, like jwtsettings.Issuer
 */
var jwtsettings = configuration.GetSection("JwtSettings").Get<JwtSettings>();

// Add services to the container.
builder.Services.AddSwaggerGen(); // For Swagger
builder.Services.AddControllers() // For Controllers
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    }); // Handles cycles; Prevents Circular reference errors when dealing with relationships in models
builder.Services.AddDbContext<AppDbContext>(); // For AppDbContext.cs, context for database connection

builder.Services.AddScoped<IUsersService, UsersService>();
builder.Services.AddScoped<IDocumentsService, DocumentsService>();
builder.Services.AddScoped<ISpendingCategoriesService, SpendingCategoriesService>();

//Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:5173") //Frontend URL
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // For cookies and authorization headers
    });
});

// For JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtsettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtsettings.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtsettings.SecretKey)),
            ClockSkew = TimeSpan.Zero //Prevents token expiration time leeway
        };
        
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("Token validated successfully");
                return Task.CompletedTask;
            }
        };
    });

//This forces a requirement for all endpoints to include JWT validation
builder.Services.AddAuthorization(options => 
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser() //<--- Specifically this is the requirement
        .Build();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

//Applying CORS MiddLeware
app.UseRouting();
app.UseCors("AllowSpecificOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();