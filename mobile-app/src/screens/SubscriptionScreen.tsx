import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme";
import { subscriptionApi, getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface PlanConfig {
  id: string;
  name: string;
  priceVND: number;
  priceUSD: number;
  durationDays: number;
  essaysPerMonth: number;
  features: string[];
  popular: boolean;
}

interface SubscriptionStatus {
  plan: string;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  endDate: string | null;
}

interface PaymentInstructions {
  transactionId: string;
  referenceCode: string;
  amountVND: number;
  bankInstructions: {
    bankId: string;
    bankAccount: string;
    accountName: string;
    amountVND: number;
    description: string;
    qrCodeUrl: string;
    expiresAt: string;
  };
}

const ROLE_PLAN_PREFIXES: Record<string, string[]> = {
  free_student: ["individual_free", "individual_pro"],
  center_student: [],
  teacher: ["free", "starter", "pro", "enterprise"],
  admin: ["free", "starter", "pro", "enterprise"],
};

const fmtVND = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && !Number.isNaN(value) ? value : fallback;

const toString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

const formatLimit = (value: number, label: string) =>
  value === -1 ? `Không giới hạn ${label}` : `${value} ${label}`;

const buildFeatures = (
  maxStudents: number | null,
  maxTeachers: number | null,
  essaysPerMonth: number | null,
  aiGradingEnabled: boolean,
) => {
  const items: string[] = [];
  if (typeof maxStudents === "number") items.push(formatLimit(maxStudents, "học viên"));
  if (typeof maxTeachers === "number" && maxTeachers > 0)
    items.push(formatLimit(maxTeachers, "giáo viên"));
  if (typeof essaysPerMonth === "number") {
    items.push(
      essaysPerMonth === -1
        ? "AI chấm không giới hạn"
        : `AI chấm ${essaysPerMonth} bài/tháng`,
    );
  }
  if (!aiGradingEnabled) items.push("Không hỗ trợ AI chấm bài");
  return items;
};

const normalizePlans = (raw: unknown): PlanConfig[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const id = toString((item as any)?.id);
      const name = toString((item as any)?.name, id);
      const priceVND = toNumber((item as any)?.priceVND ?? (item as any)?.priceVnd);
      const priceUSD = toNumber((item as any)?.priceUSD ?? (item as any)?.priceUsd);
      const durationDays = toNumber((item as any)?.durationDays ?? (item as any)?.duration);
      const essaysPerMonth = typeof (item as any)?.essaysPerMonth === "number"
        ? (item as any).essaysPerMonth
        : typeof (item as any)?.maxEssaysPerMonth === "number"
          ? (item as any).maxEssaysPerMonth
          : -1;
      const maxStudents = typeof (item as any)?.maxStudents === "number" ? (item as any).maxStudents : null;
      const maxTeachers = typeof (item as any)?.maxTeachers === "number" ? (item as any).maxTeachers : null;
      const aiGradingEnabled = (item as any)?.aiGradingEnabled !== false;
      let features = toStringArray((item as any)?.features);
      if (!features.length) {
        features = buildFeatures(maxStudents, maxTeachers, essaysPerMonth, aiGradingEnabled);
      }
      return {
        id,
        name,
        priceVND,
        priceUSD,
        durationDays,
        essaysPerMonth,
        features,
        popular: Boolean((item as any)?.popular),
      } as PlanConfig;
    })
    .filter((p) => p.id);
};

function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  canUpgrade,
}: {
  plan: PlanConfig;
  isCurrentPlan: boolean;
  onSelect: () => void;
  canUpgrade: boolean;
}) {
  const isPaid = plan.priceVND > 0;
  const isFree = plan.id === "free" || plan.id === "individual_free";

  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <View
      style={[
        styles.planCard,
        plan.popular && styles.planCardPopular,
        isCurrentPlan && styles.planCardActive,
      ]}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>PHỔ BIẾN NHẤT</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isPaid ? (
          <View>
            <Text style={styles.planPrice}>{fmtVND(plan.priceVND)}</Text>
            <Text style={styles.planPeriod}>/tháng</Text>
          </View>
        ) : (
          <Text style={styles.planFree}>{isFree ? "Miễn phí" : "Liên hệ"}</Text>
        )}
      </View>

      <Text style={styles.essayLimit}>
        {plan.essaysPerMonth === -1 ? "✦ Không giới hạn bài" : `${plan.essaysPerMonth} bài / tháng`}
      </Text>

      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={[styles.featureCheck, plan.popular && { color: Colors.primary }]}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {isCurrentPlan ? (
        <View style={styles.currentBtn}>
          <Text style={styles.currentBtnText}>✓ Gói hiện tại</Text>
        </View>
      ) : isPaid ? (
        <TouchableOpacity
          style={[
            styles.selectBtn,
            plan.popular && styles.selectBtnPrimary,
            !canUpgrade && styles.selectBtnDisabled,
          ]}
          onPress={canUpgrade ? onSelect : undefined}
          activeOpacity={0.85}
          disabled={!canUpgrade}
        >
          <Text
            style={[
              styles.selectBtnText,
              plan.popular && styles.selectBtnTextPrimary,
              !canUpgrade && styles.selectBtnTextDisabled,
            ]}
          >
            {canUpgrade ? `Nâng cấp lên ${plan.name}` : "Liên hệ quản trị để nâng cấp"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PaymentModal({
  instructions,
  onClose,
  onDone,
}: {
  instructions: PaymentInstructions;
  onClose: () => void;
  onDone: () => void;
}) {
  const b = instructions.bankInstructions;
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    Alert.alert("Đã sao chép!", `${label}: ${value}`);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Hoàn tất thanh toán</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Số tiền cần chuyển</Text>
            <Text style={styles.amountValue}>{fmtVND(b.amountVND)}</Text>
          </View>

          <TouchableOpacity style={styles.qrBtn} onPress={() => Linking.openURL(b.qrCodeUrl)} activeOpacity={0.85}>
            <Text style={styles.qrBtnIcon}>📷</Text>
            <Text style={styles.qrBtnText}>Mở VietQR Code</Text>
            <Text style={styles.qrBtnArrow}>↗</Text>
          </TouchableOpacity>

          <Text style={styles.orDivider}>— hoặc chuyển khoản thủ công —</Text>

          {([
            { label: "Ngân hàng", value: b.bankId },
            { label: "Số tài khoản", value: b.bankAccount },
            { label: "Tên tài khoản", value: b.accountName },
            { label: "Số tiền (VND)", value: b.amountVND.toLocaleString("vi-VN") },
          ] as const).map(({ label, value }) => (
            <TouchableOpacity key={label} style={styles.detailRow} onPress={() => copy(value, label)}>
              <View>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
              <Text style={styles.copyIcon}>{copied === label ? "✓" : "⎘"}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.detailRow, styles.detailRowHighlight]}
            onPress={() => copy(b.description, "Nội dung")}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: Colors.error }]}>⚠️ Nội dung chuyển khoản (BẮT BUỘC)</Text>
              <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: "700" }]}>
                {b.description}
              </Text>
              <Text style={styles.descHint}>
                Bạn BẮT BUỘC phải ghi đúng nội dung này để hệ thống tự động kích hoạt.
              </Text>
            </View>
            <Text style={styles.copyIcon}>{copied === "Nội dung" ? "✓" : "⎘"}</Text>
          </TouchableOpacity>

          <Text style={styles.expiryNote}>
            Lệnh thanh toán này hết hạn lúc {fmtDate(b.expiresAt)}.{"\n"}
            Tài khoản sẽ được kích hoạt tự động trong vài phút sau khi chuyển khoản thành công.
          </Text>

          <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Tôi đã chuyển khoản xong</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function CenterStudentView({ status }: { status: SubscriptionStatus | null }) {
  return (
    <View style={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}></Text>
        <Text style={styles.infoTitle}>Tài khoản trung tâm</Text>
        <Text style={styles.infoDesc}>
          Gói dịch vụ của bạn được quản lý bởi trung tâm. Liên hệ giáo viên hoặc quản trị viên để nâng cấp.
        </Text>
        {status && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: status.isActive ? Colors.successLight : Colors.surfaceAlt, marginTop: Spacing.lg },
            ]}
          >
            <Text style={styles.statusPlan}>
              {status.isActive ? "🌟" : "🆓"} Gói {status.plan.charAt(0).toUpperCase() + status.plan.slice(1)}
            </Text>
            {status.daysRemaining != null && <Text style={styles.statusDays}>{status.daysRemaining} ngày còn lại</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const role = user?.role ?? "free_student";
  const allowedIds = ROLE_PLAN_PREFIXES[role] ?? [];
  const canViewStatus = role === "admin";
  const canUpgrade = role === "admin";

  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const loadPlans = async () => {
      try {
        const r = await subscriptionApi.getPlans();
        if (!alive) return;
        setPlans(normalizePlans(r.data?.data?.plans));
      } catch (err) {
        if (alive) Alert.alert("Lỗi", getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    };

    const loadStatus = async () => {
      try {
        const r = await subscriptionApi.getStatus();
        if (!alive) return;
        setStatus(r.data?.data ?? null);
      } catch (err) {
        if (alive) Alert.alert("Lỗi", getErrorMessage(err));
      }
    };

    loadPlans();
    if (canViewStatus) {
      loadStatus();
    } else {
      setStatus(null);
    }

    return () => {
      alive = false;
    };
  }, [canViewStatus]);

  const handleUpgrade = async (planId: string) => {
    if (!canUpgrade) {
      Alert.alert("Không đủ quyền", "Chỉ quản trị viên mới có thể nâng cấp gói.");
      return;
    }
    setUpgrading(true);
    try {
      const res = await subscriptionApi.checkout(planId);
      const d = res.data;
      if (!d.success && !d.data) throw new Error(d.message ?? "Không thể tạo lệnh thanh toán");
      setInstructions(d.data || d);
    } catch (err) {
      Alert.alert("Lỗi", getErrorMessage(err));
    } finally {
      setUpgrading(false);
    }
  };

  const handlePaymentDone = () => {
    setInstructions(null);
    Alert.alert(
      "Đã gửi lệnh chuyển khoản!",
      "Tài khoản sẽ tự động kích hoạt sau khi xác nhận (thường 1–5 phút).",
      [{ text: "OK", onPress: () => subscriptionApi.getStatus().then((r) => setStatus(r.data?.data)).catch(() => null) }],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (role === "center_student") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gói dịch vụ</Text>
        </View>
        <CenterStudentView status={status} />
      </View>
    );
  }

  const visiblePlans = allowedIds.length
    ? plans.filter((p) => allowedIds.some((id) => p.id.startsWith(id.split("_")[0]) || p.id === id))
    : plans;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gói dịch vụ</Text>
        <Text style={styles.headerSub}>Nâng cao điểm IELTS với AI feedback</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {status && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: status.isActive && status.plan !== "free" ? Colors.successLight : Colors.surfaceAlt },
            ]}
          >
            <View>
              <Text style={styles.statusPlan}>
                {status.isActive && status.plan !== "free" ? "🌟" : "🆓"} Gói {status.plan.charAt(0).toUpperCase() + status.plan.slice(1)}
              </Text>
              {status.daysRemaining != null && <Text style={styles.statusDays}>{status.daysRemaining} ngày còn lại</Text>}
            </View>
            {status.endDate && <Text style={styles.statusEnd}>Gia hạn {fmtDate(status.endDate)}</Text>}
          </View>
        )}

        {visiblePlans.filter((p) => p.id !== "enterprise").map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={status?.plan === plan.id}
            onSelect={() => handleUpgrade(plan.id)}
            canUpgrade={canUpgrade}
          />
        ))}

        {(role === "teacher" || role === "admin") && (
          <View style={styles.enterpriseCard}>
            <Text style={styles.enterpriseTitle}>Dành cho trung tâm</Text>
            <Text style={styles.enterpriseDesc}>
              Giá theo thỏa thuận cho trường và trung tâm. Bao gồm bảng điều khiển giáo viên, quản lý học sinh và báo cáo.
            </Text>
            <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
              <Text style={styles.contactBtnText}>Liên hệ Sales</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {upgrading && (
        <View style={styles.upgradingOverlay}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.upgradingText}>Đang chuẩn bị thanh toán...</Text>
        </View>
      )}

      {instructions && (
        <PaymentModal instructions={instructions} onClose={() => setInstructions(null)} onDone={handlePaymentDone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: Spacing.xl },
  headerTitle: { ...Typography.heading1, color: Colors.surface, fontWeight: "800" },
  headerSub: { ...Typography.body, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  content: { padding: Spacing.lg },
  statusBanner: { borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  statusPlan: { ...Typography.heading3 },
  statusDays: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  statusEnd: { ...Typography.caption },
  planCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  planCardPopular: { borderColor: Colors.primary, borderWidth: 2 },
  planCardActive: { borderColor: Colors.success, borderWidth: 2 },
  popularBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, alignSelf: "flex-start", paddingHorizontal: Spacing.md, paddingVertical: 3, marginBottom: Spacing.md },
  popularText: { fontSize: 10, fontWeight: "800", color: Colors.surface, letterSpacing: 0.8 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  planName: { ...Typography.heading2 },
  planPrice: { fontSize: 20, fontWeight: "800", color: Colors.primary, textAlign: "right" },
  planPeriod: { ...Typography.caption, textAlign: "right" },
  planFree: { ...Typography.body, color: Colors.success, fontWeight: "700" },
  essayLimit: { ...Typography.bodySmall, fontWeight: "700", color: Colors.textSecondary, marginBottom: Spacing.md },
  featureList: { gap: Spacing.xs, marginBottom: Spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  featureCheck: { color: Colors.success, fontWeight: "700", marginTop: 1 },
  featureText: { ...Typography.bodySmall, flex: 1 },
  selectBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  selectBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectBtnText: { ...Typography.body, fontWeight: "700", color: Colors.primary },
  selectBtnTextPrimary: { color: Colors.surface },
  selectBtnDisabled: { borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  selectBtnTextDisabled: { color: Colors.textMuted },
  currentBtn: { backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  currentBtnText: { ...Typography.body, fontWeight: "700", color: Colors.success },
  enterpriseCard: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.primary + "40" },
  enterpriseTitle: { ...Typography.heading3, marginBottom: Spacing.sm },
  enterpriseDesc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  contactBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  contactBtnText: { ...Typography.body, fontWeight: "700", color: Colors.surface },
  upgradingOverlay: { position: "absolute", bottom: 20, left: 20, right: 20, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md, ...Shadow.md },
  upgradingText: { ...Typography.body, color: Colors.textSecondary },
  infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: "center", ...Shadow.sm },
  infoIcon: { fontSize: 48, marginBottom: Spacing.md },
  infoTitle: { ...Typography.heading2, textAlign: "center", marginBottom: Spacing.sm },
  infoDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.xl, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: 56 },
  modalTitle: { ...Typography.heading2 },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalContent: { padding: Spacing.xl, paddingBottom: 48 },
  amountBox: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: "center", marginBottom: Spacing.lg },
  amountLabel: { ...Typography.label, marginBottom: Spacing.xs },
  amountValue: { fontSize: 32, fontWeight: "800", color: Colors.primary },
  qrBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  qrBtnIcon: { fontSize: 22 },
  qrBtnText: { flex: 1, ...Typography.body, fontWeight: "700", color: Colors.surface },
  qrBtnArrow: { color: Colors.surface, fontSize: 18 },
  orDivider: { ...Typography.bodySmall, textAlign: "center", color: Colors.textMuted, marginBottom: Spacing.lg },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  detailRowHighlight: { borderColor: Colors.error + "50", backgroundColor: Colors.errorLight + "30" },
  detailLabel: { ...Typography.caption, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { ...Typography.body, fontWeight: "600" },
  descHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  copyIcon: { fontSize: 18, color: Colors.textMuted },
  expiryNote: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginVertical: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md },
  doneBtn: { backgroundColor: Colors.success, borderRadius: Radius.lg, paddingVertical: 16, alignItems: "center", ...Shadow.md },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: Colors.surface },
});

