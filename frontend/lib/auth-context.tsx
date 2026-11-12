"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthResponse } from "./types";
import { apiRequest } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem("paisawise_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await apiRequest<User>("/api/auth/me");
          setUser(profile);
        } catch {
          // Token invalid or expired
          localStorage.removeItem("paisawise_token");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    localStorage.setItem("paisawise_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    handleAuthSuccess(data);
  };

  const register = async (name: string, email: string, password: string, currency: string = "INR") => {
    const data = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, currency }),
    });
    handleAuthSuccess(data);
  };

  const demoLogin = async () => {
    const data = await apiRequest<AuthResponse>("/api/auth/demo", {
      method: "POST",
    });
    handleAuthSuccess(data);
  };

  const logout = () => {
    localStorage.removeItem("paisawise_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

