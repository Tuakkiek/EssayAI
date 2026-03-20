import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShortcutCard({ label, helper, link }) {
  return (
    <Link
      to={link}
      className="group flex items-center justify-between rounded-[24px] border border-[#e5e5ea] bg-white/90 px-5 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.1)] transition hover:-translate-y-0.5 hover:bg-[#f7f7f7]"
    >
      <div>
        <p className="text-sm font-semibold text-[#1d1d1f]">{label}</p>
        <p className="text-xs text-[#6e6e73]">{helper}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f9d6] text-[#2f7d1a] shadow-sm transition group-hover:scale-105">
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
      </div>
    </Link>
  );
}
