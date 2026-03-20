import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  UserPlus,
  ArrowLeft,
  Settings,
  X,
  Trash2,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const TeacherClassesPage = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(api.classes.list);
      const data = res.data?.data?.classes || res.data?.data || [];
      setClasses(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    setCreating(true);
    try {
      await apiClient.post(api.classes.create, {
        name: newClassName.trim(),
        description: newClassDesc.trim() || undefined
      });
      setIsModalOpen(false);
      setNewClassName("");
      setNewClassDesc("");
      loadClasses();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này? Hành động này không thể hoàn tác.")) return;
    
    try {
      await apiClient.delete(api.classes.delete(id));
      loadClasses();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-neutral-900 tracking-tight flex items-center gap-4">
               <div className="w-14 h-14 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-indigo-200">
                  <Users size={32} />
               </div>
               Lớp học của tôi
            </h1>
            <p className="text-neutral-500 font-bold text-lg uppercase tracking-wide opacity-80 pl-2">
               Quản lý danh sách lớp, mã tham gia và theo dõi học tập.
            </p>
          </div>

          <Button 
            className="bg-[#58cc02] hover:bg-black rounded-[24px] h-20 px-12 gap-3 shadow-2xl shadow-[#58cc02]/30 text-xl font-black transition-all hover:-translate-y-1 active:scale-95"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={28} />
            Tạo lớp mới
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12 max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 w-6 h-6 transition-colors group-focus-within:text-indigo-600" />
          <input 
            type="text" 
            placeholder="Tìm kiếm lớp học hoặc mã lớp..."
            className="w-full bg-white rounded-[24px] border-2 border-neutral-100 pl-16 pr-6 h-20 focus:border-indigo-600 outline-none transition-all shadow-sm font-black text-lg placeholder:text-neutral-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-16 h-16 text-[#58cc02] animate-spin" />
            <p className="text-neutral-500 font-black text-xl uppercase tracking-widest animate-pulse">Đang tải danh sách lớp học...</p>
          </div>
        ) : error ? (
           <div className="bg-rose-50 border-4 border-rose-100 p-16 rounded-[56px] text-center max-w-3xl mx-auto space-y-8 shadow-2xl shadow-rose-100/50">
             <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-rose-500 mx-auto shadow-sm">
               <AlertCircle size={48} />
             </div>
             <div className="space-y-4">
               <h2 className="text-3xl font-black text-neutral-900 leading-tight">Không thể tải dữ liệu</h2>
               <p className="text-xl font-bold text-rose-700 opacity-80">{error}</p>
             </div>
             <Button className="bg-rose-600 hover:bg-black rounded-[24px] h-16 px-12 text-lg font-black" onClick={loadClasses}>
               Thử lại
             </Button>
           </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-[56px] border-4 border-dashed border-neutral-100 p-24 text-center space-y-8 shadow-sm">
             <div className="w-24 h-24 bg-neutral-50 rounded-[32px] flex items-center justify-center text-neutral-300 mx-auto">
               <Users size={48} />
             </div>
             <div className="space-y-4">
               <h3 className="text-3xl font-black text-neutral-900 leading-tight">
                 {searchQuery ? "Không tìm thấy kết quả" : "Chưa có lớp học nào"}
               </h3>
               <p className="text-lg font-bold text-neutral-500 max-w-md mx-auto leading-relaxed">
                 {searchQuery ? "Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại mã lớp." : "Hãy bắt đầu bằng cách tạo lớp học đầu tiên của bạn để mời học sinh tham gia."}
               </p>
             </div>
             {!searchQuery && (
               <Button 
                className="bg-indigo-600 hover:bg-black rounded-[24px] h-20 px-16 text-xl font-black tracking-widest uppercase transition-all hover:-translate-y-1 active:scale-95 shadow-2xl shadow-indigo-100"
                onClick={() => setIsModalOpen(true)}
               >
                 Tạo lớp đầu tiên
               </Button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredClasses.map((cls) => (
              <div 
                key={cls._id}
                className="bg-white rounded-[48px] p-10 border-2 border-neutral-50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-[100px] -mr-12 -mt-12 transition-all group-hover:bg-indigo-600 group-hover:scale-110 duration-500" />
                
                <div className="relative z-10 space-y-8 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600 group-hover:bg-white transition-colors">
                      <Users size={32} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls._id); }}
                        title="Xóa lớp"
                       >
                          <Trash2 size={18} />
                       </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-neutral-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight line-clamp-2">{cls.name}</h3>
                    <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2.5 rounded-2xl border-2 border-neutral-100 w-fit">
                       <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Mã:</span>
                       <code className="text-base font-black text-indigo-700 tracking-widest">{cls.code}</code>
                       <button 
                        className="ml-2 text-neutral-300 hover:text-indigo-600 transition-colors p-1"
                        onClick={(e) => { e.stopPropagation(); copyCode(cls.code, cls._id); }}
                       >
                         {copiedId === cls._id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                       </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-6 border-y-2 border-neutral-50">
                    <div className="flex flex-col gap-1">
                       <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Học sinh</p>
                       <p className="text-2xl font-black text-neutral-900 tabular-nums">{cls.studentIds?.length || 0}</p>
                    </div>
                    <div className="h-10 w-px bg-neutral-100" />
                    <div className="flex flex-col gap-1 items-center">
                       <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Bài tập</p>
                       <p className="text-2xl font-black text-neutral-900 tabular-nums">{cls.stats?.assignmentCount || 0}</p>
                    </div>
                    <div className="h-10 w-px bg-neutral-100" />
                    <div className="flex flex-col gap-1 items-end">
                       <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Điểm TB</p>
                       <p className="text-2xl font-black text-indigo-600 tabular-nums">{(cls.stats?.averageScore || 0).toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                     <Button 
                      className="flex-1 bg-neutral-50 hover:bg-indigo-600 text-neutral-900 hover:text-white rounded-[24px] h-16 font-black uppercase text-xs tracking-[0.2em] gap-2 transition-all active:scale-95"
                      onClick={() => navigate(`/teacher/classes/${cls._id}`)}
                     >
                        Quản lý
                        <ChevronRight size={16} />
                     </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE CLASS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[56px] p-16 shadow-[0_40px_100px_rgba(0,0,0,0.2)] relative animate-in zoom-in-95 duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500" />
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-10 right-10 w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                 <X size={24} />
              </button>

              <div className="space-y-10">
                 <div className="space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center shadow-inner">
                       <Plus size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-neutral-900 tracking-tight leading-none">Tạo lớp học mới</h2>
                    <p className="text-neutral-500 font-bold text-lg leading-relaxed">
                       Thiết lập lớp học tập trung để quản lý bài tập và học sinh hiệu quả.
                    </p>
                 </div>

                 <form onSubmit={handleCreateClass} className="space-y-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2">Tên lớp học *</label>
                       <input 
                        type="text" 
                        placeholder="VD: Lớp Tiếng Anh 12A1"
                        required
                        className="w-full bg-neutral-50 rounded-[24px] border-2 border-neutral-100 p-6 h-20 focus:border-indigo-600 outline-none transition-all font-black text-xl placeholder:text-neutral-200"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                       />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2">Mô tả (Không bắt buộc)</label>
                       <textarea 
                        placeholder="VD: Luyện thi IELTS mục tiêu 7.0..."
                        className="w-full bg-neutral-50 rounded-[24px] border-2 border-neutral-100 p-6 min-h-[140px] focus:border-indigo-600 outline-none transition-all font-bold text-lg placeholder:text-neutral-200 resize-none"
                        value={newClassDesc}
                        onChange={(e) => setNewClassDesc(e.target.value)}
                       />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <Button 
                        type="button"
                        variant="ghost"
                        className="flex-1 rounded-[24px] h-20 font-black text-neutral-500 uppercase tracking-widest"
                        onClick={() => setIsModalOpen(false)}
                       >
                          Hủy bỏ
                       </Button>
                       <Button 
                        type="submit"
                        className="flex-[2] bg-indigo-600 hover:bg-black rounded-[24px] h-20 font-black text-xl uppercase tracking-widest shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                        disabled={creating}
                       >
                          {creating ? <Loader2 className="animate-spin" /> : "Tạo ngay lớp học"}
                       </Button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      <HomeFooter />
    </div>
  );
};

export default TeacherClassesPage;
