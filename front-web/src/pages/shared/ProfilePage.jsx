import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Edit3, KeyRound, LogOut, User } from "lucide-react";
import * as authApi from "@/api/auth";
import * as userApi from "@/api/user";
import { getErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const ROLE_CONFIG = {
  admin: { label: "Admin", badge: "bg-purple-100 text-purple-700" },
  teacher: { label: "Teacher", badge: "bg-blue-100 text-blue-700" },
  center_student: { label: "Student", badge: "bg-green-100 text-green-700" },
  free_student: { label: "Student", badge: "bg-green-100 text-green-700" },
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase() || "U";
};

function ProfilePage() {
  usePageTitle("Profile");
  const { user, logout, refreshUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNameInput(user?.name || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user?.name]);

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.free_student;
  const initials = useMemo(() => getInitials(user?.name || ""), [user?.name]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => userApi.updateProfile(payload),
    onSuccess: (response) => {
      const root = response?.data ?? {};
      const data = root?.data ?? root;
      const updatedName = data?.user?.name ?? data?.name ?? nameInput.trim();
      refreshUser({ name: updatedName });
      toast.success("Profile updated.");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword: oldPwd, newPassword: newPwd }) =>
      authApi.changePassword(oldPwd, newPwd),
    onSuccess: () => {
      refreshUser({ mustChangePassword: false });
      toast.success("Password changed.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSaveName = () => {
    const nextName = nameInput.trim();
    if (!nextName) {
      toast.error("Name is required.");
      return;
    }
    updateProfileMutation.mutate({ name: nextName });
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  const handleLogout = () => {
    const shouldLogout = window.confirm("Do you want to log out?");
    if (!shouldLogout) return;
    void logout();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account details and settings." />

      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primaryLight text-xl font-bold text-primaryDark">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user?.name || "Avatar"} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-gray-900">{user?.name || "User"}</p>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleConfig.badge}`}>
            {roleConfig.label}
          </span>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Account information</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Name</p>
            <p className="text-sm font-semibold text-gray-800">{user?.name || "-"}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Phone</p>
            <p className="text-sm font-semibold text-gray-800">{user?.phone || "-"}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Email</p>
            <p className="text-sm font-semibold text-gray-800">{user?.email || "-"}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500">Role</p>
            <p className="text-sm font-semibold text-gray-800">{roleConfig.label}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Profile settings</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Edit3 className="h-4 w-4" />} onClick={() => setIsEditOpen(true)}>
            Edit name
          </Button>
          <Button variant="secondary" icon={<KeyRound className="h-4 w-4" />} onClick={() => setIsPasswordOpen(true)}>
            Change password
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Support</h2>
        <p className="text-sm text-gray-600">IELTS writing tips (coming soon).</p>
        <p className="text-sm text-gray-600">Contact: support@essayai.app</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Session</h2>
        <Button variant="danger" icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
          Logout
        </Button>
      </Card>

      <p className="text-xs font-medium text-gray-400">Essay AI - v1.0.0</p>

      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit name" size="sm">
        <div className="space-y-4">
          <Input label="Name" value={nameInput} onChange={(event) => setNameInput(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveName} loading={updateProfileMutation.isPending}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} title="Change password" size="sm">
        <div className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleChangePassword} loading={changePasswordMutation.isPending}>
              Update password
            </Button>
            <Button variant="secondary" onClick={() => setIsPasswordOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProfilePage;
