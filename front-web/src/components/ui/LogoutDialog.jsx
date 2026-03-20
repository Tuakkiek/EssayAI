import React from "react";
import { LogOut, X } from "lucide-react";

export default function LogoutDialog({ isOpen, onClose, onConfirm, isLoggingOut }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Dialog Card */}
      <div className="relative w-full max-w-[360px] transform overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 scale-100 opacity-100">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-[#ccc] hover:text-[#888] transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon Header */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#58cc02]/15 text-[#58cc02]">
            <LogOut size={32} />
          </div>

          {/* Text Content */}
          <h2 className="mb-2 font-display text-[20px] font-black tracking-tight text-[#1d1d1f]">
            Đăng xuất?
          </h2>
          <p className="mb-8 text-[14px] leading-relaxed text-[#6e6e73]">
            Bạn có chắc chắn muốn đăng xuất khỏi <br/>
            <span className="font-bold text-[#58cc02]">Essay AI</span> không?
          </p>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoggingOut}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#58cc02] text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(88,204,2,0.3)] transition-all hover:bg-[#46a302] active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
            <button
              onClick={onClose}
              disabled={isLoggingOut}
              className="h-12 w-full text-[14px] font-bold text-[#6e6e73] transition-colors hover:text-[#1d1d1f] disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
