import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { loginUser, getCurrentProfile, logoutUser } from "../lib/supabaseService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    const initAuth = async () => {
      // 1. Check existing local storage user
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }

      // 2. If Supabase is configured, check active session
      if (isSupabaseConfigured()) {
        try {
          const profile = await getCurrentProfile();
          if (profile) {
            setUser(profile);
            localStorage.setItem("user", JSON.stringify(profile));
          }
        } catch (err) {
          console.warn("Auth initialization warning:", err);
        }

        // Set up real-time auth listener
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const profile = await getCurrentProfile();
            if (profile) {
              setUser(profile);
              localStorage.setItem("user", JSON.stringify(profile));
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          }
        });
        subscription = data?.subscription;
      }

      setLoading(false);
    };

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await loginUser(email, password);
    if (token) localStorage.setItem("token", token);
    if (loggedInUser) {
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    }
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
