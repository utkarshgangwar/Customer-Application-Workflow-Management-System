import Cookies from "js-cookie";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Request & Error Middleware Type Definitions
type RequestMiddleware = (config: {
  endpoint: string;
  options: RequestInit;
}) =>
  | { endpoint: string; options: RequestInit }
  | Promise<{ endpoint: string; options: RequestInit }>;

type ErrorMiddleware = (error: ApiError) => Promise<never> | never | void;

// Middlewares
const requestMiddlewares: RequestMiddleware[] = [];
const errorMiddlewares: ErrorMiddleware[] = [];

export function useRequestMiddleware(middleware: RequestMiddleware) {
  requestMiddlewares.push(middleware);
}

export function useErrorMiddleware(middleware: ErrorMiddleware) {
  errorMiddlewares.push(middleware);
}

// 1. Default Request Middleware: Append Headers & Auth Token
useRequestMiddleware(({ endpoint, options }) => {
  const token = typeof window !== "undefined" ? Cookies.get("token") : null;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return {
    endpoint,
    options: {
      ...options,
      headers,
    },
  };
});

// 2. Default Error Middleware: Global HTTP Status Dispatcher
useErrorMiddleware((error) => {
  switch (error.statusCode) {
    case 400:
      console.warn("[API 400 Bad Request]:", error.message);
      break;
    case 403:
      console.error("[API 403 Forbidden]: Insufficient permissions.");
      break;
    case 404:
      console.warn("[API 404 Not Found]:", error.message);
      break;
    case 409:
      console.warn("[API 409 Conflict]: State version mismatch.");
      break;
    case 500:
    case 502:
    case 503:
      console.error(
        "[API 5xx Server Failure]: Internal server error occurred.",
      );
      break;
  }
});

// Token Refresh Locking Mechanisms
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function logoutAndRedirect() {
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  Cookies.remove("user");
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data.data?.accessToken || data.accessToken;
    const newRefreshToken = data.data?.refreshToken || data.refreshToken;

    if (newAccessToken) {
      Cookies.set("token", newAccessToken, { expires: 1 });
      if (newRefreshToken) {
        Cookies.set("refreshToken", newRefreshToken, { expires: 7 });
      }
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

// Core Client Executor
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // Execute Request Middlewares
  let reqConfig = { endpoint, options };
  for (const middleware of requestMiddlewares) {
    reqConfig = await middleware(reqConfig);
  }

  try {
    const res = await fetch(
      `${BASE_URL}${reqConfig.endpoint}`,
      reqConfig.options,
    );

    // 401 Unauthorized Interceptor & Token Refresh
    if (res.status === 401 && !reqConfig.endpoint.startsWith("/auth")) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshed(newToken);
          const retryHeaders = new Headers(reqConfig.options.headers);
          retryHeaders.set("Authorization", `Bearer ${newToken}`);

          const retryRes = await fetch(`${BASE_URL}${reqConfig.endpoint}`, {
            ...reqConfig.options,
            headers: retryHeaders,
          });

          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            throw new ApiError(
              retryData.message || "Request failed",
              retryRes.status,
              retryData,
            );
          }
          return retryData;
        } else {
          logoutAndRedirect();
          throw new ApiError("Session expired. Please log in again.", 401);
        }
      }

      // Queue concurrent requests while token refreshes
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken: string) => {
          try {
            const retryHeaders = new Headers(reqConfig.options.headers);
            retryHeaders.set("Authorization", `Bearer ${newToken}`);

            const retryRes = await fetch(`${BASE_URL}${reqConfig.endpoint}`, {
              ...reqConfig.options,
              headers: retryHeaders,
            });

            const retryData = await retryRes.json();
            if (!retryRes.ok)
              throw new ApiError(retryData.message, retryRes.status, retryData);
            resolve(retryData);
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new ApiError(
        data.message ||
          data.error?.message ||
          "An unexpected operational error occurred.",
        res.status,
        data,
      );

      // Run Error Middlewares
      for (const errMw of errorMiddlewares) {
        errMw(error);
      }

      throw error;
    }

    return data;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    const networkError = new ApiError(
      err.message || "Network communication failure",
      0,
    );
    for (const errMw of errorMiddlewares) {
      errMw(networkError);
    }
    throw networkError;
  }
}
