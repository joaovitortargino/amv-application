const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  
  private refreshPromise: Promise<string | null> | null = null;

  setTokens(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem("refreshToken");
    }
    return this.refreshToken;
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }

  private async handleRefreshToken(): Promise<string | null> {
    const currentRefreshToken = this.getRefreshToken();
    if (!currentRefreshToken) return null;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });

        if (!response.ok) throw new Error("Falha ao renovar token");

        const data = await response.json();
        
        this.setTokens(data.token, data.refreshToken); 
        return data.token;
      } catch (error) {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const newToken = await this.handleRefreshToken();

      if (newToken) {
        const newHeaders = { ...headers, "Authorization": `Bearer ${newToken}` };
        response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          ...options,
          headers: newHeaders,
        });
      } else {
        this.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Sessão expirada. Faça login novamente.");
      }
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Request failed",
      }));
      throw new Error(
        error.message || `HTTP Error! Status: ${response.status}`,
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }
  
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiService = new ApiService();