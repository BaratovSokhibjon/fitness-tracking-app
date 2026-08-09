"use client";

import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme/ThemeProvider";

export default function LoginScreen() {
  const { colors } = useTheme() as any;
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const base = baseUrl.trim() || "http://localhost:4000";
    try {
      const ok = await signIn(email.trim(), password, base);
      if (!ok) setError("Sign-in failed — check credentials.");
      else router.replace("/");
    } catch {
      setError("Could not reach the server at that address.");
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.linen }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.ink }]}>Somatix</Text>
        <Text style={[styles.subtitle, { color: colors.mute }]}>Sign in to sync your data</Text>

        <TextInput
          style={[styles.input, { color: colors.ink, backgroundColor: colors.canvas, borderColor: colors.hairline }]}
          placeholder="Email"
          placeholderTextColor={colors.stone}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { color: colors.ink, backgroundColor: colors.canvas, borderColor: colors.hairline }]}
          placeholder="Password"
          placeholderTextColor={colors.stone}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={[styles.input, { color: colors.ink, backgroundColor: colors.canvas, borderColor: colors.hairline }]}
          placeholder="API base URL (e.g. http://192.168.1.5:4000)"
          placeholderTextColor={colors.stone}
          autoCapitalize="none"
          autoCorrect={false}
          value={baseUrl}
          onChangeText={setBaseUrl}
        />

        {error && <Text style={[styles.error, { color: colors.sale }]}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.ink }]}
          onPress={submit}
          disabled={busy}
        >
          <Text style={[styles.buttonText, { color: colors.canvas }]}>{busy ? "Signing in…" : "Sign in"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 420, alignSelf: "center" },
  title: { fontSize: 32, fontWeight: "500", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { fontSize: 15, fontWeight: "500" },
  error: { fontSize: 13, marginBottom: 8 },
});
