import React, { useState } from "react"
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from "react-native"
import { useRouter } from "expo-router"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import { authApi, saveToken } from "../services/authApi"

type Mode = "login" | "register"

export default function LoginScreen() {
  const router = useRouter()
  const [mode,     setMode]     = useState<Mode>("login")
  const [name,     setName]     = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.")
      return
    }
    setLoading(true)
    try {
      const result = mode === "login"
        ? await authApi.login(email.trim(), password)
        : await authApi.register(name.trim(), email.trim(), password)

      await saveToken(result.token)

      // Route teacher to teacher dashboard, others to tabs
      if (result.user.role === "teacher" || result.user.role === "admin") {
        router.replace("/teacher/dashboard")
      } else {
        router.replace("/")
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo area */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>✍️</Text>
          <Text style={styles.heroTitle}>Essay AI</Text>
          <Text style={styles.heroSub}>AI-powered IELTS scoring</Text>
        </View>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          {(["login", "register"] as Mode[]).map((m) => (
            <TouchableOpacity key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => setMode(m)}>
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === "login" ? "Sign In" : "Register"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nguyễn Văn A"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === "register" ? "Minimum 8 characters" : "••••••••"}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.surface} />
              : <Text style={styles.submitText}>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Text>
            }
          </TouchableOpacity>

          {/* Guest mode */}
          <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace("/")}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  scroll:          { flexGrow: 1, justifyContent: "center", padding: Spacing.xl },
  hero:            { alignItems: "center", marginBottom: Spacing.xxxl },
  heroIcon:        { fontSize: 60, marginBottom: Spacing.sm },
  heroTitle:       { ...Typography.heading1, color: Colors.primary, fontWeight: "800" },
  heroSub:         { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  tabRow:          { flexDirection: "row", backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 3, marginBottom: Spacing.xl },
  tab:             { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: "center" },
  tabActive:       { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText:         { ...Typography.bodySmall, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive:   { color: Colors.primary },
  form:            { gap: Spacing.md },
  field:           {},
  label:           { ...Typography.label, marginBottom: Spacing.xs },
  input:           { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: 14, ...Typography.body },
  submitBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: "center", ...Shadow.md, marginTop: Spacing.sm },
  submitDisabled:  { backgroundColor: Colors.textMuted },
  submitText:      { fontSize: 16, fontWeight: "700", color: Colors.surface },
  guestBtn:        { alignItems: "center", paddingVertical: Spacing.md },
  guestText:       { ...Typography.body, color: Colors.textSecondary },
})

