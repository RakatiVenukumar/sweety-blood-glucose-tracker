import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, AUTH_STORAGE_KEY } from "../services/apiClient";

const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
      || window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function persistAuth(auth, remember) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  otherStorage.removeItem(AUTH_STORAGE_KEY);
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    const clearAuth = () => setAuth(null);
    window.addEventListener("sweety:unauthorized", clearAuth);
    return () => window.removeEventListener("sweety:unauthorized", clearAuth);
  }, []);

  const value = useMemo(() => ({
    token: auth?.token || null,
    user: auth?.user || null,
    isAuthenticated: Boolean(auth?.token),
    signIn(nextAuth, remember = true) {
      persistAuth(nextAuth, remember);
      setAuth(nextAuth);
    },
    signOut() {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setAuth(null);
    }
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
