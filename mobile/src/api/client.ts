import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const BASE_URL_KEY = "somatix-api-base";
const EMAIL_KEY = "somatix-email";
const PASSWORD_KEY = "somatix-password";

export async function getBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(BASE_URL_KEY);
  if (stored) return stored.replace(/\/+$/, "");
  return "http://localhost:4000";
}

export async function setBaseUrl(url: string) {
  await AsyncStorage.setItem(BASE_URL_KEY, url.replace(/\/+$/, ""));
}

export async function getCredentials(): Promise<{ email: string; password: string } | null> {
  const email = await SecureStore.getItemAsync(EMAIL_KEY);
  const password = await SecureStore.getItemAsync(PASSWORD_KEY);
  if (!email || !password) return null;
  return { email, password };
}

export async function saveCredentials(email: string, password: string) {
  await SecureStore.setItemAsync(EMAIL_KEY, email.toLowerCase());
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64(str: string): string {
  if (typeof btoa === "function") {
    return btoa(str);
  }
  // Pure-JS fallback for environments without btoa.
  let out = "";
  let i = 0;
  const bytes = Array.from(new TextEncoder().encode(str));
  while (i < bytes.length) {
    const b0 = bytes[i++];
    const b1 = i < bytes.length ? bytes[i++] : NaN;
    const b2 = i < bytes.length ? bytes[i++] : NaN;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (isNaN(b1) ? 0 : b1 >> 4)];
    out += isNaN(b1) ? "=" : B64_CHARS[((b1 & 15) << 2) | (isNaN(b2) ? 0 : b2 >> 6)];
    out += isNaN(b2) ? "=" : B64_CHARS[b2 & 63];
  }
  return out;
}

function authHeader(email: string, password: string): string {
  return `Basic ${base64(`${email}:${password}`)}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const baseUrl = await getBaseUrl();
  const creds = await getCredentials();
  if (!creds) throw new ApiError(401, "Not signed in");

  const headers: Record<string, string> = {
    Authorization: authHeader(creds.email, creds.password),
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) message = j.error;
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

// Verify stored credentials against the API.
export async function verifyAuth(): Promise<{ email: string } | null> {
  try {
    return await apiFetch<{ email: string }>("/auth/verify");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 429)) return null;
    throw e;
  }
}
