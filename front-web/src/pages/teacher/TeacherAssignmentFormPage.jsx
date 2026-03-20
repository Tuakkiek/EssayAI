import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Settings,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  Save,
  Send,
  Zap,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const BAND_LEVELS = [4.0, 5.0, 6.0, 7.0, 8.0];

const TeacherAssignmentFormPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    classId: searchParams.get("classId") || "",
    title: "",
    description: "",
    prompt: "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    maxAttempts: 1,
    status: "draft",
    gradingCriteria: {
      overview: "",
      requiredVocabulary: [],
      bandDescriptors: BAND_LEVELS.map(band => ({ band, descriptor: "" })),
      structureRequirements: "",
      penaltyNotes: "",
      additionalNotes: ""
    }
  });

  const loadClasses = useCallback(async () => {
    try {
      const res = await apiClient.get(api.classes.list);
      setClasses(res.data?.data?.classes || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  }, []);

  const loadAssignment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(api.assignments.byId(id));
      const rawData = res.data?.data;
      const data = rawData?.assignment || rawData;
      
      if (data) {
        const rawDate = data.dueDate || data.deadline;
        let formattedDate = "";
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split("T")[0];
          }
        }

        setFormData({
            ...formData,
            ...data,
            classId: data.classId?._id || data.classId || "",
            dueDate: formattedDate,
            gradingCriteria: data.gradingCriteria || formData.gradingCriteria
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClasses();
    if (isEdit) loadAssignment();
  }, [loadClasses, loadAssignment, isEdit]);

  const addVocab = () => {
    setFormData(prev => ({
      ...prev,
      gradingCriteria: {
        ...prev.gradingCriteria,
        requiredVocabulary: [
          ...(prev.gradingCriteria.requiredVocabulary || []),
          { word: "", synonyms: [], importance: "required" }
        ]
      }
    }));
  };

  const updateVocab = (index, key, value) => {
    const list = [...formData.gradingCriteria.requiredVocabulary];
    list[index] = { ...list[index], [key]: value };
    setFormData(prev => ({
      ...prev,
      gradingCriteria: { ...prev.gradingCriteria, requiredVocabulary: list }
    }));
  };

  const removeVocab = (index) => {
    const list = [...formData.gradingCriteria.requiredVocabulary];
    list.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      gradingCriteria: { ...prev.gradingCriteria, requiredVocabulary: list }
    }));
  };

  const updateBandDescriptor = (band, descriptor) => {
    const list = [...formData.gradingCriteria.bandDescriptors];
    const idx = list.findIndex(d => d.band === band);
    if (idx >= 0) list[idx] = { band, descriptor };
    else list.push({ band, descriptor });
    setFormData(prev => ({
      ...prev,
      gradingCriteria: { ...prev.gradingCriteria, bandDescriptors: list }
    }));
  };

  const handleSubmit = async (status) => {
    if (!formData.title || !formData.prompt || !formData.classId) {
      alert("Vui lòng nhập đủ các trường có dấu *");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, status };
      if (isEdit) {
        await apiClient.put(api.assignments.byId(id), payload);
      } else {
        await apiClient.post(api.assignments.list, payload);
      }
      navigate(formData.classId ? `/teacher/classes/${formData.classId}` : "/teacher/assignments");
    } catch (err) {
      setError(getErrorMessage(err));
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#58cc02] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col">
      <HomeHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
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
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
                {isEdit ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
              </h1>
              <p className="text-neutral-500 font-medium text-lg">
                Thiết lập đề bài và tiêu chí chấm điểm AI theo chuẩn VSTEP.
              </p>
            </div>
            
            <div className="flex gap-3">
               <Button 
                variant="outline" 
                className="rounded-2xl h-12 px-6 border-neutral-200 font-bold"
                onClick={() => handleSubmit("draft")}
                disabled={saving}
               >
                 {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="mr-2" />}
                 Lưu nháp
               </Button>
               <Button 
                className="bg-[#58cc02] hover:bg-[#46a302] rounded-2xl h-12 px-8 gap-2 shadow-lg shadow-emerald-50 font-bold"
                onClick={() => handleSubmit("published")}
                disabled={saving}
               >
                 {saving ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                 Xuất bản ngay
               </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="space-y-12 mb-20">
          {/* Basic Info Section */}
          <section className="bg-white rounded-[40px] p-10 border border-neutral-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-neutral-50 pb-6 mb-2">
               <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <Info size={20} />
               </div>
               <h2 className="text-xl font-bold text-neutral-900">Thông tin cơ bản</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Tiêu đề bài tập *</label>
                  <input 
                    type="text"
                    className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 px-6 h-14 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="VD: Writing Task 2 - Environmental Protection"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Lớp học *</label>
                  <select 
                    className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 px-6 h-14 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none"
                    value={formData.classId}
                    onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                  >
                    <option value="">Chọn lớp học</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Mô tả (Hướng dẫn ngắn)</label>
               <textarea 
                  className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 p-6 min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                  placeholder="Ghi chú ngắn gọn cho học sinh về bài tập này..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
               />
            </div>

            <div className="space-y-3">
               <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Đề bài (Prompt) *</label>
               <textarea 
                  className="w-full bg-neutral-50 rounded-[32px] border border-neutral-100 p-8 min-h-[200px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-lg leading-relaxed shadow-inner"
                  placeholder="Nhập đề bài chi tiết tại đây..."
                  value={formData.prompt}
                  onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Hạn nộp *</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 pointer-events-none" />
                    <input 
                      type="date"
                      className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 pl-14 pr-6 h-14 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                      value={formData.dueDate}
                      onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Số lần nộp tối đa</label>
                  <input 
                    type="number"
                    className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 px-6 h-14 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    min="1"
                    max="10"
                    value={formData.maxAttempts}
                    onChange={e => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }))}
                  />
               </div>
            </div>
          </section>

          {/* AI Criteria Section */}
          <section className="bg-white rounded-[40px] p-10 border border-neutral-100 shadow-sm space-y-10">
             <div className="flex items-center justify-between border-b border-neutral-50 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900">Cấu hình AI chấm bài</h2>
                </div>
                <div className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-tighter">VSTEP Standard</div>
             </div>

             <div className="space-y-10">
                {/* Vocabulary */}
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-800">Từ vựng yêu cầu</h3>
                        <p className="text-xs text-neutral-400 font-medium mt-1">Học sinh sẽ được cộng điểm nếu dùng đúng các từ khóa này.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-neutral-200 gap-2 h-10"
                        onClick={addVocab}
                      >
                        <Plus size={16} /> Thêm từ
                      </Button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {formData.gradingCriteria.requiredVocabulary.map((v, i) => (
                        <div key={i} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex flex-col md:flex-row gap-4 items-end">
                           <div className="flex-1 space-y-2 w-full">
                              <label className="text-[10px] font-black text-neutral-300 uppercase">Từ chính</label>
                              <input 
                                className="w-full bg-white rounded-xl border border-neutral-100 px-4 h-11 outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                value={v.word}
                                onChange={e => updateVocab(i, "word", e.target.value)}
                              />
                           </div>
                           <div className="flex-[2] space-y-2 w-full">
                              <label className="text-[10px] font-black text-neutral-300 uppercase">Từ đồng nghĩa (Cách nhau bởi dấu phẩy)</label>
                              <input 
                                className="w-full bg-white rounded-xl border border-neutral-100 px-4 h-11 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                                value={v.synonyms.join(", ")}
                                onChange={e => updateVocab(i, "synonyms", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                              />
                           </div>
                           <div className="flex gap-2">
                             {(['required', 'recommended']).map(imp => (
                               <button 
                                key={imp}
                                className={`px-4 h-11 rounded-xl text-xs font-bold transition-all border ${
                                  v.importance === imp 
                                    ? "bg-indigo-600 text-white border-indigo-600" 
                                    : "bg-white text-neutral-400 border-neutral-100 hover:border-neutral-300"
                                }`}
                                onClick={() => updateVocab(i, "importance", imp)}
                               >
                                 {imp === 'required' ? 'Bắt buộc' : 'Khuyến khích'}
                               </button>
                             ))}
                             <button 
                               className="h-11 w-11 flex items-center justify-center text-neutral-300 hover:text-rose-500 transition-colors"
                               onClick={() => removeVocab(i)}
                             >
                               <Trash2 size={18} />
                             </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Band Descriptors */}
                <div className="space-y-6">
                   <h3 className="text-sm font-bold text-neutral-800">Mô tả tiêu chí theo thang điểm</h3>
                   <div className="space-y-4">
                      {BAND_LEVELS.map(band => (
                        <div key={band} className="flex gap-6 group">
                           <div className="w-16 h-16 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                              {band.toFixed(1)}
                           </div>
                           <textarea 
                              className="flex-1 bg-neutral-50 rounded-2xl border border-neutral-100 p-4 h-16 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none focus:h-24"
                              placeholder={`Mô tả bài viết đạt band ${band.toFixed(1)}...`}
                              value={formData.gradingCriteria.bandDescriptors.find(d => d.band === band)?.descriptor || ""}
                              onChange={e => updateBandDescriptor(band, e.target.value)}
                           />
                        </div>
                      ))}
                   </div>
                </div>

                {/* Other AI Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Yêu cầu cấu trúc</label>
                      <textarea 
                        className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 p-5 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                        placeholder="VD: Phải có 3 đoạn, Conclusion phải tóm tắt được 2 ý chính..."
                        value={formData.gradingCriteria.structureRequirements}
                        onChange={e => setFormData(prev => ({ ...prev, gradingCriteria: { ...prev.gradingCriteria, structureRequirements: e.target.value } }))}
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Lưu ý trừ điểm</label>
                      <textarea 
                        className="w-full bg-neutral-50 rounded-2xl border border-neutral-100 p-5 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                        placeholder="VD: Sai lỗi mạo từ 'a/an/the' quá 3 lần sẽ bị trừ 0.5 điểm..."
                        value={formData.gradingCriteria.penaltyNotes}
                        onChange={e => setFormData(prev => ({ ...prev, gradingCriteria: { ...prev.gradingCriteria, penaltyNotes: e.target.value } }))}
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Ghi chú thêm cho AI chấm bài</label>
                   <textarea 
                      className="w-full bg-neutral-50 rounded-[24px] border border-neutral-100 p-6 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                      placeholder="Các chỉ dẫn đặc biệt khác dành cho mô hình AI..."
                      value={formData.gradingCriteria.additionalNotes}
                      onChange={e => setFormData(prev => ({ ...prev, gradingCriteria: { ...prev.gradingCriteria, additionalNotes: e.target.value } }))}
                   />
                </div>
             </div>
          </section>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
};

export default TeacherAssignmentFormPage;
