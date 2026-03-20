import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ChevronDown,
  History,
  Home,
  TrendingUp,
  LayoutDashboard,
  Users,
  CreditCard,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { getAuthUser } from "../../services/api";

const roleLabelMap = {
  teacher: "Giáo viên",
  center_student: "Học sinh trung tâm",
  free_student: "Học sinh tự do",
};

export default function HomeHeader() {
  const user = getAuthUser();
  const displayName = user?.name?.trim() || "Người dùng";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const roleLabel = roleLabelMap[user?.role] || "Học sinh";

  const navItems = useMemo(() => {
    if (user?.role === "teacher" || user?.role === "admin") {
      return [
        { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
        { label: "Lớp học", to: "/teacher/classes", icon: Users },
        { label: "Bài tập", to: "/teacher/assignments", icon: BookOpen },
        { label: "Tiến độ", to: "/progress", icon: TrendingUp },
        { label: "Gói dịch vụ", to: "/subscription", icon: CreditCard },
      ];
    }

    return [
      { label: "Trang chủ", to: "/home", icon: Home },
      { label: "Bài tập", to: "/assignments", icon: BookOpen },
      { label: "Lịch sử", to: "/essay/history", icon: History },
      { label: "Tiến độ", to: "/progress", icon: TrendingUp },
      ...(user?.role !== "center_student"
        ? [{ label: "Gói dịch vụ", to: "/subscription", icon: CreditCard }]
        : []),
    ];
  }, [user?.role]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .ea-header {
          font-family: 'Inter', system-ui, sans-serif;
        }

        .ea-nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          transition: all 0.18s ease;
          white-space: nowrap;
          letter-spacing: -0.1px;
        }

        .ea-nav-link:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.07);
        }

        .ea-nav-link.active {
          color: #58cc02;
          background: rgba(88,204,2,0.12);
        }

        .ea-nav-link.active svg {
          color: #58cc02;
        }

        .ea-avatar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .ea-avatar-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(88,204,2,0.3);
        }

        .ea-avatar {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: linear-gradient(135deg, #58cc02 0%, #3d9400 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          flex-shrink: 0;
        }

        .ea-avatar-name {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          line-height: 1;
        }

        .ea-avatar-role {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          line-height: 1;
          margin-top: 2px;
        }

        .ea-bell-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
          flex-shrink: 0;
        }

        .ea-bell-btn:hover {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.8);
        }

        .ea-bell-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #58cc02;
          border: 1.5px solid #0f1117;
        }

        .ea-bottom-accent {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(88,204,2,0.25) 30%, rgba(88,204,2,0.25) 70%, transparent 100%);
        }

        @media (max-width: 768px) {
          .ea-avatar-info { display: none; }
          .ea-chevron { display: none; }
          .ea-nav-label { display: none; }
        }
      `}</style>

      <header
        className="ea-header sticky top-0 z-50"
        style={{
          background: "rgba(15, 17, 23, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 32px",
            gap: "24px",
          }}
        >
          <NavLink
            to="/home"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "11px",
                background: "linear-gradient(135deg, #58cc02 0%, #3d9400 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.5px",
                boxShadow: "0 4px 12px rgba(88,204,2,0.3)",
                flexShrink: 0,
              }}
            >
              EA
            </div>
            <div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.3px",
                  margin: 0,
                }}
              >
                Essay AI
              </p>
            </div>
          </NavLink>

          <nav
            style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "auto" }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn("ea-nav-link", isActive && "active")
                  }
                >
                  <Icon size={14} strokeWidth={2.2} />
                  <span className="ea-nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>

            <NavLink to="/profile" style={{ textDecoration: "none" }}>
              <div className="ea-avatar-btn">
                <div className="ea-avatar">{initials || "EA"}</div>
                <div className="ea-avatar-info">
                  <p className="ea-avatar-name">{displayName}</p>
                  <p className="ea-avatar-role">{roleLabel}</p>
                </div>
                <ChevronDown
                  size={13}
                  strokeWidth={2.5}
                  color="rgba(255,255,255,0.3)"
                  className="ea-chevron"
                />
              </div>
            </NavLink>
          </div>
        </div>

        <div className="ea-bottom-accent" />
      </header>
    </>
  );
}
