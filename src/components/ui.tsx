import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Light haptic tick on phones that support it. */
export const haptic = (ms = 10) => {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
};

export function Card({ className, children, i = 0 }: { className?: string; children: ReactNode; i?: number }) {
  return (
    <div
      style={{ animationDelay: `${i * 50}ms` }}
      className={cn("card-in relative bg-card border border-white/[0.06] rounded-3xl p-4 overflow-hidden", className)}
    >
      {children}
    </div>
  );
}

/** Section title row, optionally with a "see all" link on the end side. */
export function Section({ title, href, action, children, className }: {
  title: string; href?: string; action?: string; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("mt-8", className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-bold text-primary flex items-center gap-0.5 min-h-11 px-1">
            {action ?? "عرض الكل"} <ChevronLeft size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Compact metric tile: the value is the hero, the label stays quiet. */
export function StatTile({ icon, label, value, unit, className }: {
  icon: ReactNode; label: string; value: ReactNode; unit?: string; className?: string;
}) {
  return (
    <div className={cn("bg-card border border-white/[0.06] rounded-3xl p-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="text-2xl font-black mt-2 tabular-nums">
        {value}
        {unit && <span className="text-sm font-bold text-muted-foreground ms-1">{unit}</span>}
      </p>
    </div>
  );
}

export function Button({
  className, variant = "primary", ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" }) {
  return (
    <button
      className={cn(
        "btn-press inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:pointer-events-none select-none",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.25),0_8px_24px_hsl(171_36%_52%/0.3)] active:bg-primary/90",
        variant === "ghost" && "bg-secondary text-secondary-foreground border border-white/[0.06] active:bg-muted",
        variant === "soft" && "bg-primary/10 text-primary border border-primary/20 active:bg-primary/20",
        className,
      )}
      {...props}
    />
  );
}

/** iOS-style segmented control */
export function Segmented<T extends string | number>({ value, onChange, options, className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string;
}) {
  const group = options.map((x) => x.value).join("-");
  return (
    <div className={cn("flex p-1 rounded-2xl bg-secondary border border-white/[0.06]", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => { haptic(); onChange(o.value); }}
          className={cn(
            "relative flex-1 min-h-10 rounded-xl text-sm font-bold transition-colors",
            value === o.value ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${group}`} className="absolute inset-0 rounded-xl bg-primary" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet; drag down or tap outside to close. */
export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end justify-center"
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label={title}
            className="w-full max-w-md bg-card border-t border-white/[0.08] rounded-t-[2rem] max-h-[92dvh] overflow-y-auto overscroll-contain pb-safe"
          >
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur pt-3 pb-2 px-4 flex items-center justify-between">
              <span className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1.5 rounded-full bg-white/15" />
              <p className="font-bold pt-2">{title}</p>
              <button onClick={onClose} aria-label="إغلاق" className="w-10 h-10 mt-1 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; suffix?: string };

export const Field = forwardRef<HTMLInputElement, FieldProps>(({ label, error, suffix, className, ...props }, ref) => (
  <label className="block">
    {label && <span className="text-xs font-bold text-muted-foreground mb-2 block px-1">{label}</span>}
    <span className="relative block">
      <input
        ref={ref}
        className={cn(
          "w-full min-h-12 bg-input border border-white/[0.06] rounded-2xl px-4 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-destructive",
          suffix && "pe-12",
          className,
        )}
        {...props}
      />
      {suffix && (
        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
      )}
    </span>
    {error && <span className="text-destructive text-xs mt-1.5 block px-1">{error}</span>}
  </label>
));
Field.displayName = "Field";
