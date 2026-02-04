using System.Net.Http.Headers;

namespace RtoVehicalDetails.Services
{
    public class ProxyOptions
    {
        public bool Enabled { get; set; } = false;
        public string? Address { get; set; } // e.g., http://proxy-aus.example.com:80
        public bool BypassProxyOnLocal { get; set; } = true;
        public bool UseDefaultCredentials { get; set; } = false;
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Domain { get; set; }
        public bool AllowInsecureCertificates { get; set; } = false;
        public bool UseTls12 { get; set; } = true;
        public bool UseTls13 { get; set; } = true;
        public bool AllowAutoRedirect { get; set; } = false;
    }
    public class TokenEndpointException(int statusCode, string responseBody, string message) : Exception(message)
    {
        public int StatusCode { get; } = statusCode;
        public string ResponseBody { get; } = responseBody;
    }
    public record LoginRequest(string username, string password);
    public record VerifyOtpRequest(string username, string password, string otp);
    public interface IRcVerification
    {
        Task<dynamic> GetLoginDetails(string username, string password, CancellationToken ct = default);
        Task<dynamic> GetVerifyOtpDetails(string username, string password, string otp, CancellationToken ct = default);
    }
    public class RcVerification(IHttpClientFactory httpClient) : IRcVerification
    {
        
        public async Task<dynamic> GetLoginDetails(string username, string password, CancellationToken ct = default)
        {

            var form = new Dictionary<string, string>
            {
                ["username"] = username,
                ["password"] = password
            };

            using var content = new FormUrlEncodedContent(form);

        

            var client = httpClient.CreateClient("VerifyA2Z");
            var req = new HttpRequestMessage(HttpMethod.Post, "api/v1/login_otp")
            {
                Content = content
            };

            req.Headers.TryAddWithoutValidation("Accept", "*/*");

            req.Headers.TryAddWithoutValidation(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36");

            req.Headers.Referrer =
                new Uri("https://rc-data-dash.lovable.app/");

            req.Headers.TryAddWithoutValidation(
                "Origin",
                "https://rc-data-dash.lovable.app");

            req.Headers.TryAddWithoutValidation(
                "Accept-Language",
                "en-US,en;q=0.9");

            var res = await client.SendAsync(req, ct);
            return res;
        }

        public async Task<dynamic> GetVerifyOtpDetails(string username, string password, string otp, CancellationToken ct = default)
        {
            var form = new Dictionary<string, string>
            {
                ["username"] = username,
                ["password"] = password,
                ["otp"]=otp
            };

            using var content = new FormUrlEncodedContent(form);



            var client = httpClient.CreateClient("VerifyA2Z");
            var res = await client.PostAsync("api/v1/login_verify_otp", content, ct);

            var body = await res.Content.ReadAsStringAsync();
            return body;
        }
    }
}
