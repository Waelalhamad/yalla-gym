/** Circular progress ring; value is 0..1. */
export function Ring({ value, label, size = 64, stroke = 7 }: { value: number; label: string; size?: number; stroke?: number }) {
  const r = 32 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="#5DB1A1" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(0.23,1,0.32,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums" style={{ fontSize: size / 4.5 }}>{label}</span>
    </div>
  );
}
