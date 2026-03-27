import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Phone, User, Building2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/api/client";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

const getRedirectPath = (role) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "teacher") {
    return "/teacher/progress";
  }

  return "/student";
};

function RegisterPage() {
  usePageTitle("Register");
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("free_student");
  const [centerName, setCenterName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = useMemo(
    () => [
      { label: "Học sinh", value: "free_student" },
      { label: "Giáo viên", value: "teacher" },
    ],
    [],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.name = "Vui lòng nhập họ và tên.";
    }

    if (!normalizedPhone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!PHONE_REGEX.test(normalizedPhone)) {
      nextErrors.phone = "Số điện thoại không đúng định dạng Việt Nam.";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
      nextErrors.password = "Mật khẩu cần ít nhất 6 ký tự.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (role === "teacher" && !centerName.trim()) {
      nextErrors.centerName = "Vui lòng nhập tên trung tâm/tổ chức.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await register(
        trimmedName,
        normalizedPhone,
        password,
        role,
        role === "teacher" ? centerName.trim() : undefined,
      );
      toast.success("Đăng ký thành công.");
      navigate(getRedirectPath(user?.role), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="mb-1 text-center text-2xl font-bold text-gray-900">Đăng ký tài khoản</h2>

      <div className="mb-6 mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-100 p-1">
        <Link
          to="/login"
          className="flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-gray-900"
        >
          Đăng nhập
        </Link>
        <span className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-primary">
          Đăng ký
        </span>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Họ và tên"
          placeholder="Nhập họ và tên"
          value={name}
          onChange={(event) => setName(event.target.value)}
          icon={<User className="h-4 w-4" />}
          error={errors.name}
          autoComplete="name"
        />

        <Input
          label="Số điện thoại"
          placeholder="Ví dụ: 0912345678"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          icon={<Phone className="h-4 w-4" />}
          error={errors.phone}
          autoComplete="tel"
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">Vai trò</p>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  role === option.value
                    ? "border-primary bg-primaryLight text-primaryDark"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {role === "teacher" ? (
          <Input
            label="Tên trung tâm/tổ chức"
            placeholder="Nhập tên trung tâm"
            value={centerName}
            onChange={(event) => setCenterName(event.target.value)}
            icon={<Building2 className="h-4 w-4" />}
            error={errors.centerName}
          />
        ) : null}

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Ít nhất 6 ký tự"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          icon={<Lock className="h-4 w-4" />}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          icon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Tạo tài khoản
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-semibold text-primary hover:text-primaryDark">
          Đăng nhập
        </Link>
      </p>
    </Card>
  );
}

export default RegisterPage;
