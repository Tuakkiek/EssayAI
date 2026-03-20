import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import apiClient, { api, getAuthUser } from "../services/api";
import HomeHeader from "../layouts/home/HomeHeader";
import GreetingSection from "../layouts/home/GreetingSection";
import HeroCard from "../layouts/home/HeroCard";
import QuickStats from "../layouts/home/QuickStats";
import AssignmentsCard from "../layouts/home/AssignmentsCard";
import ShortcutCard from "../layouts/home/ShortcutCard";
import HomeFooter from "../layouts/home/HomeFooter";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buổi sáng";
  if (hour < 18) return "Buổi chiều";
  return "Buổi tối";
};

const normalizeAssignments = (items) =>
  items
    .filter((item) => item)
    .map((item) => ({
      id: item._id ?? item.id,
      title: item.title ?? "Bài tập chưa đặt tên",
      dueDate: item.dueDate,
      submitted: Boolean(item.mySubmission),
      score: item.mySubmission?.overallScore ?? null,
    }))
    .filter((item) => item.id);

export default function HomePage() {
  const navigate = useNavigate();
  const user = getAuthUser();

  useEffect(() => {
    if (user?.role === "teacher" || user?.role === "admin") {
      navigate("/teacher/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const firstName = user?.name?.trim().split(" ").pop() ?? "bạn";

  useEffect(() => {
    let ignore = false;

    const loadAssignments = async () => {
      setLoading(true);
      setLoadError("");
      if (user?.role === "teacher" || user?.role === "admin") {
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get(api.student.assignments);
        const raw =
          response?.data?.data?.assignments ?? response?.data?.data ?? [];
        const normalized = normalizeAssignments(raw);
        if (!ignore) {
          setAssignments(normalized);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ??
          "Không thể tải dữ liệu trang Home. Vui lòng thử lại.";
        if (!ignore) {
          setLoadError(message);
          setAssignments([]);
        }
        toast.error(message);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      ignore = true;
    };
  }, []);

  const { nextAssignment, pendingCount, dueSoonCount, doneCount } = useMemo(() => {
    const pending = assignments.filter((a) => !a.submitted);
    const dueSoon = pending.filter((a) => {
      if (!a.dueDate) return false;
      const dueTime = new Date(a.dueDate).getTime();
      if (Number.isNaN(dueTime)) return false;
      return dueTime < Date.now() + 3 * 86400000;
    });
    const next =
      pending
        .slice()
        .sort(
          (a, b) =>
            new Date(a.dueDate ?? 0).getTime() -
            new Date(b.dueDate ?? 0).getTime(),
        )[0] ?? null;

    return {
      nextAssignment: next,
      pendingCount: pending.length,
      dueSoonCount: dueSoon.length,
      doneCount: assignments.length - pending.length,
    };
  }, [assignments]);

  const primaryAction = nextAssignment
    ? {
        label: "Bắt đầu bài tập",
        link: `/essay/input?assignmentId=${nextAssignment.id}`,
        title: nextAssignment.title,
        hint: "Hạn nộp sắp tới, hãy hoàn thành sớm",
        icon: BookOpen,
      }
    : {
        label: "Viết bài tự do",
        link: "/essay/input",
        title: "Sẵn sàng luyện viết?",
        hint: "Chọn một chủ đề và bắt đầu ngay",
        icon: Star,
      };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7f7] text-[#1d1d1f]">
      <HomeHeader />

      <div className="pointer-events-none absolute -left-40 top-[-20%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(88,204,2,0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute -right-40 top-[10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[20%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),transparent_70%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
        <GreetingSection
          greeting={getGreeting()}
          name={firstName}
          subtitle="Tập trung vào một mục tiêu chính mỗi ngày để giữ nhịp luyện viết."
        />

        {loading && (
          <div className="rounded-3xl border border-[#e5e5ea] bg-white/90 p-6 text-sm text-[#6e6e73] shadow-sm">
            Đang tải dữ liệu bài tập...
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-3xl border border-[#fecaca] bg-[#fff1f2] p-6 text-sm text-[#b42318] shadow-sm">
            {loadError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <HeroCard
              icon={primaryAction.icon}
              title={primaryAction.title}
              hint={primaryAction.hint}
              ctaLabel={primaryAction.label}
              ctaLink={primaryAction.link}
            />

            <QuickStats
              items={[
                { label: "Chờ nộp", value: pendingCount, tone: "default" },
                {
                  label: "Sắp hạn",
                  value: dueSoonCount,
                  tone: "warning",
                  icon: Flame,
                },
                { label: "Đã xong", value: doneCount, tone: "success" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-6">
            <AssignmentsCard
              items={assignments}
              maxItems={4}
              seeAllLink="/assignments"
            />

            <ShortcutCard
              label="Lịch sử bài viết"
              helper="Xem danh sách các bài đã làm"
              link="/essay/history"
            />
            <ShortcutCard
              label="Phân tích tiến độ"
              helper="Biểu đồ điểm số và xu hướng"
              link="/progress"
            />
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
