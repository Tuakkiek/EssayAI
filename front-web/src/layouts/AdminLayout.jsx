import { LayoutDashboard, Users, User, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Profile", to: "/admin/profile", icon: User },
];

const getNavClassName = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
    isActive ? "bg-primaryLight text-primaryDark" : "text-gray-600 hover:bg-gray-100",
  ].join(" ");

function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-surface px-4 py-6 md:flex md:flex-col">
        <div className="mb-8 px-2">
          <p className="text-2xl font-extrabold text-primary">Essay AI</p>
          <p className="text-xs text-textMuted">Admin Panel</p>
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

      <div className="flex min-h-screen flex-col md:ml-64">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Essay AI - Admin</p>
            <div className="flex items-center gap-3">
              <p className="hidden text-sm text-textMuted sm:block">{user?.name || "Admin"}</p>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
