import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { classApi, getErrorMessage } from "../services/api";
import { useRoleGuard } from "../hooks/useRoleGuard";

type Step = "count" | "form" | "result";

interface Row {
  name: string;
  phone: string;
}

interface ResultRow {
  rowNumber: number;
  name: string;
  phone: string;
  status: "created" | "linked" | "error";
  tempPassword?: string;
  reason?: string;
}

export default function TeacherCreateStudentsScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const [step, setStep] = useState<Step>("count");
  const [studentCount, setStudentCount] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);

  const total = useMemo(() => rows.length, [rows.length]);

  const handleContinue = () => {
    const count = parseInt(studentCount, 10);
    if (!Number.isFinite(count) || count <= 0) {
      Alert.alert("Số lượng không hợp lệ", "Vui lòng nhập số > 0.");
      return;
    }
    if (count > 100) {
      Alert.alert("Quá nhiều", "Tối đa 100 học sinh mỗi lần.");
      return;
    }
    setRows(Array.from({ length: count }, () => ({ name: "", phone: "" })));
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await classApi.bulkCreateStudents(classId, rows);
      const data = res.data?.data;
      setResults(data?.results ?? []);
      setStep("result");
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderRow = ({ item, index }: { item: Row; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rowNum}>{index + 1}</Text>
      <TextInput
        style={styles.phoneCell}
        placeholder="Số điện thoại"
        placeholderTextColor={Colors.textMuted}
        keyboardType="phone-pad"
        value={item.phone}
        onChangeText={(val) => {
          const next = [...rows];
          next[index] = { ...next[index], phone: val };
          setRows(next);
        }}
      />
      <TextInput
        style={styles.nameCell}
        placeholder="Họ và tên"
        placeholderTextColor={Colors.textMuted}
        value={item.name}
        onChangeText={(val) => {
          const next = [...rows];
          next[index] = { ...next[index], name: val };
          setRows(next);
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo học sinh</Text>
        <View style={{ width: 60 }} />
      </View>

      {step === "count" && (
        <View style={styles.panel}>
          <Text style={styles.label}>Số lượng học sinh</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 10"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            value={studentCount}
            onChangeText={setStudentCount}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
            <Text style={styles.primaryText}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "form" && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={rows}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderRow}
            contentContainerStyle={styles.table}
            ListHeaderComponent={
              <View style={styles.tableHeader}>
                <Text style={styles.headerNum}>#</Text>
                <Text style={styles.headerPhone}>Số điện thoại</Text>
                <Text style={styles.headerName}>Họ và tên</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={[styles.primaryBtn, styles.stickyBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.primaryText}>Tạo {total} học sinh</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === "result" && (
        <ScrollView contentContainerStyle={styles.resultWrap}>
          <Text style={styles.resultTitle}>Kết quả</Text>
          {results.map((r) => (
            <View key={`${r.rowNumber}-${r.phone}`} style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>
                  {r.rowNumber}. {r.name} ({r.phone})
                </Text>
                {r.status === "created" && r.tempPassword && (
                  <Text style={styles.resultMeta}>
                    🆕 Mật khẩu tạm: {r.tempPassword}
                  </Text>
                )}
                {r.status === "linked" && (
                  <Text style={styles.resultMeta}>✅ Đã liên kết</Text>
                )}
                {r.status === "error" && (
                  <Text style={styles.resultError}>❌ {r.reason}</Text>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: Spacing.lg }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryText}>Xong</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  panel: { padding: Spacing.lg },
  label: { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    ...Typography.body,
  },
  primaryBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadow.md,
  },
  primaryText: { color: Colors.surface, fontWeight: "700" },
  table: { padding: Spacing.lg, paddingBottom: 120 },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerNum: { width: 30, ...Typography.caption, fontWeight: "700" },
  headerPhone: { flex: 1.2, ...Typography.caption, fontWeight: "700" },
  headerName: { flex: 1.8, ...Typography.caption, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  rowNum: { width: 30, ...Typography.caption, fontWeight: "700" },
  phoneCell: {
    flex: 1.2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    marginRight: Spacing.sm,
    ...Typography.bodySmall,
  },
  nameCell: {
    flex: 1.8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    ...Typography.bodySmall,
  },
  stickyBtn: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  resultWrap: { padding: Spacing.lg },
  resultTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  resultRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  resultName: { ...Typography.body, fontWeight: "700" },
  resultMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  resultError: { ...Typography.bodySmall, color: Colors.error, marginTop: 4 },
});
