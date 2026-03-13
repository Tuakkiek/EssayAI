import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth, UserRole } from "../context/AuthContext";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  center_student: "/",
  free_student: "/",
};

export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      console.warn(
        `[useRoleGuard] Access denied: role "${user.role}" tried to access ` +
          `a route restricted to [${allowedRoles.join(", ")}]. ` +
          `Redirecting to ${ROLE_HOME[user.role]}.`,
      );
      router.replace(ROLE_HOME[user.role] as any);
    }
  }, [isLoading, isAuthenticated, user, allowedRoles]);
}

/**
 * Returns true only if the current user has one of the allowed roles.
 * Use this for conditional rendering within a shared screen.
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
