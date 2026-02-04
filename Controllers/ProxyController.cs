using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;

namespace RtoVehicalDetails.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProxyController(ILogger<ProxyController> logger, IHttpClientFactory clientFactory) : ControllerBase
    {

        [HttpPost("request")]
        public async Task<IActionResult> ProxyRequest([FromBody] ApiRequestModel request)
        {
            var sw = Stopwatch.StartNew();

            if (string.IsNullOrWhiteSpace(request.Url))
            {
                return BadRequest(new
                {
                    success = false,
                    status = 400,
                    statusText = "Bad Request",
                    headers = new Dictionary<string, string>(),
                    data = new { error = "Url is required" },
                    duration = (int)(double)0
                });
            }

            if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var targetUri) ||
                (targetUri.Scheme != Uri.UriSchemeHttp && targetUri.Scheme != Uri.UriSchemeHttps))
            {
                return BadRequest(new
                {
                    success = false,
                    status = 400,
                    statusText = "Bad Request",
                    headers = new Dictionary<string, string>(),
                    data = new { error = "Url must be absolute and use http or https" },
                    duration = 0
                });
            }

            var method = new HttpMethod(request.Method?.Trim().ToUpperInvariant() ?? HttpMethod.Get.Method);

            var incomingHeaders = request.Headers ??
                                  new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            // Safe logging (redact secrets)
            try
            {
                logger.LogInformation("Proxy Request: {Method} {Url}", method, targetUri);
                logger.LogInformation("Headers: {Headers}",
                    JsonSerializer.Serialize(RedactHeaders(incomingHeaders)));
                var bodyPreview = request.GetBodyAsString();
                if (!string.IsNullOrEmpty(bodyPreview))
                {
                    var preview = bodyPreview.Length > 4096
                        ? bodyPreview[..4096] + "…(truncated)"
                        : bodyPreview;
                    logger.LogInformation("Body (preview): {Body}", preview);
                }
            }
            catch
            {
                // never let logging crash the request
            }

            var proxyClient = clientFactory.CreateClient("ProxyClient");
            var directClient = clientFactory.CreateClient("DirectClient");
            var timeout = TimeSpan.FromSeconds(request.Timeout.GetValueOrDefault(30));
            proxyClient.Timeout = timeout;
            directClient.Timeout = timeout;

            // Build reusable material for creating fresh HttpRequestMessage on each send
            var contentType = incomingHeaders.TryGetValue("Content-Type", out var ct) && !string.IsNullOrWhiteSpace(ct)
                ? ct
                : "application/x-www-form-urlencoded";
            var bodyString = MethodSupportsBody(method) ? request.GetBodyAsString() : string.Empty;

            HttpResponseMessage response;

            // Local factory to create a fresh request each attempt
            HttpRequestMessage BuildMessage()
            {
                var msg = new HttpRequestMessage(method, targetUri);

                if (!string.IsNullOrEmpty(bodyString) && MethodSupportsBody(method))
                {
                    msg.Content = new StringContent(bodyString, Encoding.UTF8, contentType);
                }

                foreach (var kvp in incomingHeaders)
                {
                    if (string.IsNullOrWhiteSpace(kvp.Key)) continue;
                    if (IsRestrictedHeader(kvp.Key)) continue;
                    if (kvp.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase)) continue;

                    if (!msg.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value) && msg.Content != null)
                    {
                        msg.Content.Headers.TryAddWithoutValidation(kvp.Key, kvp.Value);
                    }
                }

                return msg;
            }

            try
            {
                using var msg = BuildMessage();
                response = await directClient.SendAsync(
                    msg,
                    HttpCompletionOption.ResponseContentRead,
                    HttpContext.RequestAborted);
            }
            catch (OperationCanceledException oce) when (HttpContext.RequestAborted.IsCancellationRequested)
            {
                var duration = sw.Elapsed.TotalMilliseconds;
                logger.LogWarning(oce, "Proxy request canceled by client");
                return StatusCode(499, new
                {
                    success = false,
                    status = 499,
                    statusText = "Client Closed Request",
                    headers = new Dictionary<string, string>(),
                    data = new { error = "Canceled" },
                    duration
                });
            }
            catch (Exception ex) when (ShouldFallbackToDirect(ex))
            {
                logger.LogWarning(ex, "Send via proxy failed; retrying without proxy.");

                using var msg2 = BuildMessage();
                response = await directClient.SendAsync(
                    msg2,
                    HttpCompletionOption.ResponseContentRead,
                    HttpContext.RequestAborted);
            }
           
            using (response)
            {
                var responseContent = await response.Content.ReadAsStringAsync(HttpContext.RequestAborted);
                var responseHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var h in response.Headers) responseHeaders[h.Key] = string.Join(", ", h.Value);
                foreach (var h in response.Content.Headers) responseHeaders[h.Key] = string.Join(", ", h.Value);

                var resContentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
                var duration = sw.Elapsed.TotalMilliseconds;

                if ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400)
                {
                    var location = response.Headers.Location?.ToString();
                    if (!string.IsNullOrEmpty(location))
                    {
                        logger.LogWarning("Redirect detected to {Location}, preserving original method {Method}",
                            location, method);
                    }
                }

                if (!resContentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
                {
                    return Ok(new
                    {
                        success = response.IsSuccessStatusCode,
                        status = (int)response.StatusCode,
                        statusText = response.StatusCode.ToString(),
                        headers = responseHeaders,
                        data = responseContent,
                        url = response.RequestMessage?.RequestUri?.ToString(),
                        duration
                    });
                }

                try
                {
                    using var jsonDoc = JsonDocument.Parse(responseContent);
                    return Ok(new
                    {
                        success = response.IsSuccessStatusCode,
                        status = (int)response.StatusCode,
                        statusText = response.StatusCode.ToString(),
                        headers = responseHeaders,
                        data = jsonDoc.RootElement.Clone(),
                        url = response.RequestMessage?.RequestUri?.ToString(),
                        duration
                    });
                }
                catch (JsonException)
                {
                    return Ok(new
                    {
                        success = response.IsSuccessStatusCode,
                        status = (int)response.StatusCode,
                        statusText = response.StatusCode.ToString(),
                        headers = responseHeaders,
                        data = responseContent,
                        url = response.RequestMessage?.RequestUri?.ToString(),
                        duration
                    });
                }
            }
        }



        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "OK", timestamp = DateTime.UtcNow });
        }


        private static bool MethodSupportsBody(HttpMethod method) =>
            method == HttpMethod.Post ||
            method == HttpMethod.Put ||
            method == HttpMethod.Patch ||
            method == HttpMethod.Delete;

        private static bool IsRestrictedHeader(string headerName) =>
            headerName.Equals("Host", StringComparison.OrdinalIgnoreCase) ||
            headerName.Equals("Content-Length", StringComparison.OrdinalIgnoreCase) ||
            headerName.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase) ||
            headerName.Equals("Connection", StringComparison.OrdinalIgnoreCase);

        private static IDictionary<string, string> RedactHeaders(IDictionary<string, string> headers)
        {
            var copy = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in headers)
            {
                if (IsSensitiveHeader(kvp.Key))
                {
                    copy[kvp.Key] = "[REDACTED]";
                }
                else
                {
                    copy[kvp.Key] = kvp.Value;
                }
            }
            return copy;
        }

        private static bool IsSensitiveHeader(string name) =>
            name.Equals("Authorization", StringComparison.OrdinalIgnoreCase) ||
            name.Equals("Proxy-Authorization", StringComparison.OrdinalIgnoreCase) ||
            name.Equals("Cookie", StringComparison.OrdinalIgnoreCase) ||
            name.Equals("Set-Cookie", StringComparison.OrdinalIgnoreCase);

        private static bool ShouldFallbackToDirect(Exception ex)
        {
            // Never fallback on client cancellation
            if (ex is OperationCanceledException) return false;

            // Common proxy/network path failures
            return ex is HttpRequestException
                   || ex is IOException
                   || ex is SocketException;
        }
    }

    public class ApiRequestModel
    {
        public string Url { get; set; } = string.Empty;
        public string? Method { get; set; } = "GET";
        public Dictionary<string, string>? Headers { get; set; }
        public object? Body { get; set; }
        public int? Timeout { get; set; } = 30;
        public string GetBodyAsString()
        {
            return Body switch
            {
                null => string.Empty,
                JsonElement { ValueKind: JsonValueKind.String } jsonElement => jsonElement.GetString() ??
                                                                               string.Empty,
                string stringBody => stringBody,
                _ => JsonSerializer.Serialize(Body)
            };
        }
    }
}
