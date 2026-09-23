"use client";

import { ReactNode, useEffect, useState } from "react";
import { setAccessToken as setApiAccessToken } from "@/lib/api";
import { AuthContext, User } from "./auth-context";

import { logout as logoutApi } from "@/lib/api";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  function setAuth(user: User, token: string) {
    console.log("[Auth] setAuth", user);

    setUser(user);
    setAccessToken(token);
    setApiAccessToken(token);
  }

  function clearAuth() {
    console.log("[Auth] clearAuth");

    setUser(null);
    setAccessToken(null);
    setApiAccessToken(null);
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      clearAuth();
    }
  }

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      console.log("[Auth] Restoring session...");
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (!response.ok) {
          console.log("[Auth] No active session");
          if (mounted) {
            clearAuth();
          }
          return;
        }

        const data = await response.json();

        console.log("[Auth] Session restored:", data.user);

        if (mounted) {
          setUser(data.user);
          setAccessToken(data.accessToken);
          setApiAccessToken(data.accessToken);
        }
      } catch (error) {
        console.error("[Auth] Session restore failed:", error);

        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        setAuth,
        logout,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
