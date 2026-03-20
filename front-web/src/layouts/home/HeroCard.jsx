import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";

export default function HeroCard({ icon: Icon, title, hint, ctaLabel, ctaLink }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#e5e5ea] bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_rgba(88,204,2,0.35),transparent_65%)]" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),transparent_70%)]" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f9d6] text-[#2f7d1a] shadow-sm">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">
            Hôm nay
          </span>
        </div>
        <h2 className="text-2xl font-bold leading-tight text-[#1d1d1f] sm:text-[28px]">
          {title}
        </h2>
        <p className="text-sm text-[#6e6e73]">{hint}</p>
        <Button size="lg" className="w-full sm:w-fit" asChild>
          <Link to={ctaLink}>{ctaLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
