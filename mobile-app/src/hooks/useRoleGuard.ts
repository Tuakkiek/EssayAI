import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { router, useRootNavigationState, useSegments } from "expo-router";
import { useAuth, UserRole } from "../context/AuthContext";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/(admin)/admin/dashboard",
  teacher: "/(teacher)/progress",
  center_student: "/(student)",
  free_student: "/(student)",
};

export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const isFocused = useIsFocused();
  const allowedRolesKey = [...new Set(allowedRoles)].sort().join("|");

  useEffect(() => {
    if (!isFocused) return;
    if (isLoading || !rootNavigationState?.key || segments.length === 0) return;

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
  }, [
    isFocused,
    isLoading,
    isAuthenticated,
    user,
    allowedRolesKey,
    rootNavigationState?.key,
    segments,
  ]);
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
