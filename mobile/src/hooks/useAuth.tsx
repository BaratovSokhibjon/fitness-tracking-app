"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCredentials, saveCredentials, clearCredentials, verifyAuth, getBaseUrl, setBaseUrl } from "@/api/client";
import { resetSyncState } from "@/db/sync";

type AuthState = {
  signedIn: boolean;
  loading: boolean;
  email: string | null;
  baseUrl: string;
  signIn: (email: string, password: string, baseUrl: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setApiBaseUrl: (url: string) => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  signedIn: false,
  loading: true,
  email: null,
  baseUrl: "http://localhost:4000",
  signIn: async () => false,
  signOut: async () => {},
  setApiBaseUrl: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [baseUrl, setBaseUrlState] = useState("http://localhost:4000");

  useEffect(() => {
    (async () => {
      const [creds, base] = await Promise.all([getCredentials(), getBaseUrl()]);
      setBaseUrlState(base);
      if (!creds) {
        setLoading(false);
        return;
      }
      try {
        const v = await verifyAuth();
        if (v) {
          setSignedIn(true);
          setEmail(v.email);
        }
      } catch {
        // network error — keep creds, allow retry
      }
      setLoading(false);
    })();
  }, []);

  const signIn = async (emailIn: string, password: string, base: string) => {
    await setBaseUrl(base);
    await saveCredentials(emailIn, password);
    try {
      const v = await verifyAuth();
      if (v) {
        setSignedIn(true);
        setEmail(v.email);
        setBaseUrlState(base);
        return true;
      }
      await clearCredentials(); // creds invalid — don't keep them
      return false;
    } catch (e) {
      await clearCredentials(); // network error — keep the URL but don't keep bad creds
      throw e;
    }
  };

  const signOut = async () => {
    await clearCredentials();
    await resetSyncState();
    setSignedIn(false);
    setEmail(null);
  };

  const setApiBaseUrl = async (url: string) => {
    await setBaseUrl(url);
    setBaseUrlState(url);
  };

  return (
    <AuthContext.Provider value={{ signedIn, loading, email, baseUrl, signIn, signOut, setApiBaseUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
