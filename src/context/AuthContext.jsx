import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("cafeteria-user") || "null"),
  );
  const [token, setToken] = useState(
    () => localStorage.getItem("cafeteria-token") || "",
  );

  useEffect(() => {
    if (user) localStorage.setItem("cafeteria-user", JSON.stringify(user));
    else localStorage.removeItem("cafeteria-user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("cafeteria-token", token);
    else localStorage.removeItem("cafeteria-token");
  }, [token]);

  const login = async (email, password) => {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(result.user);
    setToken(result.token);
    return result;
  };

  const register = async (payload) => {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setUser(result.user);
    setToken(result.token);
    return result;
  };

  const logout = () => {
    setUser(null);
    setToken("");
  };

  const fetchProfile = async () => {
    if (!token) return null;
    const result = await apiRequest("/auth/me", {}, token);
    setUser(result.user);
    return result.user;
  };

  const value = useMemo(
    () => ({ user, token, login, register, logout, fetchProfile }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
