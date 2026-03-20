import React, { useState } from "react";
import {
  User, Phone, GraduationCap, Pencil, Lock, BookOpen,
  MessageCircle, Star, ShieldCheck, FileText, LogOut,
  ChevronRight, Trash2,
} from "lucide-react";

import { toast } from "sonner";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";
import { getAuthUser, clearAuthSession } from "../services/api";
import LogoutDialog from "../components/ui/LogoutDialog";

// ─── Helpers ────────────────────────────────────────────────────────────────
function roleLabel(role) {
  switch (role) {
    case "admin": return "Quản trị";
    case "teacher": return "Giáo viên";
    case "center_student": return "Học sinh trung tâm";
    default: return "Học sinh tự do";
  }
}

// ─── Sidebar Nav Item ────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
        active
          ? "bg-[#58cc02]/15 text-[#3d9400]"
          : "text-[#6e6e73] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
      }`}
    >
      <Icon size={17} className={active ? "text-[#58cc02]" : "text-[#aaa] group-hover:text-[#555]"} />
      <span className="text-[13.5px] font-semibold tracking-[-0.1px]">{label}</span>
    </button>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-[#aaa]">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-[#e8e8ed] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {children}
      </div>
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon, accent = "#6e6e73" }) {
  return (
    <div className="flex items-center gap-5 border-b border-[#f0f0f5] px-6 py-4 last:border-0">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: accent + "18" }}
      >
        <Icon size={17} style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">{label}</p>
        <p className="mt-0.5 truncate text-[14px] font-semibold text-[#1d1d1f]">{value}</p>
      </div>
    </div>
  );
}

// ─── Action Row ──────────────────────────────────────────────────────────────
function ActionRow({ icon: Icon, label, sublabel, onClick, accent, danger }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-5 border-b border-[#f0f0f5] px-6 py-4 text-left transition-colors last:border-0 ${
        danger ? "hover:bg-red-50/60" : "hover:bg-[#fafafa]"
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105"
        style={{ backgroundColor: danger ? "#fee2e2" : accent + "18" }}
      >
        <Icon size={17} style={{ color: danger ? "#ef4444" : accent }} />
      </div>
      <div className="flex-1">
        <p
          className="text-[14px] font-semibold"
          style={{ color: danger ? "#ef4444" : "#1d1d1f" }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-[12px] text-[#aaa]">{sublabel}</p>
        )}
      </div>
      <ChevronRight size={15} className="text-[#ccc] transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = getAuthUser();
  const [activeTab, setActiveTab] = useState("account");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const displayName = user?.name ?? "—";
  const displayEmail = user?.email ?? user?.phone ?? "—";
  const displayRole = roleLabel(user?.role);
  const initials = displayName.split(" ").pop()?.[0]?.toUpperCase() || "E";

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setLoggingOut(true);
    clearAuthSession();
    toast.success("Đã đăng xuất thành công");
    window.location.href = "/login";
  };

  const NAV_SECTIONS = [
    {
      title: "Tài khoản",
      items: [
        { id: "account", icon: User, label: "Hồ sơ" },
        { id: "settings", icon: Lock, label: "Bảo mật" },
      ],
    },
    {
      title: "Khám phá",
      items: [
        { id: "docs", icon: BookOpen, label: "Tài liệu IELTS" },
        { id: "support", icon: MessageCircle, label: "Hỗ trợ" },
      ],
    },
    {
      title: "Khác",
      items: [
        { id: "legal", icon: ShieldCheck, label: "Pháp lý" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans">
      <HomeHeader />

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Avatar card */}
            <div className="overflow-hidden rounded-2xl border border-[#e8e8ed] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {/* green band */}
              <div className="h-20 bg-gradient-to-r from-[#58cc02] to-[#3aac00]" />
              <div className="-mt-10 flex flex-col items-center px-6 pb-6 pt-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#58cc02] to-[#3d9400] text-2xl font-black text-white shadow-md">
                  {initials}
                </div>
                <h2 className="mt-3 text-center text-[16px] font-extrabold leading-snug text-[#1d1d1f]">
                  {displayName}
                </h2>
                <span className="mt-1.5 rounded-full bg-[#58cc02]/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3d9400]">
                  {displayRole}
                </span>
                <div className="mt-4 grid w-full grid-cols-2 gap-2 border-t border-[#f0f0f5] pt-4">
                  <div className="text-center">
                    <p className="text-[18px] font-black text-[#1d1d1f]">24</p>
                    <p className="text-[11px] text-[#aaa]">Bài viết</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-black text-[#58cc02]">6.5</p>
                    <p className="text-[11px] text-[#aaa]">Band TB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="overflow-hidden rounded-2xl border border-[#e8e8ed] bg-white px-3 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {NAV_SECTIONS.map((sec) => (
                <div key={sec.title} className="mb-3 last:mb-0">
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.8px] text-[#ccc]">
                    {sec.title}
                  </p>
                  {sec.items.map((item) => (
                    <NavItem
                      key={item.id}
                      {...item}
                      active={activeTab === item.id}
                      onClick={() => setActiveTab(item.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="min-w-0">
            <h1 className="mb-6 font-display text-[24px] font-extrabold tracking-tight text-[#1d1d1f]">
              {activeTab === "account" && "Hồ sơ của tôi"}
              {activeTab === "settings" && "Bảo mật"}
              {activeTab === "docs" && "Tài liệu IELTS"}
              {activeTab === "support" && "Hỗ trợ"}
              {activeTab === "legal" && "Pháp lý"}
            </h1>

            {/* ACCOUNT TAB */}
            {activeTab === "account" && (
              <>
                <Section title="Thông tin tài khoản">
                  <InfoRow label="Họ và tên" value={displayName} icon={User} accent="#0ea5e9" />
                  <InfoRow label="Email / SĐT" value={displayEmail} icon={Phone} accent="#8b5cf6" />
                  <InfoRow label="Vai trò" value={displayRole} icon={GraduationCap} accent="#58cc02" />
                </Section>

                <Section title="Chỉnh sửa hồ sơ">
                  <ActionRow
                    icon={Pencil}
                    label="Sửa tên"
                    sublabel="Cập nhật tên hiển thị của bạn"
                    accent="#0ea5e9"
                    onClick={() => toast.info("Chức năng sửa tên đang được phát triển.")}
                  />
                  <ActionRow
                    icon={Star}
                    label="Đánh giá ứng dụng"
                    sublabel="Giúp chúng tôi cải thiện Essay AI"
                    accent="#f97316"
                    onClick={() => toast.success("Cảm ơn bạn đã đánh giá!")}
                  />
                </Section>

                {/* Danger zone */}
                <div className="mt-2">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-[#aaa]">Phiên đăng nhập</p>
                  <div className="overflow-hidden rounded-2xl border border-[#fecaca] bg-white shadow-[0_2px_12px_rgba(239,68,68,0.07)]">
                    <ActionRow
                      icon={LogOut}
                      label={loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
                      danger
                      onClick={handleLogout}
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-[#f0f0f5] pt-6">
                  <p className="text-[12px] text-[#ccc]">Essay AI · Phiên bản 1.0.0</p>
                  <button
                    onClick={() => toast.error("Vui lòng liên hệ support@essayai.app để xóa tài khoản.")}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={13} /> Xóa tài khoản
                  </button>
                </div>
              </>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <Section title="Bảo mật tài khoản">
                <ActionRow
                  icon={Lock}
                  label="Đổi mật khẩu"
                  sublabel="Giữ tài khoản của bạn an toàn"
                  accent="#8b5cf6"
                  onClick={() => toast.info("Chức năng đổi mật khẩu đang được phát triển.")}
                />
              </Section>
            )}

            {/* DOCS TAB */}
            {activeTab === "docs" && (
              <Section title="Tài liệu miễn phí">
                <ActionRow
                  icon={BookOpen}
                  label="Mẹo viết IELTS Writing"
                  sublabel="Band 7+ trong 30 ngày"
                  accent="#10b981"
                  onClick={() => toast.success("Kho tài liệu sẽ sớm ra mắt!")}
                />
              </Section>
            )}

            {/* SUPPORT TAB */}
            {activeTab === "support" && (
              <Section title="Liên hệ & Hỗ trợ">
                <ActionRow
                  icon={MessageCircle}
                  label="Liên hệ hỗ trợ"
                  sublabel="support@essayai.app"
                  accent="#f59e0b"
                  onClick={() => toast.info("Gửi email tới support@essayai.app")}
                />
              </Section>
            )}

            {/* LEGAL TAB */}
            {activeTab === "legal" && (
              <Section title="Pháp lý">
                <ActionRow
                  icon={ShieldCheck}
                  label="Chính sách bảo mật"
                  accent="#6e6e73"
                  onClick={() => toast.info("Đang mở chính sách bảo mật...")}
                />
                <ActionRow
                  icon={FileText}
                  label="Điều khoản dịch vụ"
                  accent="#6e6e73"
                  onClick={() => toast.info("Đang mở điều khoản dịch vụ...")}
                />
              </Section>
            )}
          </main>
        </div>
      </div>
      <HomeFooter />

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        isLoggingOut={loggingOut}
      />
    </div>
  );
}