const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_STORAGE_KEY = "sweety_auth";

export async function apiRequest(path, options = {}) {
  const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)
    || window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  let token = null;
  try {
    token = savedAuth ? JSON.parse(savedAuth)?.token : null;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("Unable to reach Sweety right now. Please try again.");
  }

  const payload = await response.json().catch(() => null);

  if (response.status === 401) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event("sweety:unauthorized"));
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Something went wrong.");
  }

  return payload;
}

export { API_URL, AUTH_STORAGE_KEY };
