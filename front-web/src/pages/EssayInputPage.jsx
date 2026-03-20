import React, { useState, useEffect } from "react";
import {
  PenLine,
  ChevronLeft,
  BookOpen,
  PieChart,
  CheckCircle2,
  Info,
  Loader2,
  ListFilter,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";
import apiClient, { api, getErrorMessage, getAuthUser } from "../services/api";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

const WORD_TARGET = { task2: 250, task1: 150 };

const TASK_CONFIG = {
  task2: {
    label: "Task 2 — Essay",
    hint: "Academic argument or discussion",
    minWords: 250,
  },
  task1: {
    label: "Task 1 — Description",
    hint: "Graph, chart, or diagram",
    minWords: 150,
  },
};

export default function EssayInputPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");

  const [taskType, setTaskType] = useState("task2");
  const [essayText, setEssayText] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [fetchingAssignment, setFetchingAssignment] = useState(false);
  const [allAssignments, setAllAssignments] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    // Fetch all assignments if we might need to pick one
    const fetchAll = async () => {
      const user = getAuthUser();
      if (user?.role === "teacher" || user?.role === "admin") return;
      try {
        const res = await apiClient.get(api.student.assignments);
        const data = res?.data?.data?.assignments ?? res?.data?.data ?? [];
        setAllAssignments(data.filter(a => !a.mySubmission)); // Only show unfinished ones
      } catch (err) {
        console.error("Failed to fetch assignments", err);
      }
    };
    fetchAll();
  }, []);

  const handleSelectAssignment = (a) => {
    setAssignment(a);
    if (a.taskType) setTaskType(a.taskType);
    setShowSelector(false);
    // Update URL without reload
    navigate(`/essay/input?assignmentId=${a._id ?? a.id}`, { replace: true });
  };

  useEffect(() => {
    if (assignmentId) {
      const fetchAssignment = async () => {
        const user = getAuthUser();
        if (user?.role === "teacher" || user?.role === "admin") {
          setFetchingAssignment(false);
          return;
        }
        try {
          const res = await apiClient.get(api.student.assignmentById(assignmentId));
          // Handle different possible data structures
          const data = res.data?.data?.assignment ?? res.data?.data ?? res.data?.assignment ?? res.data;
          
          if (data && (data.title || data.name || data._id || data.id)) {
            setAssignment(data);
            if (data.taskType) {
              setTaskType(data.taskType);
            }
          } else {
            console.error("No valid assignment data found in response", res.data);
          }
        } catch (err) {
          toast.error("Không thể tải thông tin bài tập.");
        } finally {
          setFetchingAssignment(false);
        }
      };
      fetchAssignment();
    }
  }, [assignmentId]);

  const wordCount = essayText.trim()
    ? essayText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const target = WORD_TARGET[taskType];
  const progress = Math.min(100, (wordCount / target) * 100);
  const isReady = wordCount >= 50;
  const isAtTarget = wordCount >= target;

  const handleSubmit = async () => {
    if (!isReady) return;
    const finalEssayText = essayText.trim();
    if (!finalEssayText) return;

    setLoading(true);
    try {
      let res;
      if (assignmentId) {
        // Assignment submission: Send both text and taskType to be safe
        res = await apiClient.post(api.student.submitAssignment(assignmentId), {
          text: finalEssayText,
          taskType: taskType,
        });
      } else {
        // Free-write: following the mobile app pattern where taskType is passed as assignmentId
        res = await apiClient.post(api.essays.submit, {
          text: finalEssayText,
          assignmentId: taskType,
        });
      }
      const essayId = res.data?.data?.submission?._id ?? res.data?.data?._id ?? res.data?._id;
      if (!essayId) {
        toast.error("Không thể nhận diện mã bài luận từ hệ thống. Vui lòng kiểm tra lịch sử.");
        return;
      }
      toast.success("Đã gửi bài luận thành công!");
      navigate(`/essay/result?essayId=${essayId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Progress bar color
  const barColor = isAtTarget
    ? "bg-[#58cc02]"
    : wordCount >= target * 0.6
      ? "bg-[#f59e0b]"
      : "bg-[#ef4444]";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7f7] text-[#1d1d1f]">
      <HomeHeader />

      {/* Background Gradients (consistent with HomePage) */}
      <div className="pointer-events-none absolute -left-40 top-[-20%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(88,204,2,0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute -right-40 top-[10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),transparent_70%)]" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col px-6 py-10 lg:px-8">
        {/* --- Header --- */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-xl p-0"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Button>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {assignment ? "Làm bài tập" : "Viết bài tự do"}
            </h1>
          </div>
        </div>

        {fetchingAssignment && (
          <div className="mb-6 flex items-center justify-center gap-2 py-4 text-[#6e6e73]">
            <Loader2 size={18} className="animate-spin text-[#58cc02]" />
            <span className="text-[14px]">Đang tải thông tin đề bài...</span>
          </div>
        )}

        {/* --- Top Selector / Info Bar --- */}
        {!assignment && !fetchingAssignment && allAssignments.length > 0 && (
          <div className="mb-6">
            {!showSelector ? (
              <Button
                variant="outline"
                className="w-full flex justify-between items-center rounded-2xl border-dashed border-[#58cc02]/40 bg-[#58cc02]/5 px-6 py-6 h-auto hover:bg-[#58cc02]/10 transition-all group"
                onClick={() => setShowSelector(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#58cc02]/20 text-[#58cc02]">
                    <ListFilter size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-[#1d1d1f]">Chọn một đề bài tập được giao</p>
                    <p className="text-[12px] text-[#6e6e73]">Làm bài tập để được giáo viên và AI nhận xét tốt nhất</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[#58cc02] group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Card className="overflow-hidden border-none shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-[#f5f5f7] px-5 py-3 border-b border-[#e5e5ea] flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[#6e6e73]">Chọn bài tập ({allAssignments.length})</span>
                  <button onClick={() => setShowSelector(false)} className="text-[12px] font-semibold text-[#58cc02]">Đóng</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#f0f0f5]">
                  {allAssignments.map(a => (
                    <button
                      key={a._id ?? a.id}
                      onClick={() => handleSelectAssignment(a)}
                      className="w-full px-6 py-4 text-left hover:bg-[#f9f9fb] transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex gap-2 mb-1">
                          <span className="text-[10px] font-black text-[#58cc02]">{a.taskType === 'task2' ? 'TASK 2' : 'TASK 1'}</span>
                        </div>
                        <p className="text-[14px] font-bold text-[#1d1d1f] group-hover:text-[#58cc02] transition-colors">{a.title}</p>
                      </div>
                      <ChevronRight size={16} className="text-[#ccc] group-hover:text-[#58cc02]" />
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* --- Task Selector (Only show if NOT an assignment or loading) --- */}
        {!assignment && !fetchingAssignment && (
          <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Tabs
              defaultValue="task2"
              value={taskType}
              onValueChange={setTaskType}
              className="w-full max-w-sm"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/50 p-1 shadow-sm border border-[#e5e5ea]">
                <TabsTrigger
                  value="task2"
                  className="rounded-xl py-2.5 text-[13px] font-bold"
                >
                  Task 2 — Essay
                </TabsTrigger>
                <TabsTrigger
                  value="task1"
                  className="rounded-xl py-2.5 text-[13px] font-bold"
                >
                  Task 1 — Description
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-[13px] text-[#6e6e73]">
              {TASK_CONFIG[taskType].hint}
            </p>
          </div>
        )}

        {/* --- Assignment Info Card --- */}
        {assignment && (
          <Card className="mb-8 overflow-hidden border-none bg-gradient-to-br from-[#58cc02]/10 to-[#3d9400]/5 shadow-sm">
            <div className="px-6 py-6 border-l-4 border-[#58cc02]">
              <h2 className="text-xl font-black text-[#1d1d1f] leading-tight">
                {assignment.title ?? assignment.name ?? "Bài tập không có tiêu đề"}
              </h2>
            </div>
          </Card>
        )}

        {/* --- Input Area --- */}
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <Card className="overflow-hidden border-none shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-white px-6 py-4">
                <div className="flex items-center gap-2">
                  <PenLine size={16} className="text-[#6e6e73]" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-[#6e6e73]">
                    Bài viết của bạn
                  </span>
                </div>
                <div className="rounded-full bg-[#f5f5f7] px-3 py-1">
                  <span
                    className={`text-[12px] font-bold ${
                      isAtTarget ? "text-[#58cc02]" : "text-[#6e6e73]"
                    }`}
                  >
                    {wordCount} / {target} từ
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-[3px] w-full bg-[#f0f0f5]">
                <div
                  className={`h-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <textarea
                className="min-h-[400px] w-full resize-none bg-white p-6 text-[15px] leading-relaxed text-[#1d1d1f] focus:outline-none sm:min-h-[500px]"
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder={
                  taskType === "task2"
                    ? "Bắt đầu bài viết của bạn tại đây...\n"
                    : "Mô tả dữ liệu tại đây...\n"
                }
              />
            </Card>
          </div>

          {/* --- Sidebar Tips --- */}
          <div className="flex flex-col gap-4 lg:w-[280px]">
            <Card className="border-none bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              <h4 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-[#6e6e73]">
                <Info size={15} /> Lưu ý quan trọng
              </h4>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#58cc02]/20 text-[#58cc02]">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                  <p className="text-[13px] text-[#6e6e73]">
                    Cần ít nhất <strong>50 từ</strong> để gửi bài chấm điểm.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#58cc02]/20 text-[#58cc02]">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                  <p className="text-[13px] text-[#6e6e73]">
                    Mục tiêu: <strong>{target}+ từ</strong> để đạt điểm tốt.
                  </p>
                </li>
              </ul>
            </Card>

            <div className="hidden lg:block">
              <Button
                className="h-14 w-full rounded-2xl shadow-lg transition-transform active:scale-[0.98]"
                disabled={!isReady || loading}
                onClick={handleSubmit}
              >
                {loading ? "Đang gửi..." : "Gửi bài chấm điểm AI"}
              </Button>
              {!isReady && (
                <p className="mt-3 text-center text-[12px] font-medium text-[#ef4444]">
                  Vui lòng viết ít nhất 50 từ
                </p>
              )}
            </div>
          </div>
        </div>

        {/* --- Mobile Footer Action --- */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-[#e5e5ea] bg-white/95 p-4 backdrop-blur-md lg:hidden">
          <Button
            className="h-12 w-full rounded-xl font-bold"
            disabled={!isReady || loading}
            onClick={handleSubmit}
          >
            {loading ? "Đang gửi..." : "Gửi bài chấm điểm AI"}
          </Button>
          {!isReady && (
            <p className="mt-2 text-center text-[11px] font-medium text-[#ef4444]">
              Vui lòng viết ít nhất 50 từ
            </p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <HomeFooter />
      </div>
    </main>
  );
}
