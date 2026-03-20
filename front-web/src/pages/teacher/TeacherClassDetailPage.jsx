import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  BarChart3,
  Search,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Calendar,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const TABS = [
  { key: "students", label: "Học sinh", icon: Users },
  { key: "assignments", label: "Bài tập", icon: FileText },
  { key: "analytics", label: "Thống kê", icon: BarChart3 },
];

const TeacherClassDetailPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("students");
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const [classRes, assignmentRes] = await Promise.all([
        apiClient.get(api.classes.byId(classId)),
        apiClient.get(api.assignments.list + `?classId=${classId}`),
      ]);
      
      const classData = classRes.data?.data;
      setCls(classData?.class || classData?.cls || null);
      setStudents(classData?.students || []);
      
      const asg = assignmentRes.data?.data?.assignments || assignmentRes.data?.data || [];
      setAssignments(asg);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const loadAnalytics = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await apiClient.get(api.classes.analytics(classId));
      setAnalytics(res.data?.data?.stats || null);
    } catch {
      setAnalytics(null);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tab === "analytics") loadAnalytics();
  }, [tab, loadAnalytics]);

  const copyCode = () => {
    if (!cls?.code) return;
    navigator.clipboard.writeText(cls.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?")) return;
    try {
      await apiClient.delete(api.classes.removeStudent(classId, studentId));
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col gap-8 mb-12">
          <Button 
            variant="ghost" 
            className="w-fit gap-2 text-neutral-500 hover:text-neutral-900 rounded-xl"
            onClick={() => navigate("/teacher/classes")}
          >
            <ArrowLeft size={18} />
            Quay lại danh sách lớp
          </Button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
                {cls?.name || "Chi tiết lớp học"}
              </h1>
              <div className="flex items-center gap-4">
                 <div className="bg-white border border-neutral-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm group">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Mã lớp:</span>
                    <code className="text-lg font-bold text-indigo-600 tracking-wider transition-colors">{cls?.code}</code>
                    <button onClick={copyCode} className="text-neutral-300 hover:text-indigo-600 transition-colors p-1">
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                 </div>
                 <div className="h-6 w-px bg-neutral-100" />
                 <span className="text-sm font-bold text-neutral-400">{students.length} học sinh</span>
              </div>
            </div>

            <div className="flex gap-3">
               <Button 
                className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl px-6 h-12 gap-2 shadow-lg shadow-indigo-100 font-bold"
                onClick={() => navigate(`/teacher/classes/${classId}/add-students`)}
               >
                  <UserPlus size={18} />
                  Thêm học sinh
               </Button>
               <Button 
                className="bg-[#58cc02] hover:bg-[#46a302] rounded-2xl px-6 h-12 gap-2 shadow-lg shadow-emerald-50 font-bold"
                onClick={() => navigate(`/teacher/assignments/create?classId=${classId}`)}
               >
                  <Plus size={18} />
                  Giao bài mới
               </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white p-2 rounded-[28px] border border-neutral-100 shadow-sm w-fit mb-12 overflow-x-auto whitespace-nowrap">
           {TABS.map((t) => {
             const Icon = t.icon;
             return (
               <button
                 key={t.key}
                 className={`flex items-center gap-2.5 px-8 py-3.5 rounded-[22px] text-sm font-bold transition-all ${
                   tab === t.key 
                     ? "bg-neutral-900 text-white shadow-xl scale-[1.02]" 
                     : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                 }`}
                 onClick={() => setTab(t.key)}
               >
                 <Icon size={18} />
                 {t.label}
               </button>
             );
           })}
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-[#58cc02] animate-spin" />
            <p className="text-neutral-500 font-medium">Đang tải dữ liệu lớp học...</p>
          </div>
        ) : error ? (
           <div className="text-center py-20 bg-rose-50 rounded-[40px] border border-rose-100 max-w-2xl mx-auto space-y-6 shadow-sm">
             <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
             <div className="space-y-2">
               <h2 className="text-2xl font-bold text-neutral-900">Không thể tải thông tin</h2>
               <p className="text-neutral-600">{error}</p>
             </div>
             <Button className="bg-rose-500 hover:bg-rose-600 rounded-2xl px-10 h-14 font-bold" onClick={loadData}>Thử lại</Button>
           </div>
        ) : (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            {tab === "students" && (
              <div className="space-y-8">
                 <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tên hoặc email học sinh..."
                      className="w-full bg-white rounded-2xl border border-neutral-200 pl-12 pr-4 h-14 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-neutral-50 border-b border-neutral-100">
                        <tr>
                          <th className="px-8 py-5 text-11px font-black text-neutral-400 uppercase tracking-widest">Học viên</th>
                          <th className="px-8 py-5 text-11px font-black text-neutral-400 uppercase tracking-widest">Email/Phone</th>
                          <th className="px-8 py-5 text-11px font-black text-neutral-400 uppercase tracking-widest text-center">Số bài viết</th>
                          <th className="px-8 py-5 text-11px font-black text-neutral-400 uppercase tracking-widest text-center">Điểm TB</th>
                          <th className="px-8 py-5 text-11px font-black text-neutral-400 uppercase tracking-widest text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                          <tr key={s._id} className="hover:bg-neutral-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    {s.name?.[0] || "S"}
                                  </div>
                                  <span className="font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{s.name}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-sm text-neutral-500 font-medium">{s.email || s.phone || "N/A"}</td>
                            <td className="px-8 py-6 text-sm font-bold text-neutral-900 text-center">{s.stats?.totalEssays || 0}</td>
                            <td className="px-8 py-6 text-center">
                               <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                                 {s.stats?.averageScore?.toFixed(1) || "-"}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <button 
                                    className="p-3 text-neutral-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-hover"
                                    onClick={() => navigate(`/teacher/students/${s._id}`)}
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                  <button 
                                    className="p-3 text-neutral-300 hover:text-rose-500 hover:bg-white rounded-xl transition-all"
                                    onClick={() => handleRemoveStudent(s._id)}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="p-20 text-center space-y-4">
                               <div className="w-16 h-16 bg-neutral-50 text-neutral-200 rounded-full flex items-center justify-center mx-auto">
                                 <Users size={32} />
                               </div>
                               <p className="font-bold text-neutral-400">Không tìm thấy học sinh nào</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>
            )}

            {tab === "assignments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {assignments.map((asg) => (
                   <div 
                    key={asg._id}
                    className="bg-white rounded-[40px] p-10 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
                   >
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center transition-all group-hover:bg-[#58cc02] group-hover:text-white shadow-sm">
                           <FileText size={28} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                          asg.status === "published" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {asg.status === "published" ? "Đang mở" : "Nháp"}
                        </span>
                     </div>
                     <h3 className="text-2xl font-bold text-neutral-900 mb-4 line-clamp-2 leading-tight group-hover:text-[#58cc02] transition-colors">{asg.title}</h3>
                     
                     <div className="flex-1 space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-neutral-500">
                           <Calendar size={16} className="text-indigo-400" />
                           <span className="text-sm font-medium">Hạn nộp: {(() => {
                              const d = new Date(asg.deadline || asg.dueDate);
                              return isNaN(d) ? "Chưa đặt" : d.toLocaleDateString('vi-VN');
                           })()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-neutral-500">
                           <Users size={16} className="text-blue-400" />
                           <span className="text-sm font-medium">{asg.submissionCount || 0} học sinh đã nộp</span>
                        </div>
                     </div>

                     <Button 
                      className="w-full bg-neutral-900 hover:bg-indigo-600 text-white rounded-2xl h-14 text-sm font-black tracking-widest uppercase shadow-xl transition-all"
                      onClick={() => navigate(`/teacher/assignments/${asg._id}`)}
                     >
                        Xem bài nộp
                        <ArrowLeft size={16} className="ml-2 rotate-180" />
                     </Button>
                   </div>
                ))}
              </div>
            )}

            {tab === "analytics" && analytics && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 space-y-6">
                     {[
                       { label: "Điểm trung bình", value: analytics.averageScore?.toFixed(1) || 0, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                       { label: "Tỷ lệ nộp bài", value: `${analytics.submissionRate || 0}%`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                       { label: "Tổng bài đã nộp", value: analytics.totalSubmissions || 0, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
                     ].map((m, i) => (
                       <div key={i} className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center`}>
                             <m.icon size={28} />
                          </div>
                          <div>
                             <p className="text-11px font-black text-neutral-400 uppercase tracking-widest">{m.label}</p>
                             <p className="text-3xl font-black text-neutral-900 tracking-tight">{m.value}</p>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="lg:col-span-8 bg-white rounded-[48px] p-12 border border-neutral-100 shadow-sm space-y-10">
                     <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Phân phối điểm số toàn lớp</h3>
                     <div className="space-y-8">
                        {analytics.scoreDistribution?.map((d) => (
                          <div key={d.band} className="space-y-3">
                             <div className="flex justify-between items-end">
                                <span className="text-sm font-black text-neutral-500 uppercase tracking-widest">Band {d.band}</span>
                                <span className="text-lg font-black text-neutral-900">{d.count} học sinh</span>
                             </div>
                             <div className="h-4 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                                <div 
                                  className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                                  style={{ width: `${(d.count / students.length) * 100}%` }}
                                />
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
          </div>
        )}
      </main>

      <HomeFooter />
    </div>
  );
};

export default TeacherClassDetailPage;
