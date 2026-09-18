const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Render free tier cold starts can take 30-60s
const REQUEST_TIMEOUT = 30000;
const COLD_START_RETRY_TIMEOUT = 60000;

export async function api<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("token");

  if (!navigator.onLine) {
    throw new Error("You appear to be offline. Please check your internet connection.");
  }

  const makeRequest = async (timeout: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
          ...(options?.headers || {}),
        },
        ...options,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    let response: Response;
    try {
      response = await makeRequest(REQUEST_TIMEOUT);
    } catch (err: any) {
      // If first attempt timed out, retry once with longer timeout (cold start)
      if (err.name === "AbortError") {
        console.warn("⏳ Server waking up (cold start), retrying...");
        response = await makeRequest(COLD_START_RETRY_TIMEOUT);
      } else {
        throw err;
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      throw new Error(errData?.message || `Server returned status ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Server is taking too long to respond. It may be waking up — please try again in a moment.");
    }
    throw new Error(err?.message || "Network request failed. Please try again.");
  }
}