import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const TeacherAssignmentsPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(api.assignments.list);
      const data = res.data?.data?.assignments || res.data?.data || [];
      setAssignments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
           <div className="space-y-4">
              <h1 className="text-5xl font-black text-neutral-900 tracking-tight flex items-center gap-4">
                 <div className="w-14 h-14 bg-emerald-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-emerald-200">
                    <FileText size={32} />
                 </div>
                 Quản lý bài tập
              </h1>
              <p className="text-neutral-500 font-bold text-lg uppercase tracking-wide opacity-80 pl-2">
                 Theo dõi tình hình nộp bài và quản lý đề bài chuyên nghiệp.
              </p>
           </div>
           
           <Button 
            className="bg-[#58cc02] hover:bg-black rounded-[24px] h-20 px-12 gap-3 shadow-2xl shadow-[#58cc02]/30 text-xl font-black transition-all hover:-translate-y-1 active:scale-95"
            onClick={() => navigate("/teacher/assignments/create")}
           >
              <Plus size={28} />
              Tạo bài tập mới
           </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-center">
           <div className="relative flex-1 w-full lg:max-w-xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 w-6 h-6 transition-colors group-focus-within:text-emerald-600" />
              <input 
                type="text"
                className="w-full bg-white rounded-[24px] border-2 border-neutral-100 pl-16 pr-6 h-20 outline-none focus:border-emerald-600 transition-all shadow-sm font-black text-lg placeholder:text-neutral-200"
                placeholder="Tìm kiếm bài tập..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex bg-white p-2 rounded-[28px] border-2 border-neutral-50 shadow-sm w-full lg:w-fit overflow-x-auto whitespace-nowrap scrollbar-hide">
              {['all', 'published', 'draft', 'closed'].map(f => (
                <button
                  key={f}
                  className={`px-8 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all ${
                    statusFilter === f ? "bg-neutral-900 text-white shadow-xl scale-105" : "text-neutral-400 hover:text-neutral-900"
                  }`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'all' ? 'Tất cả' : f === 'published' ? 'Đang mở' : f === 'draft' ? 'Lưu nháp' : 'Đã đóng'}
                </button>
              ))}
           </div>
        </div>

        {loading ? (
           <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6">
              <Loader2 className="w-16 h-16 text-[#58cc02] animate-spin" />
              <p className="text-neutral-500 font-black text-xl uppercase tracking-widest animate-pulse">Đang tải danh sách bài tập...</p>
           </div>
        ) : error ? (
           <div className="bg-rose-50 border-4 border-rose-100 p-16 rounded-[56px] text-center max-w-3xl mx-auto space-y-8 shadow-2xl shadow-rose-100/50">
              <AlertCircle size={64} className="text-rose-500 mx-auto" strokeWidth={3} />
              <div className="space-y-4">
                 <h2 className="text-3xl font-black text-neutral-900 leading-tight">Không thể kết nối dữ liệu</h2>
                 <p className="text-xl font-bold text-rose-700 opacity-80">{error}</p>
              </div>
              <Button onClick={loadAssignments} className="bg-rose-600 hover:bg-black rounded-[24px] h-16 px-12 text-lg font-black">Thử lại ngay</Button>
           </div>
        ) : filtered.length === 0 ? (
           <div className="bg-white rounded-[56px] border-4 border-dashed border-neutral-100 p-24 text-center space-y-8 shadow-sm">
              <div className="w-24 h-24 bg-neutral-50 rounded-[32px] flex items-center justify-center mx-auto text-neutral-200">
                <FileText size={48} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black text-neutral-900 leading-tight">
                    {searchQuery ? "Không tìm thấy bài tập nào" : "Khu vực bài tập đang trống"}
                 </h3>
                 <p className="text-lg font-bold text-neutral-500 max-w-md mx-auto leading-relaxed">
                    {searchQuery ? "Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc." : "Hãy bắt đầu tạo bài tập đầu tiên để học sinh có thể thực hành luyện viết."}
                 </p>
              </div>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate("/teacher/assignments/create")} 
                  className="bg-emerald-600 hover:bg-black rounded-[24px] h-20 px-16 text-xl font-black tracking-widest uppercase transition-all hover:-translate-y-1 active:scale-95 shadow-2xl shadow-emerald-100"
                >
                   Tạo ngay
                </Button>
              )}
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filtered.map(asg => (
                <div 
                  key={asg._id}
                  className="bg-white rounded-[48px] p-10 border-2 border-neutral-50 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50/50 rounded-bl-[100px] -mr-12 -mt-12 transition-all group-hover:bg-emerald-600 group-hover:scale-110 duration-500" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-10">
                       <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center group-hover:bg-white transition-colors">
                          <FileText size={32} />
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-2xl border-2 ${
                         asg.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                       }`}>
                         {asg.status === "published" ? "Đang mở" : asg.status === "draft" ? "Nháp" : "Đã đóng"}
                       </span>
                    </div>

                    <div className="flex-1 space-y-6">
                       <h3 className="text-2xl font-black text-neutral-900 leading-tight group-hover:text-emerald-700 transition-colors uppercase line-clamp-2">{asg.title}</h3>
                       <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">{asg.className || asg.classId?.name || "Lớp học chưa xác định"}</p>
                       </div>
                       
                       <div className="flex flex-wrap gap-6 pt-6 border-t-2 border-neutral-50">
                          <div className="flex flex-col gap-1">
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Hạn nộp</p>
                             <div className="flex items-center gap-2 text-neutral-900 font-black tabular-nums">
                                <Calendar size={14} className="text-indigo-400" />
                                 <span>{(() => {
                                    const d = new Date(asg.deadline || asg.dueDate);
                                    return isNaN(d) ? "Chưa đặt" : d.toLocaleDateString('vi-VN');
                                 })()}</span>
                             </div>
                          </div>
                          <div className="flex flex-col gap-1">
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Nộp bài</p>
                             <div className="flex items-center gap-2 text-neutral-900 font-black tabular-nums">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <span>{asg.submissionCount || 0} nộp</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                       <Button 
                        className="flex-1 bg-neutral-900 hover:bg-emerald-600 text-white rounded-[24px] h-16 text-xs font-black tracking-[0.2em] uppercase transition-all active:scale-95 shadow-xl shadow-neutral-100"
                        onClick={() => navigate(`/teacher/assignments/${asg._id}`)}
                       >
                         Xem bài nộp
                       </Button>
                       <Button 
                        variant="ghost" 
                        className="w-16 h-16 rounded-[24px] p-0 text-neutral-300 hover:text-emerald-600 hover:bg-emerald-50 border-2 border-neutral-50 transition-all active:scale-95"
                        onClick={() => navigate(`/teacher/assignments/${asg._id}/edit`)}
                       >
                         <Filter size={20} className="rotate-90" />
                       </Button>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        )}
      </main>

      <HomeFooter />
    </div>
  );
};

export default TeacherAssignmentsPage;
