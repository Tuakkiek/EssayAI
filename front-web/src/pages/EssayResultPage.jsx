import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Share2,
  Trophy,
  Sparkles,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Loader2,
  BookOpen,
  PieChart,
  Target,
  PenLine,
  ExternalLink,
  History,
  LayoutDashboard,
  TrendingUp,
  Timer,
  Award,
  Zap,
  PartyPopper,
  Frown,
  Meh,
  Rocket,
  MessageSquare,
  Bookmark,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";

const POLL_MS = 3000;
const MAX_POLLS = 40;

const BAND_CONFIG = {
  excellent: { 
    color: "text-emerald-600", 
    bg: "bg-emerald-50", 
    border: "border-emerald-200",
    gradient: "from-emerald-600/20 to-teal-500/20",
    icon: Award, 
    label: "Xuất sắc!" 
  },
  high: { 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    gradient: "from-blue-600/20 to-indigo-500/20",
    icon: PartyPopper, 
    label: "Rất tốt!" 
  },
  mid: { 
    color: "text-amber-600", 
    bg: "bg-amber-50", 
    border: "border-amber-200",
    gradient: "from-amber-600/20 to-orange-500/20",
    icon: Zap, 
    label: "Cố gắng lên!" 
  },
  low: { 
    color: "text-rose-600", 
    bg: "bg-rose-50", 
    border: "border-rose-200",
    gradient: "from-rose-600/20 to-pink-500/20",
    icon: Rocket, 
    label: "Tiếp tục phát huy!" 
  },
};

function getBand(score) {
  if (score >= 7.5) return BAND_CONFIG.excellent;
  if (score >= 6.0) return BAND_CONFIG.high;
  if (score >= 5.0) return BAND_CONFIG.mid;
  return BAND_CONFIG.low;
}

function getEncouragementMessage(score) {
  if (score >= 8) return "Tuyệt vời! Bạn đang ở nhóm dẫn đầu.";
  if (score >= 7) return "Rất ấn tượng! Kỹ năng của bạn rất vững chắc.";
  if (score >= 6.5) return "Nỗ lực rất tốt! Bạn đang tiến bộ rõ rệt.";
  if (score >= 6) return "Làm tốt lắm! Hãy tiếp tục luyện tập để đạt band cao hơn.";
  if (score >= 5) return "Cố gắng lên! Mỗi bài viết đều giúp bạn mạnh mẽ hơn.";
  return "Đừng bỏ cuộc! Đây mới chỉ là điểm khởi đầu cho hành trình của bạn.";
}

const EssayResultPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const essayId = searchParams.get("essayId");

  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const pollRef = useRef(null);

  // Count-up animation for the score
  useEffect(() => {
    if (!essay || !essay.overallScore) return;
    
    const targetScore = essay.overallScore;
    const duration = 1200;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(parseFloat((easedProgress * targetScore).toFixed(1)));

      if (current >= steps) {
        clearInterval(timer);
        setDisplayScore(targetScore);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [essay]);

  const fetchEssay = useCallback(
    async (attempt = 0) => {
      if (!essayId) {
        setError("Không tìm thấy mã bài viết. Vui lòng quay lại Lịch sử.");
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(api.essays.byId(essayId));
        const data = res.data?.data?.essay ?? res.data?.data ?? res.data?.essay ?? res.data;

        if (!data || !data._id) {
          setError("Không thể tải thông tin bài viết.");
          setLoading(false);
          return;
        }

        if (["scored", "graded", "error"].includes(data.status)) {
          setEssay(data);
          setLoading(false);
          if (data.status === "error") {
            setError(data.errorMessage || "Có lỗi xảy ra trong quá trình chấm điểm.");
          }
        } else if (attempt < MAX_POLLS) {
          setPollCount(attempt + 1);
          setEssay(data); // Show pending state (original text) while polling
          pollRef.current = setTimeout(() => fetchEssay(attempt + 1), POLL_MS);
        } else {
          setLoading(false);
          setError("Quá trình chấm điểm đang mất nhiều thời gian hơn dự kiến. Vui lòng kiểm tra Lịch sử sau ít phút.");
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    },
    [essayId]
  );

  useEffect(() => {
    fetchEssay(0);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchEssay]);

  const handleShare = () => {
    const score = essay?.score ?? essay?.overallScore ?? essay?.overallBand;
    if (!score) return;
    
    const text = `Tôi vừa đạt ${score.toFixed(1)} điểm IELTS Writing với Essay AI!`;
    if (navigator.share) {
      navigator.share({
        title: "Essay AI Result",
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      toast.success("Đã sao chép liên kết!");
    }
  };

  if (loading && pollCount === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#58cc02] animate-spin mx-auto" />
          <p className="text-neutral-600 font-medium">Đang nạp kết quả chấm điểm...</p>
        </div>
      </div>
    );
  }

  if (error || (essay && essay.status === "error")) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <HomeHeader />
        <Card className="max-w-md w-full p-10 shadow-2xl border-rose-100 bg-white rounded-3xl mt-10">
          <div className="flex justify-center mb-6">
             <div className="p-6 bg-rose-50 rounded-full border-4 border-rose-100 shadow-inner">
               <Frown className="w-16 h-16 text-rose-500" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Lỗi chấm điểm!</h2>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            {error || essay?.errorMessage || "Đã có lỗi xảy ra trong quá trình phân tích bài viết của bạn."}
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button className="w-full bg-[#58cc02] hover:bg-[#46a302] py-6 text-base" onClick={() => navigate("/essay/input")}>
              Viết bài khác
            </Button>
            <Button variant="ghost" className="w-full py-6 text-base" onClick={() => navigate("/essay/history")}>
              Quay lại lịch sử
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Polling / Loading state
  if (essay && (essay.status === "pending" || essay.status === "grading")) {
    const elapsed = pollCount * (POLL_MS / 1000);
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <HomeHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center space-y-10">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
               <div className="relative z-10 bg-white shadow-2xl rounded-full w-40 h-40 flex items-center justify-center border-8 border-blue-50">
                  <Sparkles className="w-16 h-16 text-blue-500 animate-bounce" />
               </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">AI đang chấm điểm bài viết...</h2>
              <p className="text-neutral-500 text-lg max-w-lg mx-auto leading-relaxed">
                Hệ thống đang phân tích ngữ pháp, từ vựng và cấu trúc dựa trên tiêu chuẩn IELTS. 
                Vui lòng đợi trong giây lát.
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-3">
              <div className="w-full bg-neutral-200 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-600 h-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(100, (elapsed / 45) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-neutral-400 tracking-widest uppercase">
                <span>Khởi tạo</span>
                <span>{Math.round(elapsed)} Giây</span>
                <span>Hoàn tất</span>
              </div>
            </div>

            <Card className="p-8 bg-white/60 backdrop-blur-sm border-neutral-100 text-left shadow-lg grayscale opacity-40 select-none">
               <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-2">
                 <PenLine className="w-4 h-4 text-neutral-400" />
                 <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Đang phân tích nội dung</span>
               </div>
               <p className="text-neutral-500 line-clamp-4 leading-relaxed font-serif whitespace-pre-wrap italic">
                 {essay.originalText || essay.text}
               </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Final Scored State
  const band = getBand(essay.overallScore || 0);
  const bd = essay.scoreBreakdown || {};
  const grammarErrors = Array.isArray(essay.grammarErrors) ? essay.grammarErrors : [];
  const suggestions = Array.isArray(essay.suggestions) ? essay.suggestions : [];
  const topicTitle = typeof essay.assignmentId === "object" ? essay.assignmentId?.title : "Bài viết tự do";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <HomeHeader />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-10 lg:py-16">
        {/* Breadcrumbs & Title */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
               <Link to="/home" className="hover:text-[#58cc02] flex items-center gap-1.5 transition-colors">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Trang chủ</span>
               </Link>
               <span className="opacity-30">/</span>
               <Link to="/essay/history" className="hover:text-[#58cc02] flex items-center gap-1.5 transition-colors">
                  <History className="w-3.5 h-3.5" />
                  <span>Lịch sử</span>
               </Link>
               <span className="opacity-30">/</span>
               <span className="text-neutral-500 font-bold">Kết quả bài làm</span>
            </div>
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
              {topicTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                className="rounded-2xl border-neutral-200 h-12 px-6"
                onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2 text-blue-600" />
              Chia sẻ kết quả
            </Button>
            <Button 
                variant="outline"
                className="rounded-2xl border-neutral-200 h-12 px-6 gap-2 hidden sm:flex"
                onClick={() => navigate("/progress")}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Xem tiến độ</span>
            </Button>
            <Button 
                className="bg-[#58cc02] hover:bg-[#46a302] rounded-2xl h-12 px-8 shadow-lg shadow-[#58cc02]/20"
                onClick={() => navigate("/essay/input")}
            >
              <PenLine className="w-4 h-4 mr-2" />
              Luyện bài mới
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Submission & Feedback */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* AI Narrative Feedback */}
            <Card className="rounded-[40px] border-none shadow-2xl shadow-neutral-200/50 bg-white overflow-hidden">
               <div className="bg-indigo-600 p-8 text-white">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">Đánh giá tổng quát từ AI</h3>
                  </div>
                  <p className="text-indigo-100 font-medium">Phân tích chi tiết về phong cách và nội dung bài viết của bạn.</p>
               </div>
               <CardContent className="p-10">
                  <div className="relative">
                    <MessageSquare className="absolute -top-4 -left-4 w-12 h-12 text-indigo-50 opacity-10 rotate-12" />
                    <p className="text-neutral-700 text-lg leading-relaxed whitespace-pre-line font-medium relative z-10">
                      {essay.feedback || essay.aiFeedback || "Đang cập nhật nhận xét chi tiết..."}
                    </p>
                  </div>
               </CardContent>
            </Card>

            {/* Original Submission */}
            <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                 <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                   <BookOpen className="w-5 h-5 text-[#58cc02]" />
                   Bài viết của bạn
                 </h3>
                 <div className="flex items-center gap-4 text-sm font-bold text-neutral-400">
                    <span className="flex items-center gap-1.5"><Timer className="w-4 h-4" /> {Math.floor(essay.wordCount / 5)} phút</span>
                    <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {essay.wordCount} từ</span>
                 </div>
              </div>
              <div className="prose prose-neutral max-w-none">
                 <p className="text-neutral-600 leading-loose font-serif text-lg whitespace-pre-wrap">
                   {essay.originalText || essay.text}
                 </p>
              </div>
            </Card>

            {/* Detailed Improvements Feed */}
            <div className="space-y-6">
               <h3 className="text-2xl font-extrabold text-neutral-900 flex items-center gap-3 px-4">
                 <Bookmark className="w-6 h-6 text-rose-500" />
                 Các điểm cần cải thiện ({grammarErrors.length + suggestions.length})
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {grammarErrors.length === 0 && suggestions.length === 0 ? (
                    <Card className="col-span-full rounded-[40px] border-none bg-emerald-50 p-10 flex flex-col items-center text-center gap-4 shadow-inner">
                       <div className="p-4 bg-white rounded-full shadow-lg text-emerald-500">
                          <CheckCircle2 className="w-10 h-10" />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-xl font-bold text-emerald-900">Không tìm thấy lỗi nào!</h4>
                          <p className="text-emerald-700 font-medium">Bạn đã hoàn thành bài viết này một cách xuất sắc mà không mắc lỗi ngữ pháp hay từ vựng cơ bản nào. Tiếp tục phát huy nhé!</p>
                       </div>
                    </Card>
                 ) : (
                    <>
                       {grammarErrors.map((err, idx) => (
                          <Card key={`err-${idx}`} className="rounded-3xl border-rose-100 hover:border-rose-300 transition-all hover:shadow-xl group bg-white overflow-hidden">
                             <div className="bg-rose-50/50 p-6 flex flex-col h-full space-y-4">
                                <div className="flex items-center gap-3">
                                   <div className="bg-rose-500 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-rose-200">
                                     <AlertCircle className="w-4 h-4" />
                                   </div>
                                   <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Lỗi Ngữ pháp</span>
                                </div>
                                <p className="text-neutral-900 font-bold leading-snug flex-1">{err.explanation || err.message}</p>
                                <div className="space-y-2 border-t border-rose-100 pt-4">
                                   <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Gốc / Sửa</p>
                                   <div className="text-sm">
                                      <span className="text-neutral-400 line-through mr-2">"{err.original}"</span>
                                      <span className="text-emerald-600 font-black">"{err.corrected}"</span>
                                   </div>
                                </div>
                             </div>
                          </Card>
                       ))}
                       
                       {suggestions.map((sug, idx) => (
                          <Card key={`sug-${idx}`} className="rounded-3xl border-blue-100 hover:border-blue-300 transition-all hover:shadow-xl group bg-white overflow-hidden">
                             <div className="bg-blue-50/50 p-6 flex flex-col h-full space-y-4">
                                <div className="flex items-center gap-3">
                                   <div className="bg-blue-500 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
                                     <CheckCircle2 className="w-4 h-4" />
                                   </div>
                                   <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Gợi ý từ vựng</span>
                                </div>
                                <p className="text-neutral-900 font-bold leading-snug flex-1">{sug.text || sug.explanation || sug.improved}</p>
                                {sug.original && (
                                   <div className="border-t border-blue-100 pt-4 text-sm text-neutral-400 italic font-medium">
                                     Trong câu: "{sug.original}"
                                   </div>
                                )}
                             </div>
                          </Card>
                       ))}
                    </>
                 )}
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Scores & Stats */}
          <aside className="lg:col-span-4 sticky top-24 space-y-8">
            
            {/* Main Score & Band */}
            <Card className={`rounded-[48px] border-none overflow-hidden shadow-2xl ${band.bg} relative group p-10 text-center`}>
               <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${band.gradient} opacity-50`} />
               
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-center group-hover:drop-shadow-lg transition-transform hover:scale-110 duration-500">
                     <div className={`p-4 rounded-3xl bg-white shadow-xl flex items-center justify-center ${band.color}`}>
                        <band.icon className="w-12 h-12" strokeWidth={2.5} />
                     </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-2xl font-black uppercase tracking-widest ${band.color}`}>{band.label}</h4>
                    <p className="text-neutral-500 text-sm font-bold opacity-60">IELTS OVERALL BAND</p>
                  </div>
                  
                  <div className="relative py-4 flex flex-col items-center">
                    <span className={`text-[120px] leading-none font-black tracking-tighter drop-shadow-2xl ${band.color}`}>
                      {displayScore.toFixed(1)}
                    </span>
                  </div>

                  <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl p-5 shadow-inner">
                    <p className={`text-lg font-extrabold leading-snug ${band.color}`}>
                      {getEncouragementMessage(essay.overallScore || 0)}
                    </p>
                  </div>
               </div>
            </Card>

            {/* Breakdown Card */}
            <Card className="rounded-[40px] border-none shadow-xl bg-white p-8 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-neutral-400" />
                    Điểm chi tiết
                  </h3>
               </div>
               
               <div className="space-y-8">
                  {[
                    { label: "Nội dung", value: bd.taskAchievement ?? bd.taskResponse ?? 0, color: "bg-indigo-500" },
                    { label: "Mạch lạc", value: bd.coherenceCohesion ?? 0, color: "bg-violet-500" },
                    { label: "Từ vựng", value: bd.lexicalResource ?? 0, color: "bg-fuchsia-500" },
                    { label: "Ngữ pháp", value: bd.grammaticalRangeAccuracy ?? 0, color: "bg-amber-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="space-y-3">
                       <div className="flex justify-between items-end px-1">
                          <span className="text-sm font-black text-neutral-400 uppercase tracking-widest">{label}</span>
                          <span className="text-2xl font-black text-neutral-900 tabular-nums">{(value || 0).toFixed(1)}</span>
                       </div>
                       <div className="h-4 w-full bg-neutral-50 rounded-full border border-neutral-100 overflow-hidden shadow-inner p-1">
                          <div 
                            className={`${color} h-full rounded-full shadow-lg shadow-${color.split('-')[1]}-200 transition-all duration-1000 delay-500`}
                            style={{ width: `${(value / 9) * 100}%` }}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </Card>

            {/* Quick Action Suggestion */}
            <Card className="rounded-[40px] border-none bg-indigo-900 p-8 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-indigo-200">
               <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <Lightbulb size={120} />
               </div>
               <div className="relative z-10 space-y-4">
                  <span className="bg-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Lời khuyên tập trung</span>
                  <p className="text-xl font-medium leading-relaxed">
                    Nâng cao kỹ năng <span className="font-black text-[#58cc02] underline underline-offset-4">
                      {Object.entries(bd).sort((a,b) => (a[1] || 0) - (b[1] || 0))[0][0].replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span> để nhanh chóng đạt band điểm cao hơn.
                  </p>
                  <Button variant="ghost" className="text-white hover:bg-white/10 p-0 h-auto font-bold flex items-center gap-2 group/btn">
                    Xem hướng dẫn chi tiết <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
               </div>
            </Card>

          </aside>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
};

export default EssayResultPage;
