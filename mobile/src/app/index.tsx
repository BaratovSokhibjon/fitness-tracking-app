"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { useToday } from "@/hooks/useToday";
import { useTheme } from "@/theme/ThemeProvider";
import { api } from "@/api/endpoints";
import type { FoodItem } from "@/api/endpoints";

function Section({ title, children, colors }: any) {
  return (
    <View style={[styles.card, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
      <Text style={[styles.sectionTitle, { color: colors.mute }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, onPress, colors }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, { borderBottomColor: colors.hairlineSoft }]}>
      <Text style={{ color: colors.mute }}>{label}</Text>
      <Text style={{ color: colors.ink }}>{value}</Text>
    </TouchableOpacity>
  );
}

export default function TodayScreen() {
  const theme = useTheme() as any;
  const colors = theme.colors;
  const { data, loading, syncing, updateCheckIn, toggleHabit, toggleCreatine, addFood } = useToday();

  const [weightInput, setWeightInput] = useState("");
  const [sleepInput, setSleepInput] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);

  // Seed the quick inputs from stored values ONCE on first load only — re-seeding
  // on later data changes would clobber in-progress typing.
  const seededRef = useRef(false);
  useEffect(() => {
    if (data && !seededRef.current) {
      seededRef.current = true;
      const c = data.checkIn ?? {};
      setWeightInput(c.morningWeight != null ? String(c.morningWeight) : "");
      setSleepInput(c.sleepHours != null ? String(c.sleepHours) : "");
    }
  }, [data]);

  if (loading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  const c = data.checkIn ?? {};
  const totals = data.food.reduce(
    (a, f) => ({ calories: a.calories + f.calories, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fat: a.fat + f.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const searchFoods = async (q: string) => {
    setFoodQuery(q);
    if (!q.trim()) {
      setFoodResults([]);
      return;
    }
    const res = await api.searchFoods(q.trim());
    setFoodResults(res);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.linen }} contentContainerStyle={styles.content}>
      <View style={styles.navRow}>
        <Link href="/settings" asChild>
          <TouchableOpacity style={[styles.navLink, { borderColor: colors.hairline }]}>
            <Text style={{ color: colors.ink }}>Settings</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/profile" asChild>
          <TouchableOpacity style={[styles.navLink, { borderColor: colors.hairline }]}>
            <Text style={{ color: colors.ink }}>Profile</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/reminders" asChild>
          <TouchableOpacity style={[styles.navLink, { borderColor: colors.hairline }]}>
            <Text style={{ color: colors.ink }}>Reminders</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {syncing && (
        <View style={[styles.syncing, { backgroundColor: colors.cloud }]}>
          <ActivityIndicator size="small" color={colors.mute} />
          <Text style={{ color: colors.mute, marginLeft: 8, fontSize: 12 }}>Syncing…</Text>
        </View>
      )}

      {data.schedule && (
        <Section title="Today's Workout" colors={colors}>
          <Text style={{ color: colors.ink, fontWeight: "500" }}>{data.schedule.workoutName}</Text>
          {data.schedule.exercises?.map((ex: any, i: number) => (
            <Text key={i} style={{ color: colors.mute, fontSize: 13, marginTop: 2 }}>
              {ex.name} · {ex.sets}×{ex.minReps}–{ex.maxReps}
            </Text>
          ))}
        </Section>
      )}

      <Section title="Check-in" colors={colors}>
        <View style={styles.flexRow}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, { color: colors.ink, backgroundColor: colors.linen, borderColor: colors.hairline }]}
              placeholder="76.5"
              placeholderTextColor={colors.stone}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              onEndEditing={() => {
                const v = parseFloat(weightInput);
                if (!Number.isNaN(v)) updateCheckIn({ morningWeight: v });
              }}
            />
          </View>
          <View style={[styles.flex1, { marginLeft: 12 }]}>
            <Text style={styles.label}>Sleep (h)</Text>
            <TextInput
              style={[styles.input, { color: colors.ink, backgroundColor: colors.linen, borderColor: colors.hairline }]}
              placeholder="7.5"
              placeholderTextColor={colors.stone}
              keyboardType="decimal-pad"
              value={sleepInput}
              onChangeText={setSleepInput}
              onEndEditing={() => {
                const v = parseFloat(sleepInput);
                if (!Number.isNaN(v)) updateCheckIn({ sleepHours: v });
              }}
            />
          </View>
        </View>
        <Row label="Morning weight" value={c.morningWeight ? `${c.morningWeight} kg` : "—"} colors={colors} />
        <Row label="Sleep" value={c.sleepHours ? `${c.sleepHours} h` : "—"} colors={colors} />
        <Row label="Steps" value={c.steps ? String(c.steps) : "—"} colors={colors} />
        <Row label="Water" value={c.water ? `${(c.water / 1000).toFixed(1)} L` : "—"} colors={colors} />
        <Row label="Caffeine" value={c.caffeineMg ? `${c.caffeineMg} mg` : "—"} colors={colors} />
      </Section>

      <Section title="Food Log" colors={colors}>
        <View style={styles.flexRow}>
          <View style={[styles.totalBox, { borderColor: colors.hairline }]}><Text style={{ color: colors.ink }}>{totals.calories}</Text><Text style={styles.totalLabel}>kcal</Text></View>
          <View style={[styles.totalBox, { borderColor: colors.hairline }]}><Text style={{ color: colors.ink }}>{Math.round(totals.protein)}</Text><Text style={styles.totalLabel}>protein g</Text></View>
          <View style={[styles.totalBox, { borderColor: colors.hairline }]}><Text style={{ color: colors.ink }}>{Math.round(totals.carbs)}</Text><Text style={styles.totalLabel}>carbs g</Text></View>
          <View style={[styles.totalBox, { borderColor: colors.hairline }]}><Text style={{ color: colors.ink }}>{Math.round(totals.fat)}</Text><Text style={styles.totalLabel}>fat g</Text></View>
        </View>
        {data.food.map((f) => (
          <View key={f.id} style={[styles.foodRow, { borderBottomColor: colors.hairlineSoft }]}>
            <Text style={{ color: colors.ink }}>{f.name} ×{f.quantity}</Text>
            <Text style={{ color: colors.mute, fontSize: 12 }}>{f.calories} kcal</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.smallButton} onPress={() => setShowFoodSearch((s) => !s)}>
          <Text style={{ color: colors.ink }}>{showFoodSearch ? "Cancel" : "+ Add food"}</Text>
        </TouchableOpacity>
        {showFoodSearch && (
          <View style={{ marginTop: 8 }}>
            <TextInput
              style={[styles.input, { color: colors.ink, backgroundColor: colors.linen, borderColor: colors.hairline }]}
              placeholder="Search foods…"
              placeholderTextColor={colors.stone}
              value={foodQuery}
              onChangeText={searchFoods}
            />
            {foodResults.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.foodRow, { borderBottomColor: colors.hairlineSoft }]}
                onPress={() => addFood(f.id, f.name, 1, {
                  calories: f.caloriesPerServing,
                  protein: f.proteinPerServing,
                  carbs: f.carbsPerServing,
                  fat: f.fatPerServing,
                })}
              >
                <Text style={{ color: colors.ink }}>{f.name}</Text>
                <Text style={{ color: colors.mute, fontSize: 12 }}>{f.caloriesPerServing} kcal</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Section>

      <Section title="Habits" colors={colors}>
        {data.habits.map((h) => (
          <Row
            key={h.id}
            label={h.name}
            value={h.completed ? "✓ done" : "—"}
            colors={colors}
            onPress={() => toggleHabit(h.id, !h.completed)}
          />
        ))}
      </Section>

      <Section title="Creatine" colors={colors}>
        <Row
          label="Dose today"
          value={data.creatine?.taken ? "Taken ✓" : "Not taken"}
          colors={colors}
          onPress={() => toggleCreatine()}
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  syncing: { flexDirection: "row", alignItems: "center", padding: 8, marginBottom: 12, borderRadius: 4 },
  navRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  navLink: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
  card: { borderWidth: 1, borderRadius: 0, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 12, color: "#706f69", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, marginBottom: 8 },
  flexRow: { flexDirection: "row" },
  flex1: { flex: 1 },
  totalBox: { flex: 1, borderWidth: 1, alignItems: "center", paddingVertical: 10, marginRight: 8 },
  totalLabel: { fontSize: 11, color: "#706f69", marginTop: 2 },
  foodRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  smallButton: { paddingVertical: 8, marginTop: 4 },
});
