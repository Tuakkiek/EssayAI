import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Lock, Phone } from "lucide-react";
import apiClient, { api, saveAuthSession } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginPayload, setLoginPayload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loginPayload) return;

    let ignore = false;

    const loginUser = async () => {
      setIsSubmitting(true);

      try {
        const response = await apiClient.post(api.auth.login, loginPayload);
        const token = response?.data?.data?.token;
        const user = response?.data?.data?.user;
        if (token) saveAuthSession(token, user);
        if (!ignore) {
          toast.success("Đăng nhập thành công.");
          const target = (user?.role === "teacher" || user?.role === "admin") ? "/teacher/dashboard" : "/home";
          navigate(target);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ??
          "Đăng nhập thất bại. Vui lòng thử lại.";
        if (!ignore) {
          toast.error(message);
        }
      } finally {
        if (!ignore) {
          setIsSubmitting(false);
        }
      }
    };

    loginUser();

    return () => {
      ignore = true;
    };
  }, [loginPayload]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoginPayload({
      phone: String(formData.get("phone") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7f7] px-4 py-10 text-[#1d1d1f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,204,2,0.18),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-3xl font-extrabold tracking-tight text-[#58cc02]">
            Essay AI
          </p>
          <p className="mt-2 text-sm text-[#6e6e73]">
            Đăng nhập để tiếp tục luyện viết.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#e5e5ea] bg-white/90 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="grid w-full grid-cols-2 rounded-full bg-[#f0f0f0] p-1 text-sm font-semibold">
            <div className="rounded-full bg-white px-4 py-2 text-center text-[#58cc02] shadow-sm">
              Đăng nhập
            </div>
            <Link
              to="/register"
              className="rounded-full px-4 py-2 text-center text-[#6e6e73] hover:text-[#1d1d1f]"
            >
              Đăng ký
            </Link>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="loginPhone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                <Input
                  id="loginPhone"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Mật khẩu</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                <Input
                  id="loginPassword"
                  name="password"
                  type="password"
                  placeholder="********"
                  className="pl-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <p className="text-center text-sm text-[#6e6e73]">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#58cc02] hover:underline"
              >
                Đăng ký
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-6 space-y-2 text-center text-xs text-[#6e6e73]">
          <p>Chào mừng bạn quay lại với Essay AI.</p>
        </div>
      </div>
    </main>
  );
}
