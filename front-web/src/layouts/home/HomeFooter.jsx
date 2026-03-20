import { Link } from "react-router-dom";
import {
  Home,
  BookOpen,
  History,
  TrendingUp,
  UserCircle,
  Facebook,
  Twitter,
  Youtube,
  PenLine,
  BrainCircuit,
  BarChart2,
  ScrollText,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  BookMarked,
  Target,
  ChevronRight,
  Mail,
  LayoutDashboard,
  Users,
  CreditCard,
} from "lucide-react";
import { getAuthUser } from "../../services/api";

export default function HomeFooter() {
  const user = getAuthUser();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const navLinks = isTeacher ? [
    { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Lớp học", to: "/teacher/classes", icon: Users },
    { label: "Bài tập", to: "/teacher/assignments", icon: BookOpen },
    { label: "Tiến độ", to: "/progress", icon: TrendingUp },
    { label: "Gói dịch vụ", to: "/subscription", icon: CreditCard },
  ] : [
    { label: "Trang chủ", to: "/home", icon: Home },
    { label: "Bài tập", to: "/assignments", icon: BookOpen },
    { label: "Lịch sử", to: "/essay/history", icon: History },
    { label: "Tiến độ", to: "/progress", icon: TrendingUp },
    ...(user?.role !== "center_student"
      ? [{ label: "Gói dịch vụ", to: "/subscription", icon: CreditCard }]
      : []),
    { label: "Tài khoản", to: "/profile", icon: UserCircle },
  ];

  const featureLinks = isTeacher ? [
    { label: "Quản lý lớp học", to: "/teacher/classes", icon: Users },
    { label: "Tạo bài tập AI", to: "/teacher/assignments/create", icon: BrainCircuit },
    { label: "Chấm bài & Nhận xét", to: "/teacher/assignments", icon: PenLine },
    { label: "Phân tích lớp học", to: "/progress", icon: BarChart2 },
  ] : [
    { label: "Luyện Writing IELTS", to: "/assignments", icon: PenLine },
    { label: "Chấm bài AI", to: "/assignments", icon: BrainCircuit },
    { label: "Theo dõi tiến độ", to: "/progress", icon: BarChart2 },
    { label: "Lịch sử bài viết", to: "/essay/history", icon: ScrollText },
  ];

  const socials = [
    { label: "Facebook", href: "#", icon: Facebook },
    { label: "Twitter/X", href: "#", icon: Twitter },
    { label: "YouTube", href: "#", icon: Youtube },
    { label: "Email", href: "#", icon: Mail },
  ];

  const support = [
    { label: "Hướng dẫn sử dụng", to: "#", icon: BookMarked },
    { label: "Câu hỏi thường gặp", to: "#", icon: HelpCircle },
    { label: "Liên hệ hỗ trợ", to: "#", icon: MessageCircle },
    { label: "Chính sách bảo mật", to: "#", icon: ShieldCheck },
  ];
  return (
    <footer
      style={{
        background: "linear-gradient(160deg, #0f1117 0%, #1a1d2e 100%)",
        borderTop: "1px solid rgba(88,204,2,0.15)",
        fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, #58cc02, #a3e635, transparent)",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          width: "100%",
          padding: "56px 64px 0",
          boxSizing: "border-box",
        }}
      >
        {/* Main grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "48px",
            alignItems: "start",
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #58cc02 0%, #3d9400 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                  boxShadow: "0 4px 16px rgba(88,204,2,0.3)",
                }}
              >
                EA
              </div>
              <div>
                <p
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.3px",
                    margin: 0,
                  }}
                >
                  Essay AI
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#58cc02",
                    fontWeight: 500,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  IELTS Writing Coach
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.5)",
                maxWidth: "280px",
                margin: 0,
              }}
            >
              Nền tảng luyện viết ESSAY thông minh — được hỗ trợ bởi AI để giúp bạn nâng band mỗi ngày.
            </p>

            {/* Band score badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(88,204,2,0.08)",
                border: "1px solid rgba(88,204,2,0.2)",
                borderRadius: "10px",
                padding: "8px 14px",
                width: "fit-content",
              }}
            >
              <Target size={18} color="#58cc02" />
              <div>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  Mục tiêu trung bình
                </p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#58cc02", margin: 0 }}>
                  Band 7.0+ Writing
                </p>
              </div>
            </div>

            {/* Socials */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.5)",
                      transition: "all 0.2s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(88,204,2,0.15)";
                      e.currentTarget.style.borderColor = "rgba(88,204,2,0.3)";
                      e.currentTarget.style.color = "#58cc02";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation column */}
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: "20px",
              }}
            >
              Điều hướng
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.55)",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "color 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#58cc02")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                  >
                    <Icon size={14} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Features column */}
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: "20px",
              }}
            >
              Tính năng
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {featureLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.55)",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "color 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#58cc02")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                  >
                    <Icon size={14} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Support column */}
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: "20px",
              }}
            >
              Hỗ trợ
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {support.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    style={{
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.55)",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "color 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#58cc02")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                  >
                    <Icon size={14} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            margin: "48px 0 24px",
          }}
        />

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "28px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
            © {new Date().getFullYear()} Essay AI. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Điều khoản sử dụng", "Chính sách riêng tư", "Cookie"].map((label) => (
              <a
                key={label}
                href="#"
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}