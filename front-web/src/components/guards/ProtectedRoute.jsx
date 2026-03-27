import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const getHomePathByRole = (role) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "teacher") {
    return "/teacher/progress";
  }

  if (role === "center_student" || role === "free_student") {
    return "/student";
  }

  return "/login";
};

function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-medium text-textMuted">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathByRole(user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
