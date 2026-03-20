import { cn } from "../../lib/utils";

const toneStyles = {
  default: {
    container: "bg-white border-[#e5e5ea]",
    value: "text-[#1d1d1f]",
  },
  warning: {
    container: "bg-[#fff7ed] border-[#fed7aa]",
    value: "text-[#c2410c]",
  },
  success: {
    container: "bg-[#ecfdf3] border-[#bbf7d0]",
    value: "text-[#166534]",
  },
};

export default function QuickStats({ items }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const tone = toneStyles[item.tone ?? "default"];
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
              tone.container,
            )}
          >
            <div>
              <p className={cn("text-xl font-bold", tone.value)}>
                {item.value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">
                {item.label}
              </p>
            </div>
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6e6e73] shadow-sm">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
