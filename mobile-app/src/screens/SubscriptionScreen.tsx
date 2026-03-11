import React, { useState, useEffect } from "react"
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Modal
} from "react-native"
import { Colors, Spacing, Typography, Radius, Shadow } from "@/constants/theme"
import { API_BASE_URL } from "../config/api"

// ── Types (mirrors backend) ───────────────────────────────────────
interface PlanConfig {
  id:             string
  name:           string
  priceVND:       number
  priceUSD:       number
  durationDays:   number
  essaysPerMonth: number
  features:       string[]
  popular:        boolean
}

interface SubscriptionStatus {
  plan:           string
  isActive:       boolean
  isExpired:      boolean
  daysRemaining:  number | null
  endDate:        string | null
}

interface PaymentInstructions {
  transactionId:  string
  referenceCode:  string
  amountVND:      number
  bankInstructions: {
    bankId:        string
    bankAccount:   string
    accountName:   string
    amountVND:     number
    description:   string
    qrCodeUrl:     string
    expiresAt:     string
  }
}

// ── Inline API calls (keeps screen self-contained) ────────────────
const TEMP_USER_ID = "507f1f77bcf86cd799439011"  // Replace with auth context

const fetchPlans = (): Promise<PlanConfig[]> =>
  fetch(`${API_BASE_URL}/payment/plans`).then((r) => r.json()).then((d) => d.data?.plans ?? [])

const fetchStatus = (): Promise<SubscriptionStatus> =>
  fetch(`${API_BASE_URL}/payment/status?userId=${TEMP_USER_ID}`).then((r) => r.json()).then((d) => d.data)

const initiatePayment = (plan: string): Promise<PaymentInstructions> =>
  fetch(`${API_BASE_URL}/payment/initiate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId: TEMP_USER_ID, plan }),
  }).then((r) => r.json()).then((d) => {
    if (!d.success) throw new Error(d.message ?? "Payment initiation failed")
    return d.data
  })

// ── Format helpers ────────────────────────────────────────────────
const fmtVND = (n: number) => n.toLocaleString("vi-VN") + "₫"
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

// ── Plan Card ─────────────────────────────────────────────────────
function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
}: {
  plan:          PlanConfig
  isCurrentPlan: boolean
  onSelect:      () => void
}) {
  const isPaid = plan.priceVND > 0
  const isFree = plan.id === "free"

  return (
    <View style={[
      styles.planCard,
      plan.popular && styles.planCardPopular,
      isCurrentPlan && styles.planCardActive,
    ]}>
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isPaid ? (
          <View>
            <Text style={styles.planPrice}>{fmtVND(plan.priceVND)}</Text>
            <Text style={styles.planPeriod}>/month</Text>
          </View>
        ) : isFree ? (
          <Text style={styles.planFree}>Free forever</Text>
        ) : (
          <Text style={styles.planEnterprise}>Contact us</Text>
        )}
      </View>

      <Text style={styles.essayLimit}>
        {plan.essaysPerMonth === -1 ? "✦ Unlimited essays" : `${plan.essaysPerMonth} essays / month`}
      </Text>

      <View style={styles.featureList}>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={[styles.featureCheck, plan.popular && { color: Colors.primary }]}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {isCurrentPlan ? (
        <View style={styles.currentBtn}>
          <Text style={styles.currentBtnText}>✓ Current Plan</Text>
        </View>
      ) : isPaid ? (
        <TouchableOpacity
          style={[styles.selectBtn, plan.popular && styles.selectBtnPrimary]}
          onPress={onSelect}
          activeOpacity={0.85}
        >
          <Text style={[styles.selectBtnText, plan.popular && styles.selectBtnTextPrimary]}>
            Upgrade to {plan.name}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

// ── Payment Instructions Modal ────────────────────────────────────
function PaymentModal({
  instructions,
  onClose,
  onDone,
}: {
  instructions: PaymentInstructions
  onClose: () => void
  onDone:  () => void
}) {
  const b = instructions.bankInstructions
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (value: string, label: string) => {
    // Clipboard.setStringAsync is from expo-clipboard
    // Using Alert as fallback — replace with Clipboard in production
    Alert.alert("Copied!", `${label}: ${value}`)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Payment</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount to Transfer</Text>
            <Text style={styles.amountValue}>{fmtVND(b.amountVND)}</Text>
          </View>

          {/* QR Code hint */}
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => Linking.openURL(b.qrCodeUrl)}
            activeOpacity={0.85}
          >
            <Text style={styles.qrBtnIcon}>📷</Text>
            <Text style={styles.qrBtnText}>Open VietQR Code</Text>
            <Text style={styles.qrBtnArrow}>↗</Text>
          </TouchableOpacity>

          <Text style={styles.orDivider}>— or transfer manually —</Text>

          {/* Bank details */}
          {[
            { label: "Bank",           value: b.bankId },
            { label: "Account Number", value: b.bankAccount },
            { label: "Account Name",   value: b.accountName },
            { label: "Amount (VND)",   value: b.amountVND.toLocaleString("vi-VN") },
          ].map(({ label, value }) => (
            <TouchableOpacity key={label} style={styles.detailRow} onPress={() => copy(value, label)}>
              <View>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
              <Text style={styles.copyIcon}>{copied === label ? "✓" : "⎘"}</Text>
            </TouchableOpacity>
          ))}

          {/* Transfer description — critical */}
          <TouchableOpacity
            style={[styles.detailRow, styles.detailRowHighlight]}
            onPress={() => copy(b.description, "Description")}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: Colors.error }]}>
                ⚠️ Transfer Description (REQUIRED)
              </Text>
              <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: "700" }]}>
                {b.description}
              </Text>
              <Text style={styles.descHint}>
                You MUST include this exact code in the transfer memo for automatic activation.
              </Text>
            </View>
            <Text style={styles.copyIcon}>{copied === "Description" ? "✓" : "⎘"}</Text>
          </TouchableOpacity>

          {/* Expiry */}
          <Text style={styles.expiryNote}>
            ⏰ This payment reference expires at {fmtDate(b.expiresAt)}.
            {"\n"}Your subscription activates automatically within minutes after transfer.
          </Text>

          <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>I{"'"}ve Completed the Transfer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────
export default function SubscriptionScreen() {
  const [plans,        setPlans]        = useState<PlanConfig[]>([])
  const [status,       setStatus]       = useState<SubscriptionStatus | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [upgrading,    setUpgrading]    = useState(false)
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null)

  useEffect(() => {
    Promise.all([fetchPlans(), fetchStatus()])
      .then(([p, s]) => { setPlans(p); setStatus(s) })
      .catch((err) => Alert.alert("Error", err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    try {
      const result = await initiatePayment(planId)
      setInstructions(result)
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not initiate payment")
    } finally {
      setUpgrading(false)
    }
  }

  const handlePaymentDone = () => {
    setInstructions(null)
    Alert.alert(
      "Transfer Sent!",
      "Your subscription will activate automatically once your transfer is confirmed (usually within 1–5 minutes).",
      [{ text: "OK", onPress: () => fetchStatus().then(setStatus).catch(() => null) }]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plans & Pricing</Text>
        <Text style={styles.headerSub}>Improve your IELTS score with AI feedback</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Current status banner */}
        {status && (
          <View style={[
            styles.statusBanner,
            { backgroundColor: status.isActive && status.plan !== "free" ? Colors.successLight : Colors.surfaceAlt },
          ]}>
            <View>
              <Text style={styles.statusPlan}>
                {status.isActive && status.plan !== "free" ? "🌟" : "🆓"} {status.plan.charAt(0).toUpperCase() + status.plan.slice(1)} Plan
              </Text>
              {status.daysRemaining != null && (
                <Text style={styles.statusDays}>{status.daysRemaining} days remaining</Text>
              )}
            </View>
            {status.endDate && (
              <Text style={styles.statusEnd}>Renews {fmtDate(status.endDate)}</Text>
            )}
          </View>
        )}

        {/* Plan cards */}
        {plans.filter((p) => p.id !== "enterprise").map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={status?.plan === plan.id}
            onSelect={() => handleUpgrade(plan.id)}
          />
        ))}

        {/* Enterprise */}
        <View style={styles.enterpriseCard}>
          <Text style={styles.enterpriseTitle}>🏫 For Language Centers</Text>
          <Text style={styles.enterpriseDesc}>
            Custom pricing for schools and centers. Includes teacher dashboard,
            student management, and branded reports.
          </Text>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
            <Text style={styles.contactBtnText}>Contact Sales</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {upgrading && (
        <View style={styles.upgradingOverlay}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.upgradingText}>Preparing payment...</Text>
        </View>
      )}

      {instructions && (
        <PaymentModal
          instructions={instructions}
          onClose={() => setInstructions(null)}
          onDone={handlePaymentDone}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: Colors.background },
  center:               { flex: 1, justifyContent: "center", alignItems: "center" },
  header:               { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: Spacing.xl },
  headerTitle:          { ...Typography.heading1, color: Colors.surface, fontWeight: "800" },
  headerSub:            { ...Typography.body, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  content:              { padding: Spacing.lg },

  statusBanner:         { borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  statusPlan:           { ...Typography.heading3 },
  statusDays:           { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  statusEnd:            { ...Typography.caption },

  planCard:             { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  planCardPopular:      { borderColor: Colors.primary, borderWidth: 2 },
  planCardActive:       { borderColor: Colors.success, borderWidth: 2 },
  popularBadge:         { backgroundColor: Colors.primary, borderRadius: Radius.full, alignSelf: "flex-start", paddingHorizontal: Spacing.md, paddingVertical: 3, marginBottom: Spacing.md },
  popularText:          { fontSize: 10, fontWeight: "800", color: Colors.surface, letterSpacing: 0.8 },
  planHeader:           { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  planName:             { ...Typography.heading2 },
  planPrice:            { fontSize: 20, fontWeight: "800", color: Colors.primary, textAlign: "right" },
  planPeriod:           { ...Typography.caption, textAlign: "right" },
  planFree:             { ...Typography.body, color: Colors.success, fontWeight: "700" },
  planEnterprise:       { ...Typography.body, color: Colors.textSecondary },
  essayLimit:           { ...Typography.bodySmall, fontWeight: "700", color: Colors.textSecondary, marginBottom: Spacing.md },
  featureList:          { gap: Spacing.xs, marginBottom: Spacing.lg },
  featureRow:           { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  featureCheck:         { color: Colors.success, fontWeight: "700", marginTop: 1 },
  featureText:          { ...Typography.bodySmall, flex: 1 },
  selectBtn:            { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  selectBtnPrimary:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectBtnText:        { ...Typography.body, fontWeight: "700", color: Colors.primary },
  selectBtnTextPrimary: { color: Colors.surface },
  currentBtn:           { backgroundColor: Colors.successLight, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  currentBtnText:       { ...Typography.body, fontWeight: "700", color: Colors.success },

  enterpriseCard:   { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.primary + "40" },
  enterpriseTitle:  { ...Typography.heading3, marginBottom: Spacing.sm },
  enterpriseDesc:   { ...Typography.body, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  contactBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: "center" },
  contactBtnText:   { ...Typography.body, fontWeight: "700", color: Colors.surface },

  upgradingOverlay: { position: "absolute", bottom: 20, left: 20, right: 20, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md, ...Shadow.md },
  upgradingText:    { ...Typography.body, color: Colors.textSecondary },

  // Modal
  modalContainer:       { flex: 1, backgroundColor: Colors.background },
  modalHeader:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.xl, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: 56 },
  modalTitle:           { ...Typography.heading2 },
  modalClose:           { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalContent:         { padding: Spacing.xl, paddingBottom: 48 },
  amountBox:            { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: "center", marginBottom: Spacing.lg },
  amountLabel:          { ...Typography.label, marginBottom: Spacing.xs },
  amountValue:          { fontSize: 32, fontWeight: "800", color: Colors.primary },
  qrBtn:                { flexDirection: "row", alignItems: "center", gap: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  qrBtnIcon:            { fontSize: 22 },
  qrBtnText:            { flex: 1, ...Typography.body, fontWeight: "700", color: Colors.surface },
  qrBtnArrow:           { color: Colors.surface, fontSize: 18 },
  orDivider:            { ...Typography.bodySmall, textAlign: "center", color: Colors.textMuted, marginBottom: Spacing.lg },
  detailRow:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  detailRowHighlight:   { borderColor: Colors.error + "50", backgroundColor: Colors.errorLight + "30" },
  detailLabel:          { ...Typography.caption, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  detailValue:          { ...Typography.body, fontWeight: "600" },
  descHint:             { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  copyIcon:             { fontSize: 18, color: Colors.textMuted },
  expiryNote:           { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginVertical: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md },
  doneBtn:              { backgroundColor: Colors.success, borderRadius: Radius.lg, paddingVertical: 16, alignItems: "center", ...Shadow.md },
  doneBtnText:          { fontSize: 16, fontWeight: "700", color: Colors.surface },
})

