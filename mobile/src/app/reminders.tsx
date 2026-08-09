"use client";

import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api, type Reminder } from "@/api/endpoints";
import { useTheme } from "@/theme/ThemeProvider";

const TYPES = ["body_weight", "food_log", "water", "creatine", "caffeine", "habits", "sleep", "steps"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RemindersScreen() {
  const theme = useTheme() as any;
  const colors = theme.colors;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [time, setTime] = useState("08:00");
  const [type, setType] = useState("body_weight");
  const [days, setDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const load = async () => {
    try {
      setReminders(await api.reminders());
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const toggleDay = (d: string) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const create = async () => {
    if (days.length === 0) return;
    await api.createReminder({ time, timezone: "Asia/Seoul", days, type, enabled: true });
    setReminders(await api.reminders());
  };

  const toggleEnabled = async (r: Reminder) => {
    await api.updateReminder(r.id, { time: r.time, timezone: r.timezone, days: r.days, type: r.type, enabled: !r.enabled });
    setReminders(await api.reminders());
  };

  const remove = async (r: Reminder) => {
    await api.deleteReminder(r.id);
    setReminders(await api.reminders());
  };

  return (
    <ScrollView style={{ backgroundColor: colors.linen }} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <Text style={[styles.title, { color: colors.ink }]}>New reminder</Text>
        <Text style={styles.label}>Time (HH:MM)</Text>
        <TextInput
          style={[styles.input, { color: colors.ink, backgroundColor: colors.linen, borderColor: colors.hairline }]}
          value={time}
          onChangeText={setTime}
          placeholder="08:00"
          placeholderTextColor={colors.stone}
        />
        <Text style={styles.label}>Remind me to</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[styles.chip, { borderColor: colors.hairline, backgroundColor: type === t ? colors.cloud : colors.canvas }]}
            >
              <Text style={{ color: colors.ink }}>{t.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Days</Text>
        <View style={styles.chips}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => toggleDay(d)}
              style={[styles.dayChip, { borderColor: colors.hairline, backgroundColor: days.includes(d) ? colors.cloud : colors.canvas }]}
            >
              <Text style={{ color: colors.ink }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={create}
          style={[styles.button, { backgroundColor: colors.ink }]}
        >
          <Text style={{ color: colors.canvas, fontWeight: "500" }}>Add reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Your reminders</Text>
        {reminders.length === 0 && <Text style={{ color: colors.mute }}>No reminders yet.</Text>}
        {reminders.map((r) => (
          <View key={r.id} style={[styles.row, { borderBottomColor: colors.hairlineSoft }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink }}>{r.type.replace("_", " ")} — {r.time}</Text>
              <Text style={{ color: colors.mute, fontSize: 12 }}>{r.days.join(", ")}</Text>
            </View>
            <Switch value={r.enabled} onValueChange={() => toggleEnabled(r)} trackColor={{ false: colors.stone, true: colors.success }} />
            <TouchableOpacity onPress={() => remove(r)} style={{ marginLeft: 8 }}>
              <Text style={{ color: colors.sale }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 0, padding: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
  label: { fontSize: 12, color: "#706f69", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginTop: 6 },
  dayChip: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginTop: 6 },
  button: { borderRadius: 4, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
});
