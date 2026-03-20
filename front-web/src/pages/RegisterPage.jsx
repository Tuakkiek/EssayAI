import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import {
  BookOpen,
  Building2,
  GraduationCap,
  Lock,
  Phone,
  User,
} from "lucide-react";
import { cn } from "../lib/utils";
import apiClient, { api, saveAuthSession } from "../services/api";

const roles = [
  {
    value: "student",
    title: "Học sinh",
    desc: "Luyện tập tự do",
    icon: GraduationCap,
  },
  {
    value: "teacher",
    title: "Giáo viên",
    desc: "Quản lý lớp học",
    icon: BookOpen,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [registerPayload, setRegisterPayload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!registerPayload) return;

    let ignore = false;

    const registerUser = async () => {
      setIsSubmitting(true);

      try {
        const response = await apiClient.post(api.auth.register, registerPayload);
        const token = response?.data?.data?.token;
        const user = response?.data?.data?.user;
        if (token) saveAuthSession(token, user);
        if (!ignore) {
          toast.success("Đăng ký thành công. Đang chuyển tới trang Home.");
          navigate("/home");
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ??
          "Đăng ký thất bại. Vui lòng thử lại.";
        if (!ignore) {
          toast.error(message);
        }
      } finally {
        if (!ignore) {
          setIsSubmitting(false);
        }
      }
    };

    registerUser();

    return () => {
      ignore = true;
    };
  }, [registerPayload]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const apiRole = role === "teacher" ? "teacher" : "free_student";

    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      role: apiRole,
    };

    if (apiRole === "teacher") {
      payload.centerName = String(formData.get("centerName") ?? "").trim();
    }

    setRegisterPayload(payload);
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
            Tạo tài khoản để bắt đầu luyện viết.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#e5e5ea] bg-white/90 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="grid w-full grid-cols-2 rounded-full bg-[#f0f0f0] p-1 text-sm font-semibold">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-center text-[#6e6e73] hover:text-[#1d1d1f]"
            >
              Đăng nhập
            </Link>
            <div className="rounded-full bg-white px-4 py-2 text-center text-[#58cc02] shadow-sm">
              Đăng ký
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="registerFullName">Họ và tên</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                <Input
                  id="registerFullName"
                  name="name"
                  placeholder="Nguyễn Văn A"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registerPhone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                <Input
                  id="registerPhone"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Bạn là</Label>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((item) => {
                  const active = role === item.value;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      aria-pressed={active}
                      className="text-left"
                    >
                      <Card
                        className={cn(
                          "transition",
                          active
                            ? "border-[#58cc02] bg-[#e9f9d6]"
                            : "border-[#e5e5ea]",
                        )}
                      >
                        <CardContent className="space-y-2 text-center">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white">
                            <Icon
                              className={cn(
                                "h-5 w-5",
                                active
                                  ? "text-[#58cc02]"
                                  : "text-[#6e6e73]",
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {item.title}
                            </p>
                            <p className="text-xs text-[#6e6e73]">
                              {item.desc}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </div>

            {role === "teacher" && (
              <div className="space-y-2">
                <Label htmlFor="registerCenter">Tên trung tâm / Tổ chức</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                  <Input
                    id="registerCenter"
                    name="centerName"
                    placeholder="VD: Trung tâm Anh ngữ ABC"
                    className="pl-11"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="registerPassword">Mật khẩu</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                <Input
                  id="registerPassword"
                  name="password"
                  type="password"
                  placeholder="Tối thiểu 6 kí tự"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registerConfirm">Xác nhận lại mật khẩu</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]" />
                <Input
                  id="registerConfirm"
                  name="confirmPassword"
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
              {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>

            <p className="text-center text-sm text-[#6e6e73]">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#58cc02] hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-6 space-y-2 text-center text-xs text-[#6e6e73]">
          <p>Hệ thống sẽ gửi thông báo xác nhận sau khi đăng ký thành công.</p>
        </div>
      </div>
    </main>
  );
}
