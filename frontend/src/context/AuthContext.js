"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, getToken, setToken, clearToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load: if a token is saved, ask the backend who the user is
  useEffect(() => {
    const saved = getToken();
    if (!saved) {
      setLoading(false);
      return;
    }
    setTokenState(saved);
    apiFetch("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        setTokenState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return saveSession(data);
  };

  const register = async (name, email, password) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    return saveSession(data);
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in any client component: const { user, token, loading, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
