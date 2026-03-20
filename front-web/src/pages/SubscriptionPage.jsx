import React, { useState, useEffect, useCallback } from "react";
import { 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  Loader2, 
  AlertCircle, 
  CreditCard,
  Copy,
  ExternalLink,
  X
} from "lucide-react";
import apiClient, { api, getErrorMessage, getAuthUser } from "../services/api";
import HomeHeader from "../layouts/home/HomeHeader";
import HomeFooter from "../layouts/home/HomeFooter";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const ROLE_PLAN_PREFIXES = {
  free_student: ["individual_free", "individual_standard", "individual_pro", "individual_premium"],
  center_student: [],
  teacher: ["free", "starter", "pro", "enterprise"],
  admin: ["free", "starter", "pro", "enterprise"],
};

const PLAN_DISPLAY_MAP = {
  individual_free: { name: "Trải nghiệm", price: 0 },
  individual_standard: { name: "Tiêu chuẩn", price: 299000 },
  individual_pro: { name: "Tiêu chuẩn", price: 299000 }, 
  individual_premium: { name: "Cao cấp", price: 499000 },
  // Teacher/Center plans
  free: { name: "Trải nghiệm", price: 0 },
  starter: { name: "Tiêu chuẩn", price: 299000 },
  pro: { name: "Cao cấp", price: 699000 },
};

const fmtVND = (n) => {
  if (n === 0) return "0 VNĐ";
  if (!n) return "Liên hệ";
  return n.toLocaleString('vi-VN').replace(/,/g, '.') + " VNĐ";
};

const SubscriptionPage = () => {
  const user = getAuthUser();
  const role = user?.role || "free_student";
  const allowedIds = ROLE_PLAN_PREFIXES[role] || [];

  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [instructions, setInstructions] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const plansRes = await apiClient.get(api.subscription.plans);
      const statusRes = await apiClient.get(api.subscription.status).catch(() => ({ data: { data: null } }));
      
      const rawPlans = plansRes.data?.data?.plans || plansRes.data?.data || [];
      
      // Normalize plans to ensure essaysPerMonth is correctly set
      const normalized = rawPlans.map(p => ({
        ...p,
        essaysPerMonth: p.essaysPerMonth ?? p.maxEssaysPerMonth ?? p.maxEssays ?? (p.id.includes('free') ? 5 : -1)
      }));

      let visiblePlans = allowedIds.length
        ? normalized.filter((p) => allowedIds.some((id) => p.id.startsWith(id.split("_")[0]) || p.id === id))
        : normalized;

      // Ensure the 3 tiers from the table are present
      const requiredTiers = (role === "teacher" || role === "admin")
        ? ["free", "starter", "pro"]
        : ["individual_free", "individual_standard", "individual_premium"];

      requiredTiers.forEach(tierId => {
        if (!visiblePlans.find(p => p.id === tierId || (tierId === 'individual_standard' && p.id === 'individual_pro'))) {
          // Add a mock plan if missing from API
          const display = PLAN_DISPLAY_MAP[tierId];
          visiblePlans.push({
            id: tierId,
            name: display.name,
            priceVND: display.price,
            essaysPerMonth: (tierId.includes('free') ? 5 : -1),
            features: (role === "teacher" || role === "admin")
              ? (tierId === 'free' 
                  ? ["Quản lý 1 lớp học", "Tối đa 10 học sinh", "Chấm 5 bài AI / tháng / học sinh"]
                  : tierId === 'starter'
                    ? ["Quản lý 3 lớp học", "Tối đa 50 học sinh", "Chấm AI không giới hạn", "Phân tích tiến độ học sinh"]
                    : ["Không giới hạn lớp học", "Không giới hạn học sinh", "Tính năng AI cao cấp nhất", "Hỗ trợ ưu tiên 24/7"])
              : (tierId === 'individual_free' 
                  ? ["5 bài chấm AI / tháng", "Phân tích từ vựng cơ bản", "Gợi ý sửa lỗi ngữ pháp"]
                  : tierId === 'individual_standard'
                    ? ["Không giới hạn bài Essay", "Phân tích chuyên sâu chuẩn VSTEP", "Gợi ý nâng cấp từ vựng B2/C1", "Lưu trữ lịch sử không giới hạn"]
                    : ["Tất cả tính năng bản Tiêu chuẩn", "Ưu tiên phản hồi AI nhanh nhất", "Hỗ trợ 1-1 từ đội ngũ học thuật", "Cập nhật sớm các tính năng mới"]),
            isMock: true
          });
        }
      });

      // Sort plans by price
      visiblePlans.sort((a, b) => (PLAN_DISPLAY_MAP[a.id]?.price || 0) - (PLAN_DISPLAY_MAP[b.id]?.price || 0));
        
      setPlans(visiblePlans);
      setStatus(statusRes.data?.data || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [role, allowedIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpgrade = async (planId) => {
    setUpgrading(true);
    try {
      const res = await apiClient.post(api.subscription.checkout, { planId });
      const d = res.data;
      if (!d.success && !d.data) throw new Error(d.message || "Không thể tạo lệnh thanh toán");
      setInstructions(d.data || d);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpgrading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFBFF]">
        <HomeHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-[#58cc02] animate-spin" />
          <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-sm">Đang tải các gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <HomeHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-20">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 mb-4 transition-all duration-700">
            <Zap size={14} className="fill-emerald-600" />
            <span>Nâng cấp trải nghiệm học tập</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-neutral-900 tracking-tight leading-[1.1] transition-all duration-700">
            Mở khóa sức mạnh <span className="text-emerald-600">AI chấm bài</span>
          </h1>
          <p className="text-xl text-neutral-500 font-medium leading-relaxed transition-all duration-700">
            Chọn gói dịch vụ phù hợp để nhận phản hồi chi tiết từ AI, giúp bạn cải thiện kỹ năng viết Essay theo chuẩn VSTEP nhanh chóng hơn.
          </p>
        </div>

        {/* Status Banner */}
        {status && (
          <div className="max-w-4xl mx-auto mb-16 transition-all duration-700">
            <div className={`p-8 rounded-[32px] border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${
              status.isActive && status.plan !== "free" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-900" 
                : "bg-white border-neutral-100 text-neutral-400"
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-inner ${
                  status.isActive && status.plan !== "free" ? "bg-white text-emerald-600" : "bg-neutral-50 text-neutral-300"
                }`}>
                  <Crown size={32} />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight mb-1">
                     Gói hiện tại: {PLAN_DISPLAY_MAP[status.plan]?.name || status.plan}
                   </h3>
                   <div className="flex items-center gap-4 text-sm font-bold opacity-75">
                      {status.daysRemaining != null && <span>{status.daysRemaining} ngày còn lại</span>}
                      {status.endDate && <span>Hết hạn: {new Date(status.endDate).toLocaleDateString('vi-VN')}</span>}
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${
                   status.isActive ? "bg-emerald-600 text-white border-emerald-600" : "bg-neutral-100 text-neutral-400 border-neutral-200"
                 }`}>
                   {status.isActive ? "Đang hoạt động" : "Hết hạn"}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="flex flex-wrap justify-center gap-10 mb-24 items-stretch">
          {plans.filter(p => p.id !== "enterprise").map((plan, idx) => {
            const display = PLAN_DISPLAY_MAP[plan.id] || { 
              name: plan.name, 
              price: plan.priceVND ?? plan.price ?? 0 
            };
            const isStandard = plan.id.includes("standard") || plan.id === "individual_pro";
            const isPremium = plan.id.includes("premium");
            const isCurrent = status?.plan === plan.id;
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-[48px] p-10 border-2 transition-all duration-500 hover:-translate-y-2 flex flex-col w-full max-w-[380px] ${
                  isStandard || isPremium
                    ? "border-emerald-500 shadow-2xl shadow-emerald-50 ring-4 ring-emerald-50/50" 
                    : "border-neutral-200 shadow-sm hover:border-emerald-200"
                }`}
              >
                {isStandard && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
                    Phổ biến nhất
                  </div>
                )}
                {isPremium && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
                    Gợi ý cho bạn
                  </div>
                )}

                <div className="mb-8 space-y-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
                    isStandard || isPremium ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"
                  }`}>
                    {isStandard ? <Zap size={28} /> : isPremium ? <Crown size={28} /> : <Check size={28} />}
                  </div>
                  <h3 className="text-3xl font-black text-neutral-900 tracking-tight">{display.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-neutral-900">
                      {fmtVND(display.price).replace(' VNĐ', '')}
                    </span>
                    {display.price > 0 && <span className="text-neutral-400 font-bold uppercase tracking-widest text-sm">/ Tháng</span>}
                  </div>
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.1em] mt-2">
                    {plan.essaysPerMonth === -1 ? "Không giới hạn bài Essay" : `${plan.essaysPerMonth} bài chấm AI / tháng`}
                  </p>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                   {plan.features?.map((feat, i) => (
                     <div key={i} className="flex items-start gap-3">
                       <div className={`mt-1 flex-shrink-0 ${isStandard || isPremium ? "text-emerald-600 font-bold" : "text-neutral-300"}`}>
                         <Check size={16} strokeWidth={isStandard || isPremium ? 4 : 2} />
                       </div>
                       <span className={`text-[13px] font-bold leading-relaxed ${isStandard || isPremium ? "text-neutral-900" : "text-neutral-500"}`}>{feat}</span>
                     </div>
                   ))}
                </div>

                <div className="mt-auto">
                    {isCurrent ? (
                    <Button className="w-full h-16 bg-emerald-50 text-emerald-700 rounded-[24px] font-black uppercase tracking-widest text-xs border-2 border-emerald-100 cursor-default">
                        Gói đang sử dụng
                    </Button>
                    ) : (
                    <Button 
                        className={`w-full h-16 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl ${
                        isStandard || isPremium
                            ? "bg-emerald-600 text-white hover:bg-neutral-900 shadow-emerald-200" 
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 shadow-neutral-100 border border-neutral-200"
                        }`}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={upgrading}
                    >
                        {upgrading ? <Loader2 className="animate-spin" size={20} /> : `Nâng cấp ngay`}
                    </Button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <HomeFooter />

      {/* Payment Modal */}
      {instructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md" onClick={() => setInstructions(null)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in motion-safe:slide-in-from-bottom-10 motion-safe:duration-500">
             <div className="bg-neutral-50 px-10 py-8 flex justify-between items-center border-b border-neutral-100">
                <div className="space-y-1">
                   <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Thanh toán nâng cấp</h2>
                   <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lệnh thanh toán: #{instructions.referenceCode}</p>
                </div>
                <button 
                  onClick={() => setInstructions(null)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-neutral-100 text-neutral-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
             </div>

             <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-10">
                {/* Amount Box */}
                <div className="bg-emerald-600 rounded-[32px] p-10 text-center text-white space-y-2 shadow-2xl shadow-emerald-100 relative overflow-hidden">
                   <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                   <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Số tiền cần chuyển</p>
                   <p className="text-5xl font-black">{fmtVND(instructions.amountVND || instructions.bankInstructions?.amountVND)}</p>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-6">
                   <div className="p-4 bg-white border-2 border-neutral-50 rounded-[40px] shadow-xl ring-8 ring-neutral-50/50">
                      <img 
                        src={instructions.bankInstructions?.qrCodeUrl} 
                        alt="Payment QR" 
                        className="w-64 h-64 rounded-xl"
                      />
                   </div>
                   <Button 
                    variant="outline"
                    className="gap-2 rounded-2xl border-neutral-100 font-bold"
                    onClick={() => window.open(instructions.bankInstructions?.qrCodeUrl, '_blank')}
                   >
                     <ExternalLink size={18} />
                     Mở ảnh QR lớn hơn
                   </Button>
                </div>

                <div className="relative flex items-center justify-center py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-neutral-100" /></div>
                  <span className="relative px-6 bg-white text-[10px] font-black text-neutral-200 uppercase tracking-[0.3em]">Hoặc chuyển khoản thủ công</span>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { label: "Ngân hàng", value: instructions.bankInstructions?.bankId },
                     { label: "Số tài khoản", value: instructions.bankInstructions?.bankAccount },
                     { label: "Tên tài khoản", value: instructions.bankInstructions?.accountName },
                     { label: "Số tiền", value: (instructions.bankInstructions?.amountVND)?.toLocaleString('vi-VN') },
                   ].map((item, i) => (
                     <div key={i} className="group bg-neutral-50 p-6 rounded-[28px] border border-neutral-100 flex flex-col gap-2 relative">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.label}</span>
                        <div className="flex justify-between items-center">
                           <span className="font-black text-neutral-900">{item.value}</span>
                           <button 
                             onClick={() => copyToClipboard(item.value, item.label)}
                             className="text-neutral-300 hover:text-emerald-600 transition-colors"
                           >
                              <Copy size={16} />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Transfer Note */}
                <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[32px] space-y-3 relative group overflow-hidden">
                   <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-200/30 rounded-full transition-all group-hover:scale-150" />
                   <div className="flex items-center gap-3 text-rose-600 mb-2">
                      <AlertCircle size={20} strokeWidth={3} />
                      <span className="text-sm font-black uppercase tracking-widest">Nội dung bắt buộc (Rất quan trọng)</span>
                   </div>
                   <div className="flex justify-between items-center bg-white border border-rose-100 p-6 rounded-2xl shadow-sm">
                      <span className="text-2xl font-black text-rose-600 select-all">{instructions.bankInstructions?.description}</span>
                      <button 
                        onClick={() => copyToClipboard(instructions.bankInstructions?.description, "Nội dung")}
                        className="text-rose-300 hover:text-rose-600 transition-colors"
                      >
                         <Copy size={20} />
                      </button>
                   </div>
                   <p className="text-xs font-bold text-rose-700 opacity-60 italic leading-relaxed">
                     Lưu ý: Bạn phải ghi đúng nội dung trên để hệ thống tự động kích hoạt gói ngay lập tức. Sau khi chuyển khoản, gói sẽ được kích hoạt trong 1-3 phút.
                   </p>
                </div>

                <div className="pt-4">
                   <Button 
                    className="w-full h-20 bg-neutral-900 hover:bg-emerald-600 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                    onClick={() => {
                        setInstructions(null);
                        loadData();
                        toast.success("Hệ thống đang xác nhận thanh toán của bạn!");
                    }}
                   >
                     Tôi đã hoàn tất chuyển khoản
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
