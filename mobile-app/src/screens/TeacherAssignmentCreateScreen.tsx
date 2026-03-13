import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { assignmentApi, classApi, getErrorMessage } from "../services/api";
import { Class, GradingCriteria, RequiredVocabulary, BandDescriptor } from "../types";
import { useRoleGuard } from "../hooks/useRoleGuard";

const BAND_LEVELS = [4.0, 5.0, 6.0, 7.0, 8.0];

export default function TeacherAssignmentCreateScreen() {
  useRoleGuard(["teacher", "admin"]);

  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState("");
  const [showClassPicker, setShowClassPicker] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 7 * 86400000),
  );
  const [dueDateText, setDueDateText] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [saving, setSaving] = useState(false);

  const [criteria, setCriteria] = useState<GradingCriteria>({
    requiredVocabulary: [],
    bandDescriptors: [],
  });

  const loadClasses = useCallback(async () => {
    const res = await classApi.getAll();
    const data = res.data?.data?.classes ?? res.data?.data ?? [];
    setClasses(data);
    if (!classId && data.length > 0) setClassId(data[0]._id);
  }, [classId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setDueDateText(dueDate.toISOString().slice(0, 10));
    }
  }, [dueDate]);

  const addVocab = () => {
    const list = criteria.requiredVocabulary ?? [];
    setCriteria({
      ...criteria,
      requiredVocabulary: [...list, { word: "", synonyms: [], importance: "required" }],
    });
  };

  const updateVocab = (index: number, key: keyof RequiredVocabulary, value: any) => {
    const list = [...(criteria.requiredVocabulary ?? [])];
    list[index] = { ...list[index], [key]: value } as RequiredVocabulary;
    setCriteria({ ...criteria, requiredVocabulary: list });
  };

  const removeVocab = (index: number) => {
    const list = [...(criteria.requiredVocabulary ?? [])];
    list.splice(index, 1);
    setCriteria({ ...criteria, requiredVocabulary: list });
  };

  const updateBandDescriptor = (band: number, descriptor: string) => {
    const list = [...(criteria.bandDescriptors ?? [])];
    const idx = list.findIndex((d) => d.band === band);
    const entry: BandDescriptor = { band, descriptor };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    setCriteria({ ...criteria, bandDescriptors: list });
  };

  const submit = async (status: "draft" | "published") => {
    if (!title.trim() || !prompt.trim() || !classId) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đủ tiêu đề, đề bài và chọn lớp.");
      return;
    }
    setSaving(true);
    try {
      await assignmentApi.create({
        classId,
        title: title.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim(),
        dueDate: dueDate.toISOString(),
        maxAttempts: Number(maxAttempts) || 1,
        gradingCriteria: criteria,
        status,
      });
      router.navigate("/teacher/assignments");
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate("/teacher/assignments")}>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài tập</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Thông tin cơ bản</Text>

        <Text style={styles.label}>Tiêu đề *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Tiêu đề bài tập"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Mô tả ngắn..."
          placeholderTextColor={Colors.textMuted}
        />



        <Text style={styles.label}>Đề bài *</Text>
        <TextInput
          style={[styles.input, { minHeight: 100 }]}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Đề bài cho học sinh..."
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Lớp học *</Text>
        <TouchableOpacity
          style={styles.select}
          onPress={() => setShowClassPicker(true)}
        >
          <Text style={styles.selectText}>
            {classes.find((c) => c._id === classId)?.name ?? "Chọn lớp"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Hạn nộp *</Text>
        {Platform.OS === "web" ? (
          <TextInput
            style={styles.input}
            value={dueDateText}
            onChangeText={(value) => {
              setDueDateText(value);
              const parsed = new Date(value);
              if (!Number.isNaN(parsed.getTime())) setDueDate(parsed);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectText}>{dueDate.toDateString()}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Số lần nộp tối đa</Text>
        <TextInput
          style={styles.input}
          value={maxAttempts}
          onChangeText={setMaxAttempts}
          keyboardType="numeric"
        />

        <Text style={styles.sectionHeader}>📋 Tiêu chí chấm điểm (VSTEP)</Text>
        <Text style={styles.sectionHint}>
          Các tiêu chí này sẽ được gửi kèm cho AI khi chấm bài của học sinh
        </Text>

        <Text style={styles.criteriaLabel}>Tổng quan yêu cầu bài viết</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={criteria.overview ?? ""}
          onChangeText={(v) => setCriteria((prev) => ({ ...prev, overview: v }))}
        />

        <Text style={styles.criteriaLabel}>Từ vựng yêu cầu</Text>
        <Text style={styles.criteriaHint}>
          Thêm từ vựng học sinh nên dùng. Nếu không dùng đúng từ, AI sẽ trừ điểm Lexical Resource.
        </Text>
        {(criteria.requiredVocabulary ?? []).map((v, i) => (
          <View key={i} style={styles.vocabRow}>
            <TextInput
              style={styles.vocabInput}
              placeholder="Từ chính"
              value={v.word}
              onChangeText={(word) => updateVocab(i, "word", word)}
            />
            <TextInput
              style={styles.vocabSynInput}
              placeholder="Từ đồng nghĩa (cách nhau bằng dấu phẩy)"
              value={(v.synonyms ?? []).join(", ")}
              onChangeText={(s) =>
                updateVocab(
                  i,
                  "synonyms",
                  s.split(",").map((x) => x.trim()).filter(Boolean),
                )
              }
            />
            <View style={styles.importanceRow}>
              {(["required", "recommended"] as const).map((imp) => (
                <TouchableOpacity
                  key={imp}
                  style={[styles.impBtn, v.importance === imp && styles.impBtnActive]}
                  onPress={() => updateVocab(i, "importance", imp)}
                >
                  <Text style={styles.impBtnText}>
                    {imp === "required" ? "Bắt buộc" : "Khuyến khích"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => removeVocab(i)}>
              <Text style={styles.removeBtn}>✕ Xóa</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addVocab}>
          <Text style={styles.addBtnText}>+ Thêm từ vựng</Text>
        </TouchableOpacity>

        <Text style={styles.criteriaLabel}>Tiêu chí theo thang điểm VSTEP</Text>
        {BAND_LEVELS.map((band) => (
          <View key={band} style={styles.bandRow}>
            <View style={styles.bandBadge}>
              <Text style={styles.bandBadgeText}>{band.toFixed(1)}</Text>
            </View>
            <TextInput
              style={styles.bandInput}
              multiline
              placeholder={`Mô tả bài đạt ${band.toFixed(1)} điểm...`}
              value={
                (criteria.bandDescriptors ?? []).find((d) => d.band === band)?.descriptor ?? ""
              }
              onChangeText={(v) => updateBandDescriptor(band, v)}
            />
          </View>
        ))}

        <Text style={styles.criteriaLabel}>Yêu cầu cấu trúc bài</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={criteria.structureRequirements ?? ""}
          onChangeText={(v) => setCriteria((prev) => ({ ...prev, structureRequirements: v }))}
        />

        <Text style={styles.criteriaLabel}>⚠️ Lỗi bị trừ điểm nặng</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={criteria.penaltyNotes ?? ""}
          onChangeText={(v) => setCriteria((prev) => ({ ...prev, penaltyNotes: v }))}
        />

        <Text style={styles.criteriaLabel}>Ghi chú thêm cho AI chấm bài</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={criteria.additionalNotes ?? ""}
          onChangeText={(v) => setCriteria((prev) => ({ ...prev, additionalNotes: v }))}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.draftBtn]}
            onPress={() => submit("draft")}
            disabled={saving}
          >
            <Text style={styles.actionBtnText}>Lưu nháp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.publishBtn]}
            onPress={() => submit("published")}
            disabled={saving}
          >
            <Text style={[styles.actionBtnText, { color: Colors.surface }]}>Xuất bản ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showClassPicker} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn lớp</Text>
            {classes.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={styles.modalOption}
                onPress={() => {
                  setClassId(c._id);
                  setShowClassPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowClassPicker(false)}
            >
              <Text style={styles.modalCancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) setDueDate(date);
          }}
        />
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
  content: { padding: Spacing.lg, paddingBottom: 40 },
  sectionHeader: { ...Typography.heading3, marginBottom: Spacing.sm },
  sectionHint: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md },
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
  toggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: "center" },
  toggleActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  toggleText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: "600" },
  toggleTextActive: { color: Colors.primary },
  select: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    marginBottom: Spacing.md,
  },
  selectText: { ...Typography.body },
  criteriaLabel: { ...Typography.body, fontWeight: "700", marginTop: Spacing.md, marginBottom: Spacing.xs },
  criteriaHint: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  vocabRow: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  vocabInput: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  vocabSynInput: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  importanceRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  impBtn: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.sm, borderRadius: Radius.md, alignItems: "center" },
  impBtnActive: { backgroundColor: Colors.primaryLight },
  impBtnText: { ...Typography.caption, fontWeight: "700" },
  removeBtn: { ...Typography.caption, color: Colors.error, textAlign: "right" },
  addBtn: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.sm, alignItems: "center" },
  addBtnText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: "700" },
  bandRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "flex-start", marginBottom: Spacing.sm },
  bandBadge: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingVertical: 4, paddingHorizontal: 8 },
  bandBadgeText: { ...Typography.caption, fontWeight: "700", color: Colors.primary },
  bandInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm },
  actionRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  actionBtn: { flex: 1, borderRadius: Radius.lg, paddingVertical: 14, alignItems: "center", ...Shadow.sm },
  draftBtn: { backgroundColor: Colors.surfaceAlt },
  publishBtn: { backgroundColor: Colors.primary },
  actionBtnText: { ...Typography.body, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: Spacing.lg },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, width: "100%", ...Shadow.md },
  modalTitle: { ...Typography.heading3, marginBottom: Spacing.md },
  modalOption: { paddingVertical: 10 },
  modalOptionText: { ...Typography.body },
  modalCancel: { marginTop: Spacing.md, alignItems: "center" },
  modalCancelText: { ...Typography.body, color: Colors.textSecondary },
});



