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

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
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
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      {showArrow && <Text style={[styles.menuArrow, danger && { color: Colors.error }]}>›</Text>}
    </TouchableOpacity>
  );
}

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
      Alert.alert("Lỗi", "Tên không được để trống.");
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
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Sửa tên</Text>
          <Text style={styles.modalSubtitle}>
            Tên này sẽ hiển thị cho giáo viên và trong hồ sơ của bạn.
          </Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            autoCapitalize="words"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color={Colors.surface} /> : <Text style={styles.modalSaveText}>Lưu</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ.");
      return;
    }
    if (next.length < 8) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu mới phải ít nhất 8 ký tự.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("Không khớp", "Mật khẩu mới và xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await userApi.changePassword(current, next);
      Alert.alert("Thành công", "Mật khẩu đã được cập nhật.", [{ text: "OK", onPress: handleClose }]);
    } catch (err) {
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.modalSheet, { paddingBottom: 40 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
          <Text style={styles.modalSubtitle}>
            Nhập mật khẩu hiện tại để đặt mật khẩu mới.
          </Text>

          {([
            { label: "Mật khẩu hiện tại", value: current, set: setCurrent, placeholder: "••••••••" },
            { label: "Mật khẩu mới", value: next, set: setNext, placeholder: "Ít nhất 8 ký tự" },
            { label: "Xác nhận mật khẩu mới", value: confirm, set: setConfirm, placeholder: "Nhập lại mật khẩu" },
          ] as const).map((field) => (
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
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color={Colors.surface} /> : <Text style={styles.modalSaveText}>Cập nhật</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [changePwdVisible, setChangePwdVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.name ?? "—";
  const displayEmail = user?.email ?? user?.phone ?? "—";
  const displayRole =
    user?.role === "admin"
      ? "Quản trị"
      : user?.role === "teacher"
        ? "Giáo viên"
        : user?.role === "center_student"
          ? "Học sinh trung tâm"
          : "Học sinh tự do";

  const handleSaveName = useCallback(
    async (newName: string) => {
      await userApi.updateProfile({ name: newName });
      await refreshUser({ name: newName });
    },
    [refreshUser],
  );

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
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
      "Xóa tài khoản",
      "Hành động này không thể hoàn tác. Tất cả bài luận và tiến độ sẽ bị xóa.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Liên hệ hỗ trợ",
              "Để xóa tài khoản vĩnh viễn, vui lòng liên hệ support@essayai.app",
            ),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <AvatarPicker userId={user?.id ?? ""} currentAvatar={avatarUrl} onUploadDone={setAvatarUrl} />
        <Text style={styles.heroName}>{displayName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{displayRole}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Thông tin tài khoản" />
        <View style={styles.card}>
          <InfoRow label="Họ và tên" value={displayName} icon="👤" />
          <View style={styles.rowDivider} />
          <InfoRow label="Email / Phone" value={displayEmail} icon="✉️" />
          <View style={styles.rowDivider} />
          <InfoRow label="Vai trò" value={displayRole} icon="🎓" />
        </View>

        <SectionHeader title="Cài đặt hồ sơ" />
        <View style={styles.card}>
          <MenuItem icon="✏️" label="Sửa tên" sublabel="Cập nhật tên hiển thị" onPress={() => setEditNameVisible(true)} />
          <View style={styles.rowDivider} />
          <MenuItem icon="🔒" label="Đổi mật khẩu" sublabel="Giữ tài khoản an toàn" onPress={() => setChangePwdVisible(true)} />
        </View>

        <SectionHeader title="Hỗ trợ" />
        <View style={styles.card}>
          <MenuItem
            icon="📚"
            label="Mẹo viết IELTS"
            sublabel="Tài liệu miễn phí"
            onPress={() => Alert.alert("Sắp ra mắt", "Kho tài liệu sẽ có trong bản cập nhật tới!")}
          />
          <View style={styles.rowDivider} />
          <MenuItem
            icon="💬"
            label="Liên hệ hỗ trợ"
            sublabel="support@essayai.app"
            onPress={() => Alert.alert("Hỗ trợ", "Gửi email tới support@essayai.app")}
          />
          <View style={styles.rowDivider} />
          <MenuItem
            icon="⭐"
            label="Đánh giá ứng dụng"
            sublabel="Giúp chúng tôi cải thiện"
            onPress={() => Alert.alert("Cảm ơn!", "Đang chuyển đến App Store…")}
          />
        </View>

        <SectionHeader title="Pháp lý" />
        <View style={styles.card}>
          <MenuItem icon="🔐" label="Chính sách bảo mật" onPress={() => Alert.alert("Chính sách bảo mật", "Đang mở chính sách bảo mật…")} />
          <View style={styles.rowDivider} />
          <MenuItem icon="📄" label="Điều khoản dịch vụ" onPress={() => Alert.alert("Điều khoản", "Đang mở điều khoản dịch vụ…")} />
        </View>

        <SectionHeader title="Phiên" />
        <View style={styles.card}>
          <MenuItem
            icon="🚪"
            label={loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
            onPress={handleLogout}
            danger
            showArrow={false}
          />
        </View>

        <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={styles.deleteLinkText}>Xóa tài khoản</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Essay AI · v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditNameModal
        visible={editNameVisible}
        currentName={displayName}
        onClose={() => setEditNameVisible(false)}
        onSave={handleSaveName}
      />
      <ChangePasswordModal visible={changePwdVisible} onClose={() => setChangePwdVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroName: { ...Typography.heading2, color: Colors.surface, fontWeight: "800", marginTop: Spacing.sm },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  roleText: { ...Typography.caption, color: Colors.surface, fontWeight: "700", letterSpacing: 0.5 },
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
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: "hidden", ...Shadow.sm },
  rowDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  infoIcon: { fontSize: 18, width: 24, textAlign: "center" },
  infoContent: { flex: 1 },
  infoLabel: { ...Typography.caption, color: Colors.textMuted, fontWeight: "600", marginBottom: 2 },
  infoValue: { ...Typography.body, color: Colors.text, fontWeight: "500" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  menuItemDanger: { backgroundColor: Colors.errorLight + "20" },
  menuIconWrap: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  menuIconDanger: { backgroundColor: Colors.errorLight },
  menuIcon: { fontSize: 17 },
  menuContent: { flex: 1 },
  menuLabel: { ...Typography.body, fontWeight: "600", color: Colors.text },
  menuSublabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 20, color: Colors.textMuted },
  deleteLink: { alignItems: "center", marginTop: Spacing.xl, paddingVertical: Spacing.sm },
  deleteLinkText: { ...Typography.bodySmall, color: Colors.error, fontWeight: "600", textDecorationLine: "underline" },
  version: { ...Typography.caption, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.md },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: Spacing.sm },
  modalTitle: { ...Typography.heading3 },
  modalSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
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
  modalActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center" },
  modalCancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: "600" },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: "center", ...Shadow.sm },
  modalSaveText: { ...Typography.body, color: Colors.surface, fontWeight: "700" },
  pwdField: { gap: Spacing.xs },
  pwdLabel: { ...Typography.caption, fontWeight: "700", color: Colors.textSecondary },
});
