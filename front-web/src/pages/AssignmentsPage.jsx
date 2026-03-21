import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  Trophy,
} from "lucide-react";
import apiClient, { api, getErrorMessage, getAuthUser } from "../services/api";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";

function StatusBadge({ submitted, dueDate }) {
  const isOverdue = !submitted && new Date(dueDate) < new Date();
  const isDueSoon = !submitted && !isOverdue && new Date(dueDate).getTime() < Date.now() + 3 * 86400000;

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-bold text-[#58cc02] uppercase tracking-wider bg-[#58cc02]/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={12} strokeWidth={3} />
        Đã nộp
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-bold text-[#ef4444] uppercase tracking-wider bg-[#ef4444]/10 px-2 py-0.5 rounded-full">
        <Clock size={12} strokeWidth={3} />
        Quá hạn
      </div>
    );
  }

  if (isDueSoon) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-bold text-[#f59e0b] uppercase tracking-wider bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
        <Calendar size={12} strokeWidth={3} />
        Sắp hết hạn
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider bg-[#f5f5f7] px-2 py-0.5 rounded-full">
      <Calendar size={12} strokeWidth={3} />
      {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short" }).format(new Date(dueDate))}
    </div>
  );
}

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = async () => {
    const user = getAuthUser();
    if (user?.role === "teacher" || user?.role === "admin") {
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get(api.student.assignments);
      const data = response?.data?.data?.assignments ?? response?.data?.data ?? [];
      setAssignments(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#f7f7f7] text-[#1d1d1f]">
      <HomeHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bài tập của tôi</h1>
            <p className="mt-1.5 text-[15px] text-[#6e6e73]">
              Hoàn thành các bài tập được giao để cải thiện trình độ IELTS của bạn.
            </p>
          </div>
          <button
            onClick={fetchAssignments}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#e5e5ea] shadow-sm hover:bg-[#f5f5f7] transition-colors"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-[#58cc02]" : "text-[#6e6e73]"} />
          </button>
        </header>

        {loading && assignments.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-20">
            <Loader2 size={32} className="animate-spin text-[#58cc02]" />
            <p className="text-[#6e6e73] font-medium animate-pulse">Đang tải danh sách bài tập...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#e5e5ea] bg-white p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <RefreshCw size={28} />
            </div>
            <h3 className="text-lg font-bold">Lỗi tải bài tập</h3>
            <p className="mt-1 text-[#6e6e73]">{error}</p>
            <button
               onClick={fetchAssignments}
               className="mt-6 rounded-xl bg-[#58cc02] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#58cc02]/30 hover:bg-[#46a302] transition-colors"
            >
              Thử lại ngay
            </button>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-dashed border-[#e5e5ea] bg-white p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold">Chưa có bài tập nào</h3>
            <p className="mt-1.5 text-[#6e6e73] max-w-sm mx-auto">
              Khi giáo viên giao bài tập mới, chúng sẽ xuất hiện tại đây. Hãy tranh thủ luyện tập tự do nhé!
            </p>
            <Link
              to="/essay/input"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#58cc02] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#58cc02]/30 hover:bg-[#46a302] transition-transform active:scale-95"
            >
              <PenLine size={16} /> Luyện viết tự do
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((item) => (
              <Link
                key={item._id ?? item.id}
                to={`/essay/input?assignmentId=${item._id ?? item.id}`}
                className="group relative overflow-hidden rounded-[24px] border border-[#e5e5ea] bg-white p-6 shadow-sm transition-all hover:border-[#58cc02]/50 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <StatusBadge submitted={Boolean(item.mySubmission)} dueDate={item.dueDate} />
                      <span className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider bg-[#f5f5f7] px-2 py-0.5 rounded-full">
                        {item.taskType === "task2" ? "IELTS Task 2" : "IELTS Task 1"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1d1d1f] group-hover:text-[#3d9400] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-6">
                    {item.mySubmission?.overallScore != null && (
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider">Band score</p>
                        <p className="text-2xl font-black text-[#58cc02]">
                          {item.mySubmission.overallScore.toFixed(1)}
                        </p>
                      </div>
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] text-[#6e6e73] group-hover:bg-[#58cc02]/10 group-hover:text-[#58cc02] transition-colors">
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <HomeFooter />
    </main>
  );
}
