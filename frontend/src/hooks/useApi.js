import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again.";

export function useApi() {
  const { token, logout } = useAuth();

  return useCallback(
    async (url, options = {}) => {
      const headers = {
        ...(options.headers || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        logout(SESSION_EXPIRED_MESSAGE);
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }

      return response;
    },
    [token, logout],
  );
}
