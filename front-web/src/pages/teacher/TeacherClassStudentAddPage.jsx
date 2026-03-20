import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Phone,
  User as UserIcon,
  XCircle,
  Hash,
  Copy,
  Table as TableIcon,
  RefreshCcw,
  Users,
  Plus,
  Minus,
} from "lucide-react";
import apiClient, { api, getErrorMessage } from "../../services/api";
import HomeHeader from "../../layouts/home/HomeHeader";
import HomeFooter from "../../layouts/home/HomeFooter";
import { Button } from "../../components/ui/button";

const TeacherClassStudentAddPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [step, setStep] = useState("count"); // count, form, result
  const [studentCount, setStudentCount] = useState(10); // Standard default
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState([]);

  const loadClass = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(api.classes.byId(classId));
      setCls(res.data?.data?.class || res.data?.data?.cls || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  const handleContinue = () => {
    const count = parseInt(studentCount, 10);
    if (!Number.isFinite(count) || count <= 0) {
      alert("Vui lòng nhập số lượng học sinh > 0");
      return;
    }
    if (count > 200) {
      alert("Tối đa 200 học sinh mỗi lần tạo");
      return;
    }
    setRows(Array.from({ length: count }, () => ({ name: "", phone: "" })));
    setStep("form");
  };

  const updateRow = (index, field, value) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const studentsToCreate = rows.filter(r => r.name.trim() || r.phone.trim());
      if (studentsToCreate.length === 0) {
        alert("Vui lòng nhập thông tin ít nhất một học sinh");
        setSaving(false);
        return;
      }

      const res = await apiClient.post(api.classes.bulkCreateStudents(classId), { 
        students: studentsToCreate 
      });
      
      const data = res.data?.data;
      setResults(data?.results ?? []);
      setStep("result");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const adjustCount = (val) => {
    setStudentCount(prev => {
      const next = (parseInt(prev, 10) || 0) + val;
      return next > 0 ? next : 1;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#58cc02] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans selection:bg-indigo-100">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-6 mb-12">
           <Button 
            variant="ghost" 
            className="w-fit gap-2 text-neutral-700 hover:text-neutral-900 rounded-xl font-black uppercase text-xs tracking-widest"
            onClick={() => navigate(-1)}
           >
              <ArrowLeft size={18} />
              Quay lại danh sách lớp
           </Button>

           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-white p-10 rounded-[48px] border border-neutral-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-indigo-100/50" />
              
              <div className="space-y-4 relative">
                 <div className="flex items-center gap-3 text-indigo-700 font-black uppercase tracking-widest text-xs bg-indigo-50 px-4 py-2 rounded-2xl w-fit border border-indigo-200">
                    <UserPlus size={16} />
                    <span>Quản lý học sinh tập trung</span>
                 </div>
                 <h1 className="text-5xl font-black text-neutral-900 tracking-tight leading-none">
                    Tạo học sinh mới
                 </h1>
                 <p className="text-neutral-700 font-black text-xl flex items-center gap-2">
                    Lớp: <span className="text-indigo-700 px-3 py-1 bg-indigo-50 rounded-lg">{cls?.name}</span>
                 </p>
              </div>

              {/* Step Progress - Web Layout */}
              <div className="flex items-center gap-6 relative">
                 {[
                   { id: "count", label: "01. Số lượng", desc: "Thiết lập ban đầu" },
                   { id: "form", label: "02. Nhập liệu", desc: "Bảng SĐT & Họ tên" },
                   { id: "result", label: "03. Hoàn tất", desc: "Báo cáo xử lý" }
                 ].map((s, idx) => (
                   <div 
                    key={s.id}
                    className={`flex flex-col gap-1 transition-all duration-500 ${step === s.id ? 'opacity-100 scale-105' : 'opacity-60 grayscale'}`}
                   >
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">{s.label}</span>
                      <span className="text-[10px] font-black text-neutral-500">{s.desc}</span>
                      {step === s.id && <div className="h-1.5 w-full bg-indigo-600 rounded-full mt-2 animate-in slide-in-from-left duration-700" />}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {error && (
            <div className="mb-10 p-6 bg-rose-50 border border-rose-200 rounded-[32px] flex items-center gap-5 text-rose-800 font-extrabold shadow-xl shadow-rose-100/50 animate-in shake duration-500">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <AlertCircle size={28} />
               </div>
               <p className="text-lg">{error}</p>
            </div>
        )}

        {/* STEP 1: COUNT - WEB OPTIMIZED REDESIGN */}
        {step === "count" && (
           <div className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 duration-500">
              <div className="bg-white rounded-[56px] p-16 border border-neutral-100 shadow-2xl shadow-indigo-100/40 relative overflow-hidden group">
                 {/* Decorative background element */}
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500 opacity-20" />
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                       <div className="w-20 h-20 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-200">
                          <Hash size={40} />
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-4xl font-black text-neutral-900 leading-none tracking-tight">Cần thêm bao nhiêu học sinh?</h3>
                          <p className="text-neutral-700 font-black text-lg uppercase tracking-wide opacity-80">
                             Hệ thống sẽ tạo số dòng tương ứng để bạn nhập liệu nhanh.
                          </p>
                       </div>

                       {/* Quick Select Buttons */}
                       <div className="space-y-4 pt-4">
                          <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest pl-1">Chọn nhanh số lượng:</p>
                          <div className="flex flex-wrap gap-3">
                             {[5, 10, 25, 50, 100].map(val => (
                                <button
                                  key={val}
                                  onClick={() => setStudentCount(val)}
                                  className={`px-6 py-4 rounded-2xl font-black text-sm transition-all border-2 ${
                                     studentCount === val 
                                     ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200 -translate-y-1' 
                                     : 'bg-white text-neutral-800 border-neutral-100 hover:border-indigo-600 hover:text-indigo-600'
                                  }`}
                                >
                                   {val}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="bg-neutral-50/50 rounded-[48px] p-12 border-2 border-neutral-50 space-y-10 group-hover:bg-white transition-colors duration-500">
                       <div className="flex items-center justify-between gap-6">
                          <button 
                            onClick={() => adjustCount(-1)}
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:border-rose-200 border-2 border-transparent transition-all shadow-sm active:scale-90"
                          >
                             <Minus size={28} />
                          </button>
                          
                          <div className="flex-1 relative">
                             <input 
                               type="number"
                               autoFocus
                               className="w-full bg-white rounded-3xl border-4 border-neutral-100 px-1 py-0 h-16 outline-none focus:border-indigo-600 transition-all text-center text-3xl font-bold text-neutral-900 shadow-inner"
                               placeholder="10"
                               min="1"
                               max="200"
                               value={studentCount}
                               onChange={e => {
                                 const val = e.target.value;
                                 setStudentCount(val === "" ? "" : (parseInt(val, 10) || 0));
                               }}
                             />
                          </div>

                          <button 
                            onClick={() => adjustCount(1)}
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-neutral-400 hover:text-emerald-600 hover:border-emerald-200 border-2 border-transparent transition-all shadow-sm active:scale-90"
                          >
                             <Plus size={28} />
                          </button>
                       </div>

                       <div className="space-y-6">
                          <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 flex items-center gap-5">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                <TableIcon size={24} />
                             </div>
                             <p className="text-sm font-black text-indigo-800 uppercase tracking-tight leading-relaxed">
                                Bạn sẽ nhập <span className="text-indigo-600 text-lg mx-1">{studentCount || 0}</span> dòng dữ liệu tiếp theo.
                             </p>
                          </div>

                          <Button 
                            className="w-full bg-indigo-600 hover:bg-neutral-900 rounded-[32px] h-20 text-xl font-black tracking-[0.2em] uppercase shadow-2xl shadow-indigo-200/50 transition-all hover:-translate-y-1 active:scale-[0.98]"
                            onClick={handleContinue}
                          >
                             Bắt đầu nhập liệu
                             <ChevronRight className="ml-3" size={24} />
                          </Button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* STEP 2: FORM - WEB OPTIMIZED TABLE */}
        {step === "form" && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="bg-white rounded-[48px] border border-neutral-100 shadow-2xl shadow-neutral-200/20 overflow-hidden flex flex-col">
                 <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-white relative z-10 shadow-sm">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                          <TableIcon size={24} />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-neutral-900">Bảng nhập liệu học sinh</h3>
                          <p className="text-xs font-semibold text-neutral-500">Thiết lập dữ liệu cho {rows.length} tài khoản mới</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <Button 
                         variant="outline" 
                         className="rounded-2xl h-14 px-6 border-neutral-200 text-neutral-700 hover:text-indigo-600 hover:border-indigo-300 gap-2 font-black text-xs uppercase tracking-widest bg-white"
                         onClick={() => setStep("count")}
                       >
                          <RefreshCcw size={16} />
                          Thay đổi số lượng
                       </Button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-x-auto max-h-[65vh] overflow-y-auto custom-scrollbar">
                    <table className="w-full border-collapse text-neutral-900">
                       <thead className="sticky top-0 z-10 bg-neutral-50/50 backdrop-blur-md">
                          <tr className="text-left border-b border-neutral-100">
                             <th className="p-6 font-display text-[11px] font-bold text-neutral-500 uppercase tracking-widest w-24 text-center">STT</th>
                             <th className="p-6 font-display text-[11px] font-bold text-neutral-500 uppercase tracking-widest w-2/5">Thông tin điện thoại</th>
                             <th className="p-6 font-display text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Họ và tên đầy đủ</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-neutral-50">
                          {rows.map((r, i) => (
                             <tr key={i} className="group hover:bg-indigo-50/20 transition-all">
                                <td className="p-5 text-center text-[15px] font-bold text-neutral-400 group-hover:text-indigo-600 transition-colors">
                                   {String(i + 1).padStart(2, '0')}
                                </td>
                                <td className="p-5">
                                   <div className="relative group/field">
                                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within/field:text-indigo-600 transition-colors" />
                                      <input 
                                        type="tel"
                                        className="w-full bg-neutral-50 rounded-[24px] border-2 border-neutral-100 pl-16 pr-8 h-16 outline-none focus:border-indigo-600 focus:bg-white transition-all text-lg font-black placeholder:text-neutral-400 shadow-sm"
                                        placeholder="09xx xxx xxx"
                                        value={r.phone}
                                        onChange={e => updateRow(i, "phone", e.target.value)}
                                      />
                                   </div>
                                </td>
                                <td className="p-5">
                                   <div className="relative group/field">
                                      <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within/field:text-indigo-600 transition-colors" />
                                      <input 
                                        type="text"
                                        className="w-full bg-neutral-50 rounded-[24px] border-2 border-neutral-100 pl-16 pr-8 h-16 outline-none focus:border-indigo-600 focus:bg-white transition-all text-lg font-black placeholder:text-neutral-400 shadow-sm"
                                        placeholder="Học sinh A"
                                        value={r.name}
                                        onChange={e => updateRow(i, "name", e.target.value)}
                                      />
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 <div className="p-8 border-t border-neutral-100 bg-white flex justify-end items-center gap-4">
                    <Button 
                      variant="ghost" 
                      className="rounded-2xl h-14 px-8 font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                      onClick={() => navigate(-1)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button 
                      className="bg-[#58cc02] hover:bg-black rounded-2xl h-14 px-10 font-bold text-white shadow-lg shadow-[#58cc02]/20 transition-all active:scale-[0.98]"
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Xác nhận tạo học sinh</span>
                          <ChevronRight size={18}/>
                        </div>
                      )}
                    </Button>
                 </div>
              </div>
           </div>
        )}

        {/* STEP 3: RESULT - CREATION REPORT */}
        {step === "result" && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
                 <div className="w-20 h-20 bg-[#58cc02] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-[#58cc02]/40 mb-8">
                    <CheckCircle2 size={40} />
                 </div>
                 <h2 className="text-5xl font-black text-neutral-900 tracking-tight">Xử lý hoàn tất!</h2>
                 <p className="text-xl font-black text-neutral-700 leading-relaxed uppercase tracking-wide">
                    Dưới đây là báo cáo chi tiết cho {results.length} tài khoản trong lớp 
                    <span className="text-indigo-600 px-2">"{cls?.name}"</span>
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {results.map((r, i) => (
                    <div 
                      key={i} 
                      className={`group bg-white rounded-[48px] p-10 border-2 transition-all hover:shadow-2xl flex flex-col gap-6 relative overflow-hidden ${
                         r.status === 'created' ? 'border-emerald-100 bg-emerald-50/10' : 
                         r.status === 'linked' ? 'border-indigo-100' : 'border-rose-100 scale-95 opacity-90'
                      }`}
                    >
                       <div className="flex justify-between items-center text-neutral-900">
                          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${
                             r.status === 'created' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                             r.status === 'linked' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-rose-50 text-rose-700'
                          }`}>
                             {r.status === 'created' ? '🆕 Tạo mới' : r.status === 'linked' ? '✅ Liên kết' : '❌ Lỗi'}
                          </div>
                          <span className="text-xs font-black text-neutral-500 tabular-nums">ID #{String(r.rowNumber).padStart(2, '0')}</span>
                       </div>

                       <div className="space-y-1">
                          <p className="text-2xl font-black text-neutral-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase">{r.name}</p>
                          <p className="text-lg font-black text-neutral-700 tracking-tight">{r.phone}</p>
                       </div>

                       {r.status === 'created' && r.tempPassword && (
                          <div className="mt-4 p-6 bg-white rounded-[32px] border-2 border-amber-100 shadow-inner space-y-4 relative overflow-hidden">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Mật khẩu đăng nhập</span>
                                <ShieldCheck size={16} className="text-amber-500" />
                             </div>
                             <div className="flex items-center justify-between gap-4">
                                <code className="text-3xl font-black text-indigo-700 tracking-[0.2em] font-mono">{r.tempPassword}</code>
                                <button 
                                  onClick={() => copyToClipboard(r.tempPassword)}
                                  className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                                  title="Copy mật khẩu"
                                >
                                   <Copy size={20} />
                                </button>
                             </div>
                          </div>
                       )}

                       {r.status === 'linked' && (
                          <div className="mt-4 flex items-center gap-4 text-indigo-800 bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100">
                             <Users size={24} />
                             <span className="text-sm font-black italic uppercase tracking-wider">Tài khoản này đã có sẵn trên hệ thống</span>
                          </div>
                       )}

                       {r.status === 'error' && (
                          <div className="mt-4 flex flex-col gap-2 p-6 bg-rose-50 rounded-[32px] border border-rose-100">
                             <div className="flex items-center gap-3 text-rose-800 font-black text-sm uppercase tracking-widest">
                                <XCircle size={20} />
                                <span>Lỗi dữ liệu</span>
                             </div>
                             <p className="text-sm font-black text-rose-700">{r.reason}</p>
                          </div>
                       )}
                    </div>
                 ))}
              </div>

              <div className="flex flex-col items-center gap-8 pt-16">
                 <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[40px] max-w-2xl flex gap-6 items-center shadow-sm">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-700 shadow-sm shrink-0 border border-indigo-100">
                       <AlertCircle size={32} />
                    </div>
                    <p className="text-sm font-black text-indigo-900 leading-relaxed uppercase tracking-wider">
                       Đừng quên gửi mật khẩu tạm thời cho các học sinh mới tạo để các em có thể đăng nhập vào ứng dụng.
                    </p>
                 </div>
                 
                 <Button 
                   className="bg-neutral-900 hover:bg-indigo-600 rounded-[32px] h-24 px-20 text-xl font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-2"
                   onClick={() => navigate(`/teacher/classes/${classId}`)}
                 >
                   Tiếp tục quản lý lớp
                 </Button>
              </div>
           </div>
        )}

        {/* FAQ Section */}
        {step !== "result" && (
           <div className="mt-16 bg-white rounded-[40px] p-10 border border-neutral-100 shadow-sm space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 text-indigo-700 mb-2">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <AlertCircle size={20} />
                 </div>
                 <h4 className="font-black text-lg">Bạn cần biết</h4>
              </div>
              <ul className="space-y-4">
                 {[
                   "Nếu số điện thoại đã tồn tại, hệ thống sẽ tự động thêm học sinh đó vào lớp thay vì tạo mới.",
                   "Học sinh có thể tự tham gia bằng mã lớp: " + (cls?.code || "...") + ".",
                   "Mật khẩu tạm thời sẽ chỉ hiển thị ở bước hoàn tất. Vui lòng lưu lại để gửi cho học sinh."
                 ].map((txt, i) => (
                   <li key={i} className="flex gap-4 text-sm font-black text-neutral-800 leading-relaxed uppercase tracking-tight">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      {txt}
                   </li>
                 ))}
              </ul>
           </div>
        )}
      </main>

      <HomeFooter />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        /* Hide spin buttons */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  );
};

export default TeacherClassStudentAddPage;
