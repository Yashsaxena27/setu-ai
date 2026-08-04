const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("token");

  if (!navigator.onLine) {
    throw new Error("You appear to be offline. Please check your internet connection.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for serverless wake-up

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
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The backend server took too long to respond.");
    }
    throw new Error(err?.message || "Network request failed. Please try again.");
  }
}