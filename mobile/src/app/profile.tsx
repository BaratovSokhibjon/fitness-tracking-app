"use client";

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type ProfileData } from "@/api/endpoints";
import { useTheme } from "@/theme/ThemeProvider";

export default function ProfileScreen() {
  const theme = useTheme() as any;
  const colors = theme.colors;
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => {});
  }, []);

  const rows: [string, string][] = profile
    ? [
        ["Age", profile.age ? String(profile.age) : "—"],
        ["Height", profile.height ? `${profile.height} cm` : "—"],
        ["Calories target", profile.dailyCaloriesTarget ? String(profile.dailyCaloriesTarget) : "—"],
        ["Protein target", profile.dailyProteinTarget ? `${profile.dailyProteinTarget} g` : "—"],
        ["Water target", profile.dailyWaterTarget ? `${profile.dailyWaterTarget} ml` : "—"],
        ["Steps target", profile.dailyStepsTarget ? String(profile.dailyStepsTarget) : "—"],
        ["Caffeine target", profile.dailyCaffeineTarget ? `${profile.dailyCaffeineTarget} mg` : "—"],
        ["Sleep target", profile.sleepTarget ? `${profile.sleepTarget} h` : "—"],
        ["Creatine", profile.creatineEnabled ? "enabled" : "disabled"],
      ]
    : [];

  return (
    <ScrollView style={{ backgroundColor: colors.linen }} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Targets & baselines</Text>
        {profile ? (
          rows.map(([label, value]) => (
            <View key={label} style={[styles.row, { borderBottomColor: colors.hairlineSoft }]}>
              <Text style={{ color: colors.mute }}>{label}</Text>
              <Text style={{ color: colors.ink }}>{value}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.mute }}>No profile data.</Text>
        )}
        <Text style={{ color: colors.stone, fontSize: 12, marginTop: 12 }}>
          Edit targets on the web app — the mobile app reads them.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 0, padding: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
});
