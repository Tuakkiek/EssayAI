export default function GreetingSection({ greeting, name, subtitle }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#6e6e73]">
        <span className="h-2 w-2 rounded-full bg-[#58cc02]" />
        <span>{greeting}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-4xl">
          Xin chào, {name}
        </h1>
        <span className="rounded-full border border-[#e5e5ea] bg-white px-3 py-1 text-xs font-semibold text-[#2f7d1a] shadow-sm">
          Chế độ học sinh
        </span>
      </div>
      <p className="max-w-2xl text-sm text-[#6e6e73]">{subtitle}</p>
    </section>
  );
}
