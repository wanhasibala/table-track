import { sessionExpired } from "./session-expired";
import { jwt } from "./jwt";
import Cookies from "js-cookie";

export type User = {
  id: string;
  login?: string;
  name?: string;
  email?: string;
  username?: string;
  employee?: {
    id: string;
    name: string;
  };
  roles?: {
    id: string;
    name: string;
  }[];
};
export type Warehouse = {
  id: string;
  name: string;
};
export type Role = {
  id: string;
  name: string;
};

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  role: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    token: null,
    refreshToken: null,
    user: null,
    role: null,
    client: null,
  };

  private constructor() {
    // Initialize from storage on startup
    if (typeof window !== "undefined") {
      const token = Cookies.get("token");
      const refreshToken = localStorage.getItem("refreshToken") || null;
      const userStr = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      const client = localStorage.getItem("client");

      if (token && !jwt.isExpired(token)) {
        this.authState.token = token;
        this.authState.refreshToken = refreshToken;
        this.authState.user = userStr ? JSON.parse(userStr) : null;
        this.authState.role = role ? JSON.parse(role) : null;
        this.authState.client = client ? JSON.parse(client) : null;
      } else if (refreshToken) {
        // No valid access token but we have a refresh token — keep it and try refreshing in background
        this.authState.refreshToken = refreshToken;
        this.authState.user = userStr ? JSON.parse(userStr) : null;
        this.authState.role = role ? JSON.parse(role) : null;
        this.authState.client = client ? JSON.parse(client) : null;
        // Attempt background refresh (don't await in constructor)
        this.refreshTokens().catch(() => {});
      } else {
        // No tokens available
        this.logout();
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  setToken(token: string, refreshToken?: string) {
    // Only set token if it's not expired
    if (!jwt.isExpired(token)) {
      this.authState.token = token;
      const expire_date = jwt.getExpirationDate(token);
      Cookies.set("token", token, {
        expires: new Date(expire_date || new Date()),
      });

      if (refreshToken) {
        this.authState.refreshToken = refreshToken;
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
      return true;
    }
    return false;
  }

  setUser(user: User) {
    this.authState.user = user;
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  setRole(role: Role) {
    this.authState.role = role;
    if (typeof window !== "undefined") {
      localStorage.setItem("role", JSON.stringify(role));
    }
  }
  setClient(client: { id: string; name: string }) {
    this.authState.client = client;
    if (typeof window !== "undefined") {
      localStorage.setItem("client", JSON.stringify(client));
    }
  }

  getToken(): string | null {
    const token = this.authState.token;
    if (token && !jwt.isExpired(token)) {
      return token;
    }
    // Clear expired tokens
    this.logout();
    return null;
  }

  getRefreshToken(): string | null {
    return this.authState.refreshToken;
  }

  async refreshTokens(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://eam-api.avolut.com"}/api/v1/users/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      const data = await response.json();

      if (data.status && data.data?.access_token) {
        this.setToken(data.data.access_token, data.data.refresh_token);
        return true;
      }

      throw new Error("Invalid refresh response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.logout();
      return false;
    }
  }

  getUser(): User | null {
    // Return user only if we have a valid token and we're on the client side
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");

    return this.getToken() ? JSON.parse(user || "{}") : null;
  }
  getWarehouse(): Warehouse | null {
    // Return warehouse only if we have a valid token and we're on the client side
    if (typeof window === "undefined") return null;
    const warehouse = localStorage.getItem("warehouse");
    return this.getToken() ? JSON.parse(warehouse || "{}") : null;
  }
  getRole(): Role | null {
    // Return role only if we have a valid token and we're on the client side
    if (typeof window === "undefined") return null;
    const role = localStorage.getItem("role");
    return this.getToken() ? JSON.parse(role || "{}") : null;
  }
  getClient(): { id: string | null; name: string | null } {
    if (typeof window === "undefined") return { id: null, name: null };
    const client = localStorage.getItem("id_client");
    return this.getToken()
      ? JSON.parse(client || "{}")
      : { id: null, name: null };
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getTokenExpirationDate(): Date | null {
    const token = Cookies.get("token");
    return token ? jwt.getExpirationDate(token) : null;
  }

  logout() {
    this.authState = {
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      client: null,
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("id_client");
      localStorage.clear();
      localStorage.removeItem("refreshToken");
    }
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    Cookies.remove("menuData");
  }

  /**
   * Clear all auth state and redirect to the login page.
   * Safe to call from client-side code (RTK Query interceptors, etc.).
   * Avoids redundant redirects if we're already on /auth/login.
   */
  logoutAndRedirect() {
    this.logout();
    if (typeof window !== "undefined") {
      sessionExpired.notify();
    }
  }
}

export const auth = AuthService.getInstance();
