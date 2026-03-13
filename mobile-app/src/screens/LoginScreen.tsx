import React, { useState } from "react"
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Keyboard
} from "react-native"
import { useRouter } from "expo-router"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import { useAuth } from "../context/AuthContext"
import { getErrorMessage } from "../services/api"

type Mode = "login" | "register"

export default function LoginScreen() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [mode,     setMode]     = useState<Mode>("login")
  const [name,     setName]     = useState("")
  const [phone,    setPhone]    = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role,     setRole]     = useState<"free_student" | "teacher">("free_student")
  const [centerName, setCenterName] = useState("")
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async () => {
    const phoneValue = phone.trim()
    const nameValue = name.trim()
    const centerValue = centerName.trim()

    if (!phoneValue || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.")
      return
    }
    if (mode === "register" && !nameValue) {
      Alert.alert("Missing fields", "Please enter your full name.")
      return
    }
    if (mode === "register" && !confirmPassword.trim()) {
      Alert.alert("Missing fields", "Please confirm your password.")
      return
    }
    if (mode === "register" && role === "teacher" && !centerValue) {
      Alert.alert("Missing fields", "Please enter your center name.")
      return
    }
    if (mode === "register" && password !== confirmPassword) {
      Alert.alert("Password mismatch", "Confirmation password does not match.")
      return
    }
    setLoading(true)
    Keyboard.dismiss()
    try {
      if (mode === "login") {
        await login(phoneValue, password)
      } else {
        await register(
          nameValue,
          phoneValue,
          password,
          confirmPassword,
          role,
          centerValue || undefined,
        )
      }
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err))
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
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {mode === "register" && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Bạn là</Text>
                <View style={styles.roleRow}>
                  {[
                    { value: "free_student", label: "Học sinh", desc: "Luyện tập tự do" },
                    { value: "teacher", label: "Giáo viên", desc: "Quản lý lớp học" },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.value}
                      style={[
                        styles.roleCard,
                        role === r.value && styles.roleCardActive,
                      ]}
                      onPress={() => setRole(r.value as any)}
                    >
                      <Text style={styles.roleCardLabel}>{r.label}</Text>
                      <Text
                        style={[
                          styles.roleCardDesc,
                          role === r.value && { color: Colors.primary },
                        ]}
                      >
                        {r.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {role === "teacher" && (
                <View style={styles.field}>
                  <Text style={styles.label}>Tên trung tâm / Tổ chức *</Text>
                  <TextInput
                    style={styles.input}
                    value={centerName}
                    onChangeText={setCenterName}
                    placeholder="VD: Trung tâm Anh ngữ ABC"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
              )}
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === "register" ? "Tối thiểu 6 kí tự" : "••••••"}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>
          )}

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
          <TouchableOpacity style={styles.guestBtn} onPress={() => router.navigate("/")}>
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
  roleRow:         { flexDirection: "row", gap: Spacing.md },
  roleCard:        { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, alignItems: "center", gap: 4 },
  roleCardActive:  { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleCardLabel:   { ...Typography.body, fontWeight: "700" },
  roleCardDesc:    { ...Typography.caption, color: Colors.textMuted, textAlign: "center" },
  submitBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, alignItems: "center", ...Shadow.md, marginTop: Spacing.sm },
  submitDisabled:  { backgroundColor: Colors.textMuted },
  submitText:      { fontSize: 16, fontWeight: "700", color: Colors.surface },
  guestBtn:        { alignItems: "center", paddingVertical: Spacing.md },
  guestText:       { ...Typography.body, color: Colors.textSecondary },
})
