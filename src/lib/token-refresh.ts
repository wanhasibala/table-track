import { auth } from "./auth";
import { activityTracker } from "./activity-tracker";

interface RefreshTokenResponse {
  success: boolean;
  status: boolean;
  messages: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
}

class TokenRefreshService {
  private static instance: TokenRefreshService;
  private refreshPromise: Promise<boolean> | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  private constructor() {}

  public static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }
    return TokenRefreshService.instance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async refreshToken(retryCount = 0): Promise<boolean> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh(retryCount);
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async _performRefresh(retryCount = 0): Promise<boolean> {
    const refreshToken = auth.getRefreshToken();

    if (!refreshToken) {
      console.warn("No refresh token available");
      auth.logoutAndRedirect();
      return false;
    }

    try {
      // Try using the local API route first (for better CORS handling)
      const apiUrl =
        typeof window !== "undefined"
          ? "/api/auth/refresh"
          : `${process.env.NEXT_PUBLIC_API_URL || "https://eam-api.avolut.com"}/api/v1/users/refresh`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RefreshTokenResponse = await response.json();

      if (data.status && data.data?.access_token) {
        auth.setToken(data.data.access_token, data.data.refresh_token);
        console.log("Token refreshed successfully");
        return true;
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      console.error(`Token refresh failed (attempt ${retryCount + 1}):`, error);

      // Retry logic with exponential backoff
      if (retryCount < this.maxRetries - 1) {
        const delayMs = this.retryDelay * Math.pow(2, retryCount);
        console.log(`Retrying token refresh in ${delayMs}ms...`);
        await this.delay(delayMs);
        return this._performRefresh(retryCount + 1);
      }

      // All retries failed
      console.error("All token refresh attempts failed, logging out");
      auth.logoutAndRedirect();

      return false;
    }
  }

  async ensureValidToken(): Promise<string | null> {
    let token = auth.getToken();

    if (!token) {
      // Try to refresh if no valid token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        token = auth.getToken();
      }
    }

    return token;
  }

  // Method to check if token is about to expire (within 5 minutes)
  isTokenNearExpiry(): boolean {
    const token = auth.getToken();
    if (!token) return false;

    try {
      const [, payloadBase64] = token.split(".");
      const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      if (!payload.exp) return true;

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const fiveMinutesFromNow = currentTime + 5 * 60 * 1000;

      return expirationTime <= fiveMinutesFromNow;
    } catch {
      return true;
    }
  }

  // Proactively refresh token if it's about to expire
  async refreshIfNeeded(): Promise<void> {
    if (!this.isTokenNearExpiry()) {
      return;
    }

    const idleThresholdMs = 60 * 60 * 1000;
    if (activityTracker.isIdle(idleThresholdMs)) {
      return;
    }

    await this.refreshToken();
  }
}

export const tokenRefreshService = TokenRefreshService.getInstance();

// Auto-refresh token when it's close to expiring
if (typeof window !== "undefined") {
  // Check every 2 minutes if token needs refresh
  setInterval(
    () => {
      tokenRefreshService.refreshIfNeeded();
    },
    2 * 60 * 1000,
  );
}
