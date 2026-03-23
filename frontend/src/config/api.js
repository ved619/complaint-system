const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AUTH_API = `${API_BASE}/auth`;
export const COMPLAINTS_API = `${API_BASE}/complaints`;
