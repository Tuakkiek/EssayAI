import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  MessageSquare,
  MoreVertical,
  BarChart3,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const TeacherAssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignRes, subRes] = await Promise.all([
        apiClient.get(api.assignments.byId(id)),
        apiClient.get(api.assignments.submissions(id))
      ]);
      
      setAssignment(assignRes.data?.data?.assignment || assignRes.data?.data || null);
      setSubmissions(subRes.data?.data?.submissions || subRes.data?.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#58cc02] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col">
      <HomeHeader />
      <main className="flex-1 flex items-center justify-center p-6">
         <div className="bg-white p-12 rounded-[48px] border-2 border-rose-50 shadow-xl text-center max-w-lg space-y-6">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-neutral-900">Không thể tải thông tin</h2>
            <p className="text-neutral-500 font-bold">{error}</p>
            <Button onClick={fetchData} className="bg-rose-500 hover:bg-neutral-900 rounded-2xl h-14 px-8 font-black">Thử lại</Button>
         </div>
      </main>
      <HomeFooter />
    </div>
  );

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.status === 'graded').length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    notStarted: (assignment?.classId?.studentIds?.length || 0) - submissions.length
  };

   const formatDate = (date) => {
     if (!date) return "Chưa đặt";
     const d = new Date(date);
     return isNaN(d) ? "Hàng nộp không hợp lệ" : d.toLocaleDateString('vi-VN');
   };

   return (
     <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans">
       <HomeHeader />
 
       <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
         {/* Navigation & Header */}
         <div className="flex flex-col gap-8 mb-12">
           <Button 
             variant="ghost" 
             className="w-fit gap-2 text-neutral-500 hover:text-neutral-900 rounded-xl font-black uppercase text-xs tracking-widest"
             onClick={() => navigate(-1)}
           >
             <ArrowLeft size={18} />
             Quay lại bài tập
           </Button>
 
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-10 rounded-[48px] border border-neutral-100 shadow-sm relative overflow-hidden group transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="space-y-4 relative z-10">
                 <div className="flex items-center gap-3 text-indigo-700 font-black uppercase tracking-widest text-xs bg-indigo-50 px-4 py-2 rounded-2xl w-fit border border-indigo-100">
                    <FileText size={16} />
                    <span>Chi tiết bài tập</span>
                 </div>
                 <h1 className="text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
                    {assignment?.title}
                 </h1>
                 <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-neutral-500 font-black text-sm uppercase tracking-wide">
                       <Calendar size={18} className="text-indigo-400" />
                       Hạn nộp: <span className="text-neutral-900">{formatDate(assignment?.deadline || assignment?.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 font-black text-sm uppercase tracking-wide">
                       <Users size={18} className="text-indigo-400" />
                       Lớp: <span className="text-indigo-900">{assignment?.classId?.name || "Tất cả"}</span>
                    </div>
                 </div>
              </div>
 
              <div className="flex gap-4 relative z-10 w-full lg:w-auto">
                 <Button 
                   variant="outline"
                   className="flex-1 lg:flex-none border-2 border-neutral-100 rounded-[24px] h-16 px-8 font-black text-neutral-700 hover:bg-neutral-50 gap-2 uppercase text-xs tracking-widest"
                   onClick={() => navigate(`/teacher/assignments/${id}/edit`)}
                 >
                    Chỉnh sửa
                 </Button>
              </div>
           </div>
         </div>
 
         {/* Quick Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Tổng số nộp", val: stats.total, icon: FileText, bg: "bg-indigo-50", text: "text-indigo-600", borderColor: "hover:border-indigo-200" },
              { label: "Đã chấm điểm", val: stats.graded, icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600", borderColor: "hover:border-emerald-200" },
              { label: "Đang chờ chấm", val: stats.pending, icon: Clock, bg: "bg-amber-50", text: "text-amber-600", borderColor: "hover:border-amber-200" },
              { label: "Chưa bắt đầu", val: stats.notStarted > 0 ? stats.notStarted : 0, icon: AlertCircle, bg: "bg-neutral-50", text: "text-neutral-600", borderColor: "hover:border-neutral-200" }
            ].map((s, i) => (
              <div key={i} className={`bg-white p-8 rounded-[40px] border border-neutral-100 shadow-sm flex flex-col gap-4 group ${s.borderColor} transition-all`}>
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.bg} ${s.text} shadow-inner group-hover:scale-110 transition-transform`}>
                    <s.icon size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                    <p className="text-3xl font-black text-neutral-900">{s.val}</p>
                 </div>
              </div>
            ))}
         </div>

        {/* Content Tabs/Section */}
        <div className="space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                 <Users size={28} className="text-indigo-600" />
                 Danh sách nộp bài
              </h3>
              <div className="flex gap-2">
                 <button className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">Tất cả</button>
                 <button className="px-5 py-2.5 bg-white text-neutral-500 rounded-xl text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Đợi chấm</button>
                 <button className="px-5 py-2.5 bg-white text-neutral-500 rounded-xl text-xs font-black uppercase tracking-widest hover:text-emerald-600 transition-colors">Đã xong</button>
              </div>
           </div>

           {submissions.length === 0 ? (
              <div className="bg-white rounded-[48px] border-4 border-dashed border-neutral-50 p-24 text-center space-y-6">
                 <div className="w-20 h-20 bg-neutral-50 rounded-[32px] flex items-center justify-center text-neutral-200 mx-auto">
                    <MessageSquare size={40} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black text-neutral-400 leading-tight uppercase tracking-widest">Chưa có bài nộp nào</h4>
                    <p className="text-neutral-400 font-bold mt-2">Học sinh vẫn đang thực hiện bài làm.</p>
                 </div>
              </div>
           ) : (
              <div className="bg-white rounded-[48px] border border-neutral-100 shadow-sm overflow-hidden border-2">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="bg-neutral-50/50 border-b border-neutral-100 text-left">
                          <th className="p-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-10">Thứ tự</th>
                          <th className="p-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Học sinh</th>
                          <th className="p-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Ngày nộp</th>
                          <th className="p-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Trạng thái</th>
                          <th className="p-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] text-center">Điểm số</th>
                          <th className="p-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] text-right pr-10">Thao tác</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                       {submissions.map((sub, idx) => (
                          <tr key={sub._id} className="group hover:bg-neutral-50/50 transition-colors">
                             <td className="p-8 pl-10 tabular-nums font-black text-neutral-400 text-lg">
                                {String(idx + 1).padStart(2, '0')}
                             </td>
                             <td className="p-8">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                                      {sub.studentId?.name?.charAt(0) || "H"}
                                   </div>
                                   <div>
                                      <p className="font-black text-neutral-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{sub.studentId?.name || "Học sinh"}</p>
                                      <p className="text-xs font-bold text-neutral-400 tabular-nums">{sub.studentId?.phone}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="p-8">
                                <p className="font-black text-neutral-700 tabular-nums tracking-tight">
                                   {new Date(sub.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tabular-nums">
                                   {new Date(sub.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </td>
                             <td className="p-8">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                   sub.status === 'graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                   {sub.status === 'graded' ? '✅ Đã chấm' : '⏳ Đợi chấm'}
                                </span>
                             </td>
                             <td className="p-8 text-center">
                                <span className={`text-2xl font-black tabular-nums ${sub.score ? 'text-indigo-600' : 'text-neutral-300'}`}>
                                   {sub.score ? sub.score.toFixed(1) : "--"}
                                </span>
                             </td>
                             <td className="p-8 text-right pr-10">
                                <Button 
                                  className={`rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95 ${
                                     sub.status === 'graded' ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-900 hover:text-white' : 'bg-indigo-600 text-white hover:bg-black font-black'
                                  }`}
                                  onClick={() => navigate(`/teacher/submissions/${sub._id}`)}
                                >
                                   {sub.status === 'graded' ? 'Xem lại' : 'Chấm điểm'}
                                   <ChevronRight size={14} />
                                </Button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}
        </div>
      </main>

      <HomeFooter />
    </div>
  );
};

export default TeacherAssignmentDetailPage;
