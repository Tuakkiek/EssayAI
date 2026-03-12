import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { teacherApi } from "@/src/services/api";

interface FormData {
  centerName: string;
  address: string;
  phone: string;
  description: string;
}

interface FormErrors {
  centerName?: string;
  address?: string;
  phone?: string;
}

export default function CreateCenterScreen() {
  const [form, setForm] = useState<FormData>({
    centerName: "",
    address: "",
    phone: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.centerName.trim()) newErrors.centerName = "Center name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await teacherApi.createCenter({
        name: form.centerName.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
      });
      Alert.alert("Success", "Center created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Failed to create center. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setField = (field: keyof FormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Center</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Set up a new learning center for your students.
          </Text>

          {/* Center Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Center Name *</Text>
            <TextInput
              style={[styles.input, errors.centerName && styles.inputError]}
              placeholder="e.g. Sunrise IELTS Center"
              placeholderTextColor="#9CA3AF"
              value={form.centerName}
              onChangeText={setField("centerName")}
            />
            {errors.centerName && (
              <Text style={styles.errorText}>{errors.centerName}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              placeholder="Full address of the center"
              placeholderTextColor="#9CA3AF"
              value={form.address}
              onChangeText={setField("address")}
              multiline
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="e.g. 0901 234 567"
              placeholderTextColor="#9CA3AF"
              value={form.phone}
              onChangeText={setField("phone")}
              keyboardType="phone-pad"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of your center..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={setField("description")}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitText}>Create Center</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scroll: { padding: 20, gap: 20 },
  subtitle: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  inputError: { borderColor: "#EF4444" },
  textArea: { minHeight: 100, paddingTop: 12 },
  errorText: { fontSize: 12, color: "#EF4444" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
