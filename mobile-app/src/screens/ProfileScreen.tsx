import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { useAuth } from "../context/AuthContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { userApi, getErrorMessage } from "../services/api";

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ─── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Menu Item ─────────────────────────────────────────────────────────────────
function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
  danger,
  showArrow = true,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  showArrow?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, danger && styles.menuItemDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={styles.menuSublabel}>{sublabel}</Text>
        ) : null}
      </View>
      {showArrow && (
        <Text style={[styles.menuArrow, danger && { color: Colors.error }]}>
          ›
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Edit Name Modal ───────────────────────────────────────────────────────────
function EditNameModal({
  visible,
  currentName,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    if (trimmed === currentName) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Edit Name</Text>
          <Text style={styles.modalSubtitle}>
            This name will be displayed to your teacher and in your profile.
          </Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            autoCapitalize="words"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (next.length < 8) {
      Alert.alert("Weak password", "New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await userApi.changePassword(current, next);
      Alert.alert("Success", "Your password has been updated.", [
        { text: "OK", onPress: handleClose },
      ]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalSheet, { paddingBottom: 40 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Change Password</Text>
          <Text style={styles.modalSubtitle}>
            Enter your current password to set a new one.
          </Text>

          {(
            [
              {
                label: "Current Password",
                value: current,
                set: setCurrent,
                placeholder: "••••••••",
              },
              {
                label: "New Password",
                value: next,
                set: setNext,
                placeholder: "At least 8 characters",
              },
              {
                label: "Confirm New Password",
                value: confirm,
                set: setConfirm,
                placeholder: "Repeat new password",
              },
            ] as const
          ).map((field) => (
            <View key={field.label} style={styles.pwdField}>
              <Text style={styles.pwdLabel}>{field.label}</Text>
              <TextInput
                style={styles.modalInput}
                value={field.value}
                onChangeText={field.set}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>
          ))}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={handleClose}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={styles.modalSaveText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [changePwdVisible, setChangePwdVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.name ?? "—";
  const displayEmail = user?.email ?? "—";
  const displayRole =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "teacher"
        ? "Teacher"
        : user?.role === "center_student"
          ? "Center Student"
          : "Free Student";

  const handleSaveName = useCallback(async (newName: string) => {
    await userApi.updateProfile({ name: newName });
    // In a real app you'd also refresh the user in AuthContext here
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your essays and progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Contact Support",
              "To permanently delete your account, please contact support@essayai.app",
            ),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header hero */}
      <View style={styles.hero}>
        <AvatarPicker
          userId={user?.id ?? ""}
          currentAvatar={avatarUrl}
          onUploadDone={setAvatarUrl}
        />
        <Text style={styles.heroName}>{displayName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{displayRole}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account info */}
        <SectionHeader title="Account Info" />
        <View style={styles.card}>
          <InfoRow label="Full Name" value={displayName} icon="👤" />
          <View style={styles.rowDivider} />
          <InfoRow label="Email" value={displayEmail} icon="✉️" />
          <View style={styles.rowDivider} />
          <InfoRow label="Role" value={displayRole} icon="🎓" />
        </View>

        {/* Profile settings */}
        <SectionHeader title="Profile Settings" />
        <View style={styles.card}>
          <MenuItem
            icon="✏️"
            label="Edit Name"
            sublabel="Update your display name"
            onPress={() => setEditNameVisible(true)}
          />
          <View style={styles.rowDivider} />
          <MenuItem
            icon="🔒"
            label="Change Password"
            sublabel="Keep your account secure"
            onPress={() => setChangePwdVisible(true)}
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <MenuItem
            icon="📖"
            label="IELTS Writing Tips"
            sublabel="Free guides & resources"
            onPress={() =>
              Alert.alert("Coming soon", "Tips library coming in next update!")
            }
          />
          <View style={styles.rowDivider} />
          <MenuItem
            icon="💬"
            label="Contact Support"
            sublabel="support@essayai.app"
            onPress={() =>
              Alert.alert("Support", "Email us at support@essayai.app")
            }
          />
          <View style={styles.rowDivider} />
          <MenuItem
            icon="⭐"
            label="Rate This App"
            sublabel="Help us improve"
            onPress={() =>
              Alert.alert("Thank you!", "Redirecting to App Store…")
            }
          />
        </View>

        {/* Legal */}
        <SectionHeader title="Legal" />
        <View style={styles.card}>
          <MenuItem
            icon="📄"
            label="Privacy Policy"
            onPress={() =>
              Alert.alert("Privacy Policy", "Opening privacy policy…")
            }
          />
          <View style={styles.rowDivider} />
          <MenuItem
            icon="📋"
            label="Terms of Service"
            onPress={() =>
              Alert.alert("Terms", "Opening terms of service…")
            }
          />
        </View>

        {/* Session */}
        <SectionHeader title="Session" />
        <View style={styles.card}>
          <MenuItem
            icon="🚪"
            label={loggingOut ? "Signing out…" : "Sign Out"}
            onPress={handleLogout}
            danger
            showArrow={false}
          />
        </View>

        {/* Danger zone */}
        <TouchableOpacity
          style={styles.deleteLink}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteLinkText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Essay AI · v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <EditNameModal
        visible={editNameVisible}
        currentName={displayName}
        onClose={() => setEditNameVisible(false)}
        onSave={handleSaveName}
      />
      <ChangePasswordModal
        visible={changePwdVisible}
        onClose={() => setChangePwdVisible(false)}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroName: {
    ...Typography.heading2,
    color: Colors.surface,
    fontWeight: "800",
    marginTop: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Content
  content: { padding: Spacing.lg },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow.sm,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: "center" },
  infoContent: { flex: 1 },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: { ...Typography.body, color: Colors.text, fontWeight: "500" },

  // Menu item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemDanger: { backgroundColor: Colors.errorLight + "20" },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: { backgroundColor: Colors.errorLight },
  menuIcon: { fontSize: 17 },
  menuContent: { flex: 1 },
  menuLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  menuSublabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 20, color: Colors.textMuted },

  // Delete + version
  deleteLink: { alignItems: "center", marginTop: Spacing.xl, paddingVertical: Spacing.sm },
  deleteLinkText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  version: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  modalTitle: { ...Typography.heading3 },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalCancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: "600" },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    ...Shadow.sm,
  },
  modalSaveText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },

  // Change password
  pwdField: { gap: Spacing.xs },
  pwdLabel: { ...Typography.caption, fontWeight: "700", color: Colors.textSecondary },
});
