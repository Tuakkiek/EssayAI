import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/api/client";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const getRedirectPath = (role) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "teacher") {
    return "/teacher/progress";
  }

  return "/student";
};

function LoginPage() {
  usePageTitle("Login");
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    }
    if (!password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(phone.trim(), password);
      navigate(getRedirectPath(user?.role), { replace: true });
      toast.success("Đăng nhập thành công.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="mb-1 text-center text-2xl font-bold text-gray-900">Đăng nhập</h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chào mừng bạn quay lại Essay AI</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          icon={<Phone className="h-4 w-4" />}
          error={errors.phone}
          autoComplete="tel"
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          icon={<Lock className="h-4 w-4" />}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Đăng nhập
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-semibold text-primary hover:text-primaryDark">
          Đăng ký ngay
        </Link>
      </p>
    </Card>
  );
}

export default LoginPage;
