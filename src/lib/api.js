const rawApiUrl = import.meta.env.VITE_API_URL || "/api";
const API_URL = rawApiUrl.replace(/\/+$/, "");

export async function apiRequest(path, options = {}, token) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const endpoint = path.startsWith("/") ? path : `/${path}`;

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (API_URL.includes("localhost") && typeof window !== "undefined" && window.location.hostname !== "localhost") {
      console.error(
        "Network Error: The frontend is trying to call http://localhost:5000 from a deployed domain. " +
        "Make sure to set the VITE_API_URL environment variable in your Vercel project settings to your live backend URL."
      );
    }
    throw new Error(err.message || "Failed to fetch from backend server");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(data.message || data || "Request failed");
  }

  return data;
}

export const API = { API_URL };
