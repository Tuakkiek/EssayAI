import { Home, TrendingUp, School, FileText, User, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Progress", to: "/teacher/progress", icon: TrendingUp, end: true },
  { label: "Classes", to: "/teacher/classes", icon: School },
  { label: "Assignments", to: "/teacher/assignments", icon: FileText },
  { label: "Profile", to: "/teacher/profile", icon: User },
];

const mobileNavItems = [
  { label: "Home", to: "/teacher", icon: Home, end: true },
  ...navItems,
];

const getNavClassName = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-primaryLight text-primaryDark" : "text-gray-600 hover:bg-gray-100",
  ].join(" ");

function TeacherLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-surface px-4 py-6 md:flex md:flex-col">
        <div className="mb-8 px-2">
          <p className="text-2xl font-extrabold text-primary">Essay AI</p>
          <p className="text-xs text-textMuted">Teacher Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={getNavClassName}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col pb-20 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between">
            <p className="text-xl font-extrabold text-primary md:hidden">Essay AI</p>
            <p className="hidden text-sm text-textMuted md:block">
              Teacher: <span className="font-semibold text-gray-800">{user?.name || "User"}</span>
            </p>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-surface md:hidden">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium",
                    isActive ? "text-primary" : "text-textMuted",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    <span
                      className={[
                        "h-1 w-1 rounded-full",
                        isActive ? "bg-primary" : "bg-transparent",
                      ].join(" ")}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default TeacherLayout;
