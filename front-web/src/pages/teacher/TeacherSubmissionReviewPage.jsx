import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Save,
  BarChart3,
  ChevronRight,
  User,
  Zap,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const TeacherSubmissionReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadSubmission = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(api.essays.byId(id));
      const data = res.data?.data;
      setSubmission(data);
      setFeedback(data?.teacherFeedback || "");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  const handleSaveReview = async () => {
    setSaving(true);
    try {
      await apiClient.post(api.teacher.review(id), { teacherFeedback: feedback });
      alert("Nhận xét đã được lưu thành công!");
      loadSubmission();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#58cc02] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-8 mb-12">
           <Button 
            variant="ghost" 
            className="w-fit gap-2 text-neutral-500 hover:text-neutral-900 rounded-xl"
            onClick={() => navigate(-1)}
           >
              <ArrowLeft size={18} />
              Quay lại
           </Button>

           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm">
                       {submission?.studentName?.[0] || "S"}
                    </div>
                    <div>
                       <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                         {submission?.studentName || submission?.studentId?.name || submission?.student?.name || "Học sinh"}
                       </h1>
                       <p className="text-neutral-500 font-bold text-sm uppercase tracking-widest">
                         {submission?.assignmentTitle || submission?.assignmentId?.title || submission?.assignment?.title || "Luyện viết tự do"}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-neutral-100 shadow-sm">
                 <div className="px-6 py-3 text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Điểm AI</p>
                    <p className="text-2xl font-black text-indigo-600">{submission?.overallScore?.toFixed(1) || "-"}</p>
                 </div>
                 <div className="w-px h-10 bg-neutral-100" />
                 <div className="px-6 py-3 text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Trạng thái</p>
                    <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      submission?.status === 'reviewed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {submission?.status === 'reviewed' ? 'Đã chấm' : 'Chờ duyệt'}
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {error ? (
           <div className="p-10 bg-rose-50 border border-rose-100 rounded-[40px] text-center max-w-2xl mx-auto space-y-4">
              <AlertCircle size={40} className="text-rose-500 mx-auto" />
              <h2 className="text-xl font-bold text-neutral-900">Không thể tải bài viết</h2>
              <p className="text-neutral-600">{error}</p>
              <Button onClick={loadSubmission} className="bg-rose-500 rounded-2xl">Thử lại</Button>
           </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Left: Essay & Feedback */}
            <div className="xl:col-span-8 space-y-10">
               <div className="bg-white rounded-[48px] p-12 border border-neutral-100 shadow-sm space-y-10">
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 border-b border-neutral-50 pb-6">
                        <FileText className="text-neutral-300" size={24} />
                        <h2 className="text-xl font-bold text-neutral-900">Nội dung bài viết</h2>
                     </div>
                     <p className="text-lg leading-[1.8] text-neutral-700 font-medium whitespace-pre-wrap">
                        {submission?.content}
                     </p>
                  </div>
               </div>

               <div className="bg-white rounded-[48px] p-12 border border-neutral-100 shadow-sm space-y-8 ring-4 ring-indigo-50/50">
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-6">
                     <div className="flex items-center gap-3">
                        <MessageSquare className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-bold text-neutral-900">Nhận xét của Giáo viên</h2>
                     </div>
                     <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Optional</span>
                  </div>
                  
                  <textarea 
                    className="w-full bg-neutral-50 rounded-[32px] border border-neutral-100 p-8 min-h-[200px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-lg resize-none placeholder:text-neutral-300"
                    placeholder="Nhập nhận xét, góp ý hoặc sửa lỗi trực tiếp cho học sinh tại đây..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />

                  <div className="flex justify-end">
                     <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 gap-2 shadow-xl shadow-indigo-100 font-black tracking-widest uppercase text-sm"
                      onClick={handleSaveReview}
                      disabled={saving}
                     >
                       {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                       Lưu đánh giá
                     </Button>
                  </div>
               </div>
            </div>

            {/* Right: AI Analysis Overview */}
            <div className="xl:col-span-4 space-y-8">
               <div className="bg-white rounded-[40px] p-10 border border-neutral-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                     <Zap className="text-[#f59e0b]" size={20} />
                     <h3 className="text-lg font-bold text-neutral-900">Phân tích từ AI</h3>
                  </div>

                  <div className="space-y-6">
                     {submission?.criteriaScores?.map((c, i) => (
                        <div key={i} className="space-y-3">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{c.criteria}</span>
                              <span className="text-sm font-black text-neutral-900">{c.score.toFixed(1)}</span>
                           </div>
                           <div className="h-2 w-full bg-neutral-50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.2)]"
                                style={{ width: `${(c.score / 9) * 100}%` }}
                              />
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="pt-8 border-t border-neutral-50 space-y-4">
                     <h4 className="text-sm font-bold text-neutral-800">Điểm mạnh & lưu ý</h4>
                     <ul className="space-y-3">
                        {submission?.improvements?.slice(0, 3).map((imp, i) => (
                           <li key={i} className="flex gap-3 text-xs font-medium text-neutral-600 leading-relaxed">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                              {imp.description || imp}
                           </li>
                        ))}
                     </ul>
                  </div>

                  <Button 
                    variant="outline"
                    className="w-full rounded-2xl border-neutral-200 h-12 text-xs font-bold gap-2"
                    onClick={() => navigate(`/essay/result?id=${id}`)}
                  >
                    Xem chi tiết kết quả AI
                    <ChevronRight size={14} />
                  </Button>
               </div>
               
               <div className="bg-emerald-50 rounded-[40px] p-8 border border-emerald-100 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <CheckCircle2 size={24} />
                     </div>
                     <p className="text-sm font-bold text-emerald-900">Hướng dẫn giáo viên</p>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                     Bạn có thể sử dụng kết quả từ AI làm cơ sở tham khảo và bổ sung ý kiến cá nhân để học sinh tiến bộ nhanh hơn. Sau khi lưu, học sinh sẽ nhận được thông báo về nhận xét của bạn.
                  </p>
               </div>
            </div>
          </div>
        )}
      </main>

      <HomeFooter />
    </div>
  );
};

export default TeacherSubmissionReviewPage;
