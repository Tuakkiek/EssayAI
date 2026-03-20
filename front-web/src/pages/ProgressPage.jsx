import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Trophy,
  Target,
  Users,
  FileText,
  Star,
  Flame,
  Wifi,
  Medal,
  ChevronRight,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  CheckCircle2,
  Zap,
} from "lucide-react";
import apiClient, { api, getAuthUser, getErrorMessage } from "../services/api";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

// Note: I'll use raw divs with tailwind for Cards if the provided Card component is too restrictive.
// Re-checking Card.jsx exports: { Card, CardContent }

function getBandColor(score) {
  if (score == null || Number.isNaN(score)) return "#8e8e93";
  if (score < 4) return "#f43f5e"; // rose-500
  if (score < 6) return "#f59e0b"; // amber-500
  if (score < 7.5) return "#3b82f6"; // blue-500
  return "#10b981"; // emerald-500
}

function TrendBadge({ trend, delta }) {
  const cfg =
    trend === "improving"
      ? {
          Icon: TrendingUp,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          label: `+${delta.toFixed(1)} Tiến bộ`,
        }
      : trend === "declining"
        ? {
            Icon: TrendingDown,
            color: "text-rose-600",
            bg: "bg-rose-50",
            label: `${delta.toFixed(1)} Giảm`,
          }
        : {
            Icon: Minus,
            color: "text-amber-600",
            bg: "bg-amber-50",
            label: "Ổn định",
          };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.bg} ${cfg.color} font-bold text-sm shadow-sm`}>
      <cfg.Icon size={14} strokeWidth={2.5} />
      <span>{cfg.label}</span>
    </div>
  );
}

// ─── Student View Components ──────────────────────────────────────────────────

const ScoreChart = ({ timeline }) => {
  if (!timeline || timeline.length < 2) return null;
  const scores = timeline.map((t) => t.score);
  const minScore = Math.max(0, Math.min(...scores) - 0.5);
  const maxScore = Math.min(9, Math.max(...scores) + 0.5);
  const range = maxScore - minScore || 1;

  return (
    <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-blue-500" />
        Lịch sử điểm số
      </h3>
      
      <div className="relative h-64 flex items-end gap-1.5 pt-10 px-2 group">
        {/* Y Axis Guide Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 border-l border-neutral-100 pl-2">
           {[9, 7, 5, 3].map(v => (
             <div key={v} className="flex items-center gap-4 w-full">
                <span className="text-[10px] font-black text-neutral-300 w-4">{v}</span>
                <div className="flex-1 h-px bg-neutral-50" />
             </div>
           ))}
        </div>

        <div className="flex-1 flex items-end justify-around h-full relative z-10">
          {timeline.map((t, i) => {
            const heightPct = ((t.score - minScore) / range) * 100;
            const color = getBandColor(t.score);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar max-w-[40px]">
                <span className="text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity" style={{ color }}>{t.score.toFixed(1)}</span>
                <div 
                  className="w-full rounded-t-lg transition-all duration-700 delay-100 hover:brightness-110 relative"
                  style={{ 
                    height: `${Math.max(10, heightPct)}%`, 
                    backgroundColor: color,
                    boxShadow: `0 4px 12px ${color}40`
                  }}
                >
                   <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-lg" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-2">
        <span>{new Date(timeline[0].date).toLocaleDateString('vi-VN')}</span>
        <span>{timeline.length} bài đã chấm</span>
        <span>{new Date(timeline[timeline.length - 1].date).toLocaleDateString('vi-VN')}</span>
      </div>
    </div>
  );
};

function StudentProgressView({ data }) {
  const imp = data.improvement;

  return (
    <div className="space-y-10">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { label: "Điểm trung bình", value: data.averageScore.toFixed(1), icon: Star, color: getBandColor(data.averageScore) },
          { label: "Điểm cao nhất", value: data.personalBest.toFixed(1), icon: Trophy, color: getBandColor(data.personalBest) },
          { label: "Tổng bài viết", value: data.totalEssays, icon: FileText, color: "#3b82f6" },
          { label: "Chuỗi ngày nỗ lực", value: imp.streakDays, icon: Flame, color: "#f59e0b" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-lg transition-shadow">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 rounded-xl bg-neutral-50">
                 <s.icon size={18} style={{ color: s.color }} />
               </div>
               <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{s.label}</span>
             </div>
             <p className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Trend & Chart */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
               <TrendingUp size={180} />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight">Xu hướng học tập</h3>
                  <p className="text-indigo-100 text-lg font-medium">Bạn đã tiến bộ từ <span className="text-white font-bold">{imp.firstScore.toFixed(1)}</span> lên <span className="text-white font-bold">{imp.latestScore.toFixed(1)}</span></p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
                   <TrendBadge trend={imp.trend} delta={Math.abs(imp.delta)} />
                </div>
             </div>
          </div>

          <ScoreChart timeline={data.timeline} />
        </div>

        {/* Right Column: Criteria & Insights */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-500" />
                Phân tích tiêu chí
              </h3>
              <div className="space-y-6">
                {data.criteriaProgress.map((c) => (
                  <div key={c.criterion} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-neutral-500">{c.criterion}</span>
                      <div className="text-right">
                         <span className="text-xs font-bold text-neutral-300 mr-2">{c.first.toFixed(1)} → {c.latest.toFixed(1)}</span>
                         <span className={`text-lg font-black ${c.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                           {c.delta >= 0 ? "+" : ""}{c.delta.toFixed(1)}
                         </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${c.delta >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                         style={{ width: `${Math.max(10, (c.latest / 9) * 100)}%` }}
                       />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="space-y-4">
              {data.strongestCriteria && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-emerald-500 shadow-sm">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Điểm mạnh nhất</p>
                    <p className="text-lg font-bold text-emerald-900">{data.strongestCriteria}</p>
                  </div>
                </div>
              )}
              {data.weakestCriteria && (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Cần tập trung</p>
                    <p className="text-lg font-bold text-amber-900">{data.weakestCriteria}</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher View Components ──────────────────────────────────────────────────

function TeacherProgressView({ analytics }) {
  const stats = useMemo(() => {
    const totalStudents = analytics.reduce((s, a) => s + (a.totalStudents ?? 0), 0);
    const totalSubmissions = analytics.reduce((s, a) => s + (a.totalSubmissions ?? 0), 0);
    const avgScore = analytics.length ? analytics.reduce((s, a) => s + (a.averageScore ?? 0), 0) / analytics.length : 0;
    return { totalStudents, totalSubmissions, avgScore };
  }, [analytics]);

  return (
    <div className="space-y-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: "Lớp học", value: analytics.length, icon: LayoutDashboard, color: "#6366f1" },
           { label: "Học sinh", value: stats.totalStudents, icon: Users, color: "#10b981" },
           { label: "Điểm trung bình", value: stats.avgScore.toFixed(1), icon: Star, color: getBandColor(stats.avgScore) },
           { label: "Bài nộp", value: stats.totalSubmissions, icon: CheckCircle2, color: "#3b82f6" },
         ].map((s, idx) => (
           <div key={idx} className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm">
              <div className="p-3 bg-neutral-50 rounded-2xl w-fit mb-4">
                 <s.icon size={24} style={{ color: s.color }} />
              </div>
              <p className="text-11px font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
              <p className="text-4xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
           </div>
         ))}
      </div>

      {/* Class List */}
      <div className="space-y-8">
         <h2 className="text-2xl font-black text-neutral-900 px-2 flex items-center gap-3">
           <Users className="w-6 h-6 text-blue-500" />
           Thống kê chi tiết từng lớp
         </h2>
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           {analytics.map((a, idx) => (
             <div key={a.classId || idx} className="bg-white rounded-[40px] p-10 border border-neutral-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110" />
               
               <div className="relative z-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-bold text-neutral-900">{a.className || `Lớp học ${idx + 1}`}</h3>
                       <p className="text-sm font-bold text-neutral-400">{a.totalStudents} học sinh · {a.totalSubmissions} bài đã nộp</p>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-sm font-black shadow-lg shadow-blue-200">
                      {a.submissionRate ?? 0}% Nộp
                    </div>
                 </div>

                 {/* Distribution Grid */}
                 {a.scoreDistribution?.length > 0 && (
                   <div className="space-y-4">
                      <p className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">Phân phối điểm số</p>
                      <div className="grid grid-cols-5 gap-2 h-24 items-end">
                         {a.scoreDistribution.map(d => {
                            const max = Math.max(...a.scoreDistribution.map(x => x.count), 1);
                            return (
                              <div key={d.band} className="flex flex-col items-center gap-2 group/dist">
                                 <span className="text-[10px] font-black text-neutral-400 opacity-0 group-hover/dist:opacity-100 transition-opacity">{d.count}</span>
                                 <div 
                                   className="w-full bg-blue-100 rounded-lg hover:bg-blue-600 transition-colors cursor-help"
                                   style={{ height: `${(d.count / max) * 100}%` }}
                                   title={`${d.count} học sinh đạt band ${d.band}`}
                                 />
                                 <span className="text-[10px] font-bold text-neutral-600">{d.band}</span>
                              </div>
                            )
                         })}
                      </div>
                   </div>
                 )}

                 {/* Top Students */}
                 {a.topStudents?.length > 0 && (
                   <div className="space-y-4">
                      <p className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-50 pb-2">Top học sinh đạt điểm cao</p>
                      <div className="space-y-3">
                         {a.topStudents.slice(0, 3).map((s, i) => {
                           const medalColors = ["text-amber-500", "text-neutral-400", "text-orange-500"];
                           return (
                             <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-neutral-100">
                                <div className="flex items-center gap-3">
                                   <Medal size={16} className={medalColors[i]} />
                                   <span className="text-sm font-bold text-neutral-800">{s.name}</span>
                                </div>
                                <span className="font-black" style={{ color: getBandColor(s.averageScore) }}>{s.averageScore.toFixed(1)}</span>
                             </div>
                           );
                         })}
                      </div>
                   </div>
                 )}
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

const ProgressPage = () => {
  const navigate = useNavigate();
  const user = getAuthUser();
  const isTeacher = user?.role === "teacher";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadStudentData = useCallback(async () => {
    try {
      const res = await apiClient.get(api.improvement.progress);
      setData(res.data?.data || res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadTeacherData = useCallback(async () => {
    try {
      const clsRes = await apiClient.get(api.classes.list);
      const classes = clsRes.data?.data?.classes ?? clsRes.data?.data ?? [];
      const analyticsResults = await Promise.all(
        classes.map(async (cls) => {
          try {
            const res = await apiClient.get(api.classes.analytics(cls._id));
            return res.data?.data?.stats ?? res.data?.data ?? null;
          } catch {
            return null;
          }
        }),
      );
      setData(analyticsResults.filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    
    if (isTeacher) await loadTeacherData();
    else await loadStudentData();
    
    setLoading(false);
    setRefreshing(false);
  }, [isTeacher, loadStudentData, loadTeacherData]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-400 uppercase tracking-widest">
              <LayoutDashboard className="w-4 h-4" />
              <span>Thống kê & Tiến độ</span>
            </div>
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
              {isTeacher ? "Quản lý tiến độ lớp học" : "Theo dõi hành trình của bạn"}
            </h1>
            <p className="text-neutral-500 font-medium">
              {isTeacher ? "Xem chi tiết kết quả học tập của học sinh trong các lớp." : `Chào ${user?.name || "bạn"}, hãy cùng nhìn lại những gì bạn đã đạt được nhé.`}
            </p>
          </div>

          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-6 gap-2"
            onClick={() => load(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </Button>
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="w-12 h-12 text-[#58cc02] animate-spin" />
            <p className="text-neutral-500 font-medium animate-pulse">Đang phân tích dữ liệu học tập...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
             <div className="p-6 bg-rose-50 rounded-full text-rose-500 shadow-inner">
               <Wifi className="w-12 h-12" strokeWidth={1.5} />
             </div>
             <div className="space-y-2">
               <h2 className="text-2xl font-bold text-neutral-900">Không thể tải dữ liệu</h2>
               <p className="text-neutral-500 max-w-sm mx-auto">{error}</p>
             </div>
             <Button className="bg-[#58cc02] hover:bg-[#46a302] rounded-2xl px-10 h-14" onClick={() => load()}>
                Thử lại ngay
             </Button>
          </div>
        ) : !data || (isTeacher && data.length === 0) || (!isTeacher && data.scoredEssays === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 gap-8 text-center max-w-lg mx-auto">
             <div className="p-8 bg-blue-50 rounded-full text-blue-500 shadow-inner scale-125">
               {isTeacher ? <Users size={48} /> : <Target size={48} />}
             </div>
             <div className="space-y-3">
               <h2 className="text-3xl font-black text-neutral-900">{isTeacher ? "Chưa có dữ liệu lớp" : "Chưa có tiến độ"}</h2>
               <p className="text-neutral-500 text-lg leading-relaxed">
                 {isTeacher 
                    ? "Hãy bắt đầu bằng cách tạo lớp học đầu tiên và mời học sinh tham gia luyện tập." 
                    : "Hãy viết và nộp bài luận đầu tiên để bắt đầu theo dõi biểu đồ tiến bộ của riêng bạn."}
               </p>
             </div>
             {!isTeacher && (
               <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] px-12 h-16 text-lg font-bold shadow-xl shadow-blue-200"
                onClick={() => navigate("/essay/input")}
               >
                 Viết bài ngay
               </Button>
             )}
          </div>
        ) : isTeacher ? (
          <TeacherProgressView analytics={data} />
        ) : (
          <StudentProgressView data={data} />
        )}
      </main>

      <HomeFooter />
    </div>
  );
};

export default ProgressPage;
