import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { decodeJwtPayload, getJwtExpiryMs, isTokenExpired } from "../utils/jwt";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "auth_user";
const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again.";

const AuthContext = createContext(null);

function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionMessage, setSessionMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  const clearSessionMessage = useCallback(() => {
    setSessionMessage("");
  }, []);

  const logout = useCallback((reason = "") => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    if (reason) {
      setSessionMessage(reason);
    }
  }, []);

  const login = useCallback((nextToken, userFromApi = null) => {
    const decoded = decodeJwtPayload(nextToken);
    const normalizedUser = userFromApi || {
      id: decoded?.userId,
      name: decoded?.name || "User",
      role: decoded?.role || "ENGINEER",
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));

    setToken(nextToken);
    setUser(normalizedUser);
    setSessionMessage("");
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = getStoredUser();

    if (!storedToken) {
      setIsInitializing(false);
      return;
    }

    if (isTokenExpired(storedToken)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setSessionMessage(SESSION_EXPIRED_MESSAGE);
      setIsInitializing(false);
      return;
    }

    const decoded = decodeJwtPayload(storedToken);
    const normalizedUser = storedUser || {
      id: decoded?.userId,
      name: decoded?.name || "User",
      role: decoded?.role || "ENGINEER",
    };

    setToken(storedToken);
    setUser(normalizedUser);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const expiryMs = getJwtExpiryMs(token);
    if (!expiryMs) {
      return undefined;
    }

    const remainingMs = expiryMs - Date.now();
    if (remainingMs <= 0) {
      logout(SESSION_EXPIRED_MESSAGE);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      logout(SESSION_EXPIRED_MESSAGE);
    }, remainingMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [token, logout]);

  const value = useMemo(() => {
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      isInitializing,
      sessionMessage,
      login,
      logout,
      clearSessionMessage,
    };
  }, [token, user, isInitializing, sessionMessage, login, logout, clearSessionMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
