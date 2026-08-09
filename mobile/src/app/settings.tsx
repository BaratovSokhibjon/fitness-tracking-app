"use client";

import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Device from "expo-device";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/theme/ThemeProvider";
import { api } from "@/api/endpoints";

export default function SettingsScreen() {
  const theme = useTheme() as any;
  const colors = theme.colors;
  const { baseUrl, setApiBaseUrl, signOut, email } = useAuth();
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => setUrlInput(baseUrl), [baseUrl]);

  const saveUrl = async () => {
    await setApiBaseUrl(urlInput.trim());
    setMsg("API base URL saved.");
    setTimeout(() => setMsg(null), 2000);
  };

  const registerForPush = async () => {
    try {
      if (!Device.isDevice) {
        setMsg("Push only works on a physical device.");
        setTimeout(() => setMsg(null), 3000);
        return;
      }
      // Lazy-import: expo-notifications was removed from Expo Go on Android in
      // SDK 53, so a static import would crash the whole app in Expo Go. In a
      // development build the module resolves normally.
      const Notifications = await import("expo-notifications");
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.status;
      }
      if (finalStatus !== "granted") {
        setMsg("Notification permission denied.");
        setTimeout(() => setMsg(null), 3000);
        return;
      }
      const token = await Notifications.getExpoPushTokenAsync();
      await api.registerDevice(token.data, Platform.OS === "ios" ? "ios" : "android");
      setMsg("Push notifications enabled.");
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg("Could not register for push. Notifications require a development build.");
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.linen }} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Signed in as</Text>
        <Text style={{ color: colors.mute }}>{email ?? "—"}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <Text style={[styles.title, { color: colors.ink }]}>API base URL</Text>
        <TextInput
          style={[styles.input, { color: colors.ink, backgroundColor: colors.linen, borderColor: colors.hairline }]}
          value={urlInput}
          onChangeText={setUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={saveUrl} style={[styles.button, { backgroundColor: colors.ink }]}>
          <Text style={{ color: colors.canvas, fontWeight: "500" }}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Notifications</Text>
        <TouchableOpacity onPress={registerForPush} style={[styles.button, { backgroundColor: colors.ink }]}>
          <Text style={{ color: colors.canvas, fontWeight: "500" }}>Enable push notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <TouchableOpacity onPress={() => signOut()} style={[styles.button, { borderColor: colors.sale, borderWidth: 1 }]}>
          <Text style={{ color: colors.sale, fontWeight: "500" }}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {msg && <Text style={{ color: colors.mute, textAlign: "center", marginTop: 8 }}>{msg}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 0, padding: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, marginBottom: 12 },
  button: { borderRadius: 4, paddingVertical: 12, alignItems: "center" },
});
