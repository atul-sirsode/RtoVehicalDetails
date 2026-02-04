using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using RtoVehicalDetails.Services;
using System.Net;
using System.Security.Authentication;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;

});




builder.Services.AddMemoryCache();

builder.Services.AddControllers();
builder.Services.AddHttpClient();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IRcVerification, RcVerification>();
builder.Services.Configure<ProxyOptions>(builder.Configuration.GetSection("Proxy"));
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient("ProxyClient")
    .ConfigurePrimaryHttpMessageHandler(sp =>
    {
        var opts = sp.GetRequiredService<IOptions<ProxyOptions>>().Value;

        var handler = new HttpClientHandler
        {
            AllowAutoRedirect = opts.AllowAutoRedirect
        };

        if (opts.Enabled && !string.IsNullOrWhiteSpace(opts.Address))
        {
            var proxy = new WebProxy
            {
                Address = new Uri(opts.Address),
                BypassProxyOnLocal = opts.BypassProxyOnLocal,
                UseDefaultCredentials = opts.UseDefaultCredentials
            };

            if (!opts.UseDefaultCredentials && !string.IsNullOrWhiteSpace(opts.Username))
            {
                proxy.Credentials = string.IsNullOrWhiteSpace(opts.Domain)
                    ? new NetworkCredential(opts.Username, opts.Password)
                    : new NetworkCredential(opts.Username, opts.Password, opts.Domain);
            }

            handler.Proxy = proxy;
            handler.UseProxy = true;
            handler.PreAuthenticate = true;
        }

        if (opts.AllowInsecureCertificates)
        {
            handler.ServerCertificateCustomValidationCallback =
                HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }

        handler.SslProtocols =
            (opts.UseTls12 ? SslProtocols.Tls12 : 0) |
            (opts.UseTls13 ? SslProtocols.Tls13 : 0);

        return handler;
    });

builder.Services.AddHttpClient("DirectClient")
    .ConfigurePrimaryHttpMessageHandler(sp =>
    {
        var opts = sp.GetRequiredService<IOptions<ProxyOptions>>().Value;

        var handler = new HttpClientHandler
        {
            AllowAutoRedirect = opts.AllowAutoRedirect,
            UseProxy = false,     // <— no proxy
            Proxy = null
        };

        if (opts.AllowInsecureCertificates)
        {
            handler.ServerCertificateCustomValidationCallback =
                HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }

        handler.SslProtocols =
            (opts.UseTls12 ? SslProtocols.Tls12 : 0) |
            (opts.UseTls13 ? SslProtocols.Tls13 : 0);

        return handler;
    });
// Program.cs registration
builder.Services.AddHttpClient("VerifyA2Z", client =>
{
    client.BaseAddress = new Uri("https://api.verifya2z.com/");

    client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "*/*");

    client.DefaultRequestHeaders.TryAddWithoutValidation(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36");

    client.DefaultRequestHeaders.TryAddWithoutValidation(
        "Referer",
        "https://localhost/");

    client.DefaultRequestHeaders.TryAddWithoutValidation(
        "Accept-Language",
        "en-US,en;q=0.9");
})
.ConfigurePrimaryHttpMessageHandler(() =>
{
    return new HttpClientHandler
    {
        UseCookies = true,
        AutomaticDecompression =
            DecompressionMethods.GZip |
            DecompressionMethods.Deflate |
            DecompressionMethods.Brotli,

        AllowAutoRedirect = true
    };
});
var app = builder.Build();
app.MapPost("/login_otp", async (LoginRequest loginDetails, IRcVerification request) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(loginDetails.username) || string.IsNullOrWhiteSpace(loginDetails.password))
            return Results.BadRequest(new { error = "username and password are required" });

        Console.WriteLine($"Attempting to get token for ClientId: {loginDetails.username}");

        var tokenResponse = await request.GetLoginDetails(
            loginDetails.username,
            loginDetails.password
        );

        return Results.Json(tokenResponse);
    }
    catch (HttpRequestException ex) when (ex.StatusCode.HasValue)
    {
        // Return the actual HTTP status code from the upstream service
        var statusCode = (int)ex.StatusCode.Value;
        Console.WriteLine($"Token request failed with status {statusCode}: {ex.Message}");

        return Results.Json(
            new
            {
                error = "Token request failed",
                statusCode,
                message = ex.Message,
                detail = "Check token endpoint configuration"
            },
            statusCode: statusCode
        );
    }
    catch (TokenEndpointException ex)
    {
        // Custom exception with status code
        Console.WriteLine($"Token endpoint error {ex.StatusCode}: {ex.Message}");

        return Results.Json(
            new
            {
                error = "Token endpoint error",
                statusCode = ex.StatusCode,
                message = ex.Message,
                responseBody = ex.ResponseBody
            },
            statusCode: ex.StatusCode
        );
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Unexpected error: {ex.Message}");
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "Internal Server Error"
        );
    }

});

app.MapPost("/login_verify_otp", async (VerifyOtpRequest loginDetails, IRcVerification request) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(loginDetails.username) || string.IsNullOrWhiteSpace(loginDetails.password) || string.IsNullOrEmpty(loginDetails.otp))
            return Results.BadRequest(new { error = "username and password or otp are required" });

        Console.WriteLine($"Attempting to get token for ClientId: {loginDetails.username}");

        var tokenResponse = await request.GetVerifyOtpDetails(
            loginDetails.username,
            loginDetails.password, loginDetails.otp
        );

        return Results.Json(tokenResponse);
    }
    catch (HttpRequestException ex) when (ex.StatusCode.HasValue)
    {
        // Return the actual HTTP status code from the upstream service
        var statusCode = (int)ex.StatusCode.Value;
        Console.WriteLine($"Token request failed with status {statusCode}: {ex.Message}");

        return Results.Json(
            new
            {
                error = "Token request failed",
                statusCode,
                message = ex.Message,
                detail = "Check token endpoint configuration"
            },
            statusCode: statusCode
        );
    }
    catch (TokenEndpointException ex)
    {
        // Custom exception with status code
        Console.WriteLine($"Token endpoint error {ex.StatusCode}: {ex.Message}");

        return Results.Json(
            new
            {
                error = "Token endpoint error",
                statusCode = ex.StatusCode,
                message = ex.Message,
                responseBody = ex.ResponseBody
            },
            statusCode: ex.StatusCode
        );
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Unexpected error: {ex.Message}");
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "Internal Server Error"
        );
    }

});
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");


app.MapFallbackToFile("index.html");

app.Run();
