import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  BarChart3,
  Calendar,
  ChevronRight,
  TrendingUp,
  Loader2,
  AlertCircle,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import apiClient, { api, getAuthUser, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const StatCard = ({ label, value, icon: Icon, color, trend, helper }) => (
  <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
    <div className="absolute top-0 right-0 w-24 h-24 bg-neutral-50 rounded-bl-[60px] -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50" />
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl bg-opacity-10`} style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={24} />
        </div>
        {trend && (
           <div className={`text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 flex items-center gap-1`}>
             <TrendingUp size={12} />
             {trend}
           </div>
        )}
      </div>
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black tabular-nums text-neutral-900 mb-2">{value}</p>
      <p className="text-xs text-neutral-500 font-medium mt-auto">{helper}</p>
    </div>
  </div>
);

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const user = getAuthUser();

  const [stats, setStats] = useState(null);
  const [recentClasses, setRecentClasses] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, classRes, submissionsRes, assignmentsRes] = await Promise.all([
        apiClient.get(api.teacher.centerAnalytics),
        apiClient.get(api.classes.list),
        apiClient.get(api.teacher.essays), // Fetch pending/recent submissions
        apiClient.get(api.assignments.list), // Fetch recent assignments
      ]);

      const statsData = analyticsRes.data?.data?.stats || analyticsRes.data?.data || analyticsRes.data || {};
      const classes = classRes.data?.data?.classes || classRes.data?.data || [];
      const submissions = submissionsRes.data?.data?.essays || submissionsRes.data?.data?.submissions || submissionsRes.data?.data || [];
      const assignments = assignmentsRes.data?.data?.assignments || assignmentsRes.data?.data || [];

      // Robust stats with fallbacks
      const finalStats = {
        totalClasses: statsData.totalClasses || classes.length || 0,
        totalStudents: statsData.totalStudents || classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0),
        pendingSubmissions: statsData.pendingSubmissions ?? submissions.filter(s => s.status !== "reviewed").length,
        averageScore: statsData.averageScore || 0,
      };

      setStats(finalStats);
      setRecentClasses(classes.slice(0, 3));
      setRecentSubmissions(submissions.slice(0, 5));
      setRecentAssignments(assignments.slice(0, 3));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-[#58cc02] uppercase tracking-[0.2em] bg-[#58cc02]/10 px-4 py-2 rounded-2xl w-fit border border-[#58cc02]/20">
              <GraduationCap className="w-4 h-4" />
              <span>Portal Giáo viên</span>
            </div>
            <h1 className="text-5xl font-black text-neutral-900 tracking-tight leading-none">
              Chào buổi làm việc, <span className="text-indigo-600">{user?.name?.split(" ")[0] || "Thầy/Cô"}!</span>
            </h1>
            <p className="text-neutral-500 font-bold text-xl opacity-80">
              Dưới đây là tổng quan tình hình học tập và quản lý của bạn hôm nay.
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
                variant="outline" 
                className="rounded-[24px] h-16 px-8 border-2 border-neutral-100 font-black uppercase text-xs tracking-widest hover:bg-neutral-50"
                onClick={() => navigate("/teacher/classes")}
            >
              Xem tất cả lớp
            </Button>
            <Button 
                className="bg-[#58cc02] hover:bg-black rounded-[24px] h-16 px-8 gap-3 shadow-2xl shadow-[#58cc02]/30 font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                onClick={() => navigate("/teacher/assignments/create")}
            >
              <Plus size={20} />
              Tạo bài tập mới
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6 py-20">
            <Loader2 className="w-16 h-16 text-[#58cc02] animate-spin" />
            <p className="text-neutral-500 font-black text-xl uppercase tracking-widest animate-pulse">Đang chuần bị dữ liệu quản lý...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border-4 border-rose-100 p-16 rounded-[56px] text-center max-w-3xl mx-auto space-y-8 shadow-2xl shadow-rose-100/50">
             <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
               <AlertCircle size={48} />
             </div>
             <div className="space-y-4">
               <h2 className="text-3xl font-black text-neutral-900 leading-tight">Đã có lỗi xảy ra</h2>
               <p className="text-xl font-bold text-rose-700 opacity-80">{error}</p>
             </div>
             <Button className="bg-rose-600 hover:bg-black rounded-[24px] h-16 px-12 text-lg font-black" onClick={loadData}>
               Thử lại ngay
             </Button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard 
                label="Tổng học sinh" 
                value={stats?.totalStudents || 0} 
                icon={Users} 
                color="#6366f1" 
                trend={"+12%"}
                helper="Tăng trưởng trong tháng này"
              />
              <StatCard 
                label="Lớp học đang quản lý" 
                value={stats?.totalClasses || 0} 
                icon={Briefcase} 
                color="#10b981" 
                helper="Tất cả các cơ sở"
              />
              <StatCard 
                label="Bài viết chờ chấm" 
                value={stats?.pendingSubmissions || 0} 
                icon={Clock} 
                color="#f59e0b" 
                helper="Cần phản hồi ngay"
              />
              <StatCard 
                label="Điểm trung bình" 
                value={(stats?.averageScore || 0).toFixed(1)} 
                icon={BarChart3} 
                color="#3b82f6" 
                helper="Toàn hệ thống"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              {/* Left Column: Recent Classes & Assignments */}
              <div className="xl:col-span-8 space-y-12">
                {/* Recent Classes */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-3xl font-black text-neutral-900 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                         <Briefcase size={20} />
                      </div>
                      Lớp học gần đây
                    </h2>
                    <Link to="/teacher/classes" className="text-xs font-black text-indigo-600 hover:text-black uppercase tracking-widest flex items-center gap-2 group">
                      Xem tất cả <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recentClasses.map((cls) => (
                      <div 
                        key={cls._id}
                        className="bg-white rounded-[40px] p-8 border-2 border-neutral-50 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => navigate(`/teacher/classes/${cls._id}`)}
                      >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[80px] -mr-8 -mt-8 transition-all group-hover:bg-indigo-600 group-hover:scale-110" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-8">
                            <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-white">
                              <Users size={28} />
                            </div>
                            <div className="bg-white/80 backdrop-blur border border-neutral-100 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest text-neutral-400 uppercase">
                              Mã: {cls.code}
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-neutral-900 mb-4 group-hover:text-indigo-600 transition-colors uppercase leading-tight line-clamp-1">{cls.name}</h3>
                          <div className="flex items-center gap-6 mt-auto">
                            <div className="flex flex-col gap-0.5">
                               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Học viên</p>
                               <span className="font-black text-neutral-900 tabular-nums">{cls.studentIds?.length || 0}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Bài nộp</p>
                               <span className="font-black text-neutral-900 tabular-nums">{cls.stats?.totalSubmissions || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div 
                      className="bg-white border-4 border-dashed border-neutral-100 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 text-neutral-300 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer group"
                      onClick={() => navigate("/teacher/classes")}
                    >
                      <div className="w-14 h-14 rounded-3xl border-4 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                      </div>
                      <p className="font-black uppercase tracking-widest text-xs">Tạo lớp học mới</p>
                    </div>
                  </div>
                </div>

                {/* Recent Assignments (New Section) */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h2 className="text-3xl font-black text-neutral-900 flex items-center gap-4">
                         <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <FileText size={20} />
                         </div>
                         Bài tập bài mới
                      </h2>
                      <Link to="/teacher/assignments" className="text-xs font-black text-emerald-600 hover:text-black uppercase tracking-widest flex items-center gap-2 group">
                        Quản lý bài tập <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                   </div>

                   <div className="space-y-4">
                      {recentAssignments.map((asg) => (
                         <div 
                          key={asg._id}
                          className="bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm hover:shadow-xl transition-all cursor-pointer flex items-center justify-between group"
                          onClick={() => navigate(`/teacher/assignments/${asg._id}`)}
                         >
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                  <FileText size={24} />
                               </div>
                               <div>
                                  <h4 className="text-lg font-black text-neutral-900 uppercase leading-tight group-hover:text-emerald-600 transition-colors">{asg.title}</h4>
                                  <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-widest">Lớp: {asg.classId?.name || "Tất cả"}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <div className="hidden md:flex flex-col items-end">
                                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Hạn nộp</p>
                                  <p className="font-black text-neutral-900 tabular-nums">{(() => {
                                     const d = new Date(asg.deadline || asg.dueDate);
                                     return isNaN(d) ? "Chưa đặt" : d.toLocaleDateString('vi-VN');
                                  })()}</p>
                               </div>
                               <ArrowUpRight size={20} className="text-neutral-200 group-hover:text-emerald-600 transition-colors" />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Right Column: Pending Submissions */}
              <div className="xl:col-span-4 space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-neutral-900 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#f59e0b]" />
                    Chờ xử lý
                  </h2>
                </div>

                <div className="bg-white rounded-[48px] border-2 border-neutral-50 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-8 border-b-2 border-neutral-50 bg-neutral-50/30">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">5 Bài nộp gần nhất</p>
                  </div>
                  <div className="divide-y-2 divide-neutral-50 flex-1">
                    {recentSubmissions.length > 0 ? recentSubmissions.map((s) => {
                      const studentName = s.studentName || s.studentId?.name || s.student?.name || "Học sinh";
                      const assignmentTitle = s.assignmentTitle || s.assignmentId?.title || s.assignment?.title || "Luyện viết tự do";
                      return (
                        <div 
                          key={s._id}
                          className="p-8 hover:bg-neutral-50/50 transition-all cursor-pointer group"
                          onClick={() => navigate(`/teacher/submissions/${s._id}`)}
                        >
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                {studentName[0] || "S"}
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-black text-neutral-900 uppercase leading-none mb-1">{studentName}</p>
                                <p className="text-[10px] font-bold text-neutral-400 tabular-nums tracking-widest">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</p>
                             </div>
                          </div>
                          <p className="text-xs font-bold text-neutral-500 line-clamp-1 mb-4 border-l-4 border-neutral-100 pl-3">{assignmentTitle}</p>
                          <div className="flex items-center justify-between">
                             <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border-2 ${s.status === 'reviewed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {s.status === 'reviewed' ? 'Đã chấm' : 'Đang chờ'}
                             </span>
                             <div className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300 group-hover:text-indigo-600">Review</span>
                                <ChevronRight size={14} className="text-neutral-200" />
                             </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="p-20 text-center space-y-6">
                         <div className="bg-neutral-50 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto text-neutral-200">
                           <CheckCircle2 size={40} />
                         </div>
                         <div>
                            <p className="text-lg font-black text-neutral-900 uppercase tracking-widest">Sạch sẽ!</p>
                            <p className="text-xs font-bold text-neutral-400 mt-1">Toàn bộ đã được xử lý.</p>
                         </div>
                      </div>
                    )}
                  </div>
                  {recentSubmissions.length > 0 && (
                    <div className="p-6 bg-neutral-50/50 border-t-2 border-neutral-50">
                       <Button 
                        variant="ghost" 
                        className="w-full rounded-[24px] h-12 text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-white"
                        onClick={() => navigate("/teacher/assignments")}
                       >
                         Xem toàn bộ bài tập
                       </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <HomeFooter />
    </div>
  );
};

export default TeacherDashboardPage;
