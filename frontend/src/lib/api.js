const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_KEY = "eb_token";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

// Calls the backend and returns res.data. Throws Error(message) on failure.
// Usage: const data = await apiFetch("/api/water-points");
//        await apiFetch("/api/reports", { method: "POST", body: { ... } });
export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {}

  if (!res.ok || !json || json.success === false) {
    const error = new Error((json && json.message) || "Something went wrong");
    error.status = res.status;
    throw error;
  }

  return json.data;
}
