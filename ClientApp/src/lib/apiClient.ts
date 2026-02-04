interface ApiRequest
{
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

class ApiClient
{
    private baseUrl: string;

    constructor()
    {
        this.baseUrl = '/api/Proxy';
    }

    async makeRequest<TResponse>(
        request: ApiRequest
    ): Promise<TResponse>
    {
        try
        {
            const response = await fetch(`${this.baseUrl}/request`, {
                method: request.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const result = await response.json();

            if (!response.ok)
            {
                throw new Error(
                    result?.message ||
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            return result as TResponse;
        } catch (error)
        {
            console.error('API Client Error:', error);
            throw error;
        }
    }

    async get<T>(url: string, headers?: Record<string, string>)
    {
        return this.makeRequest<T>({
            url,
            method: 'GET',
            headers,
        });
    }

    async post<T>(
        url: string,
        body?: unknown,
        headers?: Record<string, string>
    )
    {
        return this.makeRequest<T>({
            url,
            method: 'POST',
            body,
            headers,
        });
    }

    async put<T>(
        url: string,
        body?: unknown,
        headers?: Record<string, string>
    )
    {
        return this.makeRequest<T>({
            url,
            method: 'PUT',
            body,
            headers,
        });
    }

    async delete<T>(url: string, headers?: Record<string, string>)
    {
        return this.makeRequest<T>({
            url,
            method: 'DELETE',
            headers,
        });
    }
}

export const apiClient = new ApiClient();
export type { ApiRequest };