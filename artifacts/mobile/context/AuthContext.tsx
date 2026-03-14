import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  createdAt: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_user"),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          try {
            const { user: fresh } = await api.auth.me();
            setUser(fresh);
            await AsyncStorage.setItem("auth_user", JSON.stringify(fresh));
          } catch {}
        }
      } catch {}
      setIsLoading(false);
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { user, token } = await api.auth.login(email, password);
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem("auth_token", token);
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    } catch (e: any) {
      setError(e.message || "Login failed");
      throw e;
    }
  }, []);

  const loginWithGoogle = useCallback(async (accessToken: string) => {
    setError(null);
    try {
      const { user, token } = await api.auth.googleAuth(accessToken);
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem("auth_token", token);
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    } catch (e: any) {
      setError(e.message || "Google login failed");
      throw e;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    setError(null);
    try {
      const { user, token } = await api.auth.register(name, email, password, phone);
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem("auth_token", token);
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    } catch (e: any) {
      setError(e.message || "Registration failed");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch {}
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
  }, []);

  const updateProfile = useCallback(async (name: string, phone?: string) => {
    setError(null);
    try {
      const { user: updated } = await api.auth.updateProfile(name, phone);
      setUser(updated);
      await AsyncStorage.setItem("auth_user", JSON.stringify(updated));
    } catch (e: any) {
      setError(e.message || "Update failed");
      throw e;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setError(null);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
    } catch (e: any) {
      setError(e.message || "Password change failed");
      throw e;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: fresh } = await api.auth.me();
      setUser(fresh);
      await AsyncStorage.setItem("auth_user", JSON.stringify(fresh));
    } catch {}
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login, loginWithGoogle, register, logout, updateProfile, changePassword, refreshUser,
      error, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
