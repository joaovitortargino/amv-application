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

  expireSession() {
    this.clearTokens();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      sessionStorage.setItem("sessionExpired", "true");
      window.location.replace("/login");
    }
  }

  async ensureValidToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    if (!this.isJwtExpired(token)) return true;

    const refreshedToken = await this.handleRefreshToken();
    if (refreshedToken) return true;

    this.expireSession();
    return false;
  }

  async getAuthHeaders(): Promise<HeadersInit> {
    const validSession = await this.ensureValidToken();
    if (!validSession) {
      this.expireSession();
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    return { Authorization: `Bearer ${this.getToken()}` };
  }

  handleUnauthorizedResponse(response: Response): boolean {
    if (response.status !== 401) {
      return false;
    }

    this.expireSession();
    return true;
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
      } catch {
        this.clearTokens();
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
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    let token = this.getToken();
    if (token && this.isJwtExpired(token)) {
      token = await this.handleRefreshToken();
      if (!token) {
        this.expireSession();
        throw new Error("Sessão expirada. Faça login novamente.");
      }
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const newToken = await this.handleRefreshToken();

      if (newToken) {
        const newHeaders = new Headers(headers);
        newHeaders.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          ...options,
          headers: newHeaders,
        });
      } else {
        this.expireSession();
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

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private isJwtExpired(token: string, skewMs = 30000): boolean {
    const expiration = this.getJwtExpiration(token);
    return expiration !== null && expiration <= Date.now() + skewMs;
  }

  private getJwtExpiration(token: string): number | null {
    try {
      if (typeof window === "undefined") return null;
      const payload = token.split(".")[1];
      if (!payload) return null;
      const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
      const paddedPayload = normalizedPayload.padEnd(
        Math.ceil(normalizedPayload.length / 4) * 4,
        "=",
      );
      const json = JSON.parse(window.atob(paddedPayload));
      return typeof json.exp === "number" ? json.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
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
