import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { studentApi, getErrorMessage } from "../services/api";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function StudentJoinClassScreen() {
  useRoleGuard(["center_student", "free_student"]);
  const router = useRouter();
  const [classCode, setClassCode] = useState("");
  const [joinedClass, setJoinedClass] = useState<any | null>(null);
  const [teacher, setTeacher] = useState<any | null>(null);

  const handleJoin = async () => {
    if (!classCode.trim()) return;
    try {
      const res = await studentApi.joinClass(classCode.trim().toUpperCase());
      setJoinedClass(res.data?.data?.class ?? null);
      setTeacher(res.data?.data?.teacher ?? null);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate("/")}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tham gia lớp</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {!joinedClass ? (
          <>
            <Text style={styles.label}>Mã lớp</Text>
            <TextInput
              style={styles.input}
              value={classCode}
              onChangeText={(v) => setClassCode(v.toUpperCase().slice(0, 8))}
              placeholder="VD: CLS-A3X9"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleJoin}>
              <Text style={styles.submitText}>Tham gia lớp</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Đã tham gia lớp!</Text>
            <Text style={styles.successText}>{joinedClass.name}</Text>
            <Text style={styles.successText}>Mã lớp: {joinedClass.code}</Text>
            {teacher?.name && (
              <Text style={styles.successText}>Giáo viên: {teacher.name}</Text>
            )}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => router.navigate("/")}
            >
              <Text style={styles.submitText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { ...Typography.body, color: Colors.primary, fontWeight: "600" },
  headerTitle: { ...Typography.heading3 },
  content: { padding: Spacing.lg },
  label: { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadow.md,
  },
  submitText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  successTitle: { ...Typography.heading3, marginBottom: Spacing.sm },
  successText: { ...Typography.body, marginBottom: Spacing.xs },
});


