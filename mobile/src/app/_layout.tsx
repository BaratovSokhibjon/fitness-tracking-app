import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

function RootNavigator() {
  const { signedIn, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {!signedIn && <Redirect href="/auth/login" />}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.linen },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.canvas },
          headerTitleStyle: { fontWeight: "500" },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="index" options={{ title: "Today" }} />
          <Stack.Screen name="profile" options={{ title: "Profile" }} />
          <Stack.Screen name="reminders" options={{ title: "Reminders" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
        </Stack.Protected>
        <Stack.Screen name="auth/login" options={{ title: "Sign in", headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
