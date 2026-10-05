import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, ChartLine, Dumbbell, House, Timer, UserRound, UtensilsCrossed } from "lucide-react";
import { mmss, useBreakTimer } from "@/hooks/use-break-timer";
import { useStore } from "@/lib/storage";
import { haptic } from "@/components/ui";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/day": "يومي",
  "/workout": "تمرين اليوم",
  "/library": "مكتبة التمارين",
  "/nutrition": "التغذية",
  "/progress": "التقدّم",
  "/profile": "الملف الشخصي",
};

const tabs = [
  { href: "/", label: "الرئيسية", icon: House },
  { href: "/day", label: "يومي", icon: CalendarCheck },
  { href: "/workout", label: "تمرين", icon: Dumbbell, center: true },
  { href: "/nutrition", label: "الأكل", icon: UtensilsCrossed },
  { href: "/progress", label: "التقدّم", icon: ChartLine },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "صباح الخير" : h < 18 ? "مساء الخير" : "مساء النور";
}

function TopBar() {
  const [location] = useLocation();
  const { profile } = useStore();
  const timer = useBreakTimer();
  const isHome = location === "/";

  return (
    <header className="sticky top-0 z-50 glass border-x-0 border-t-0 pt-safe">
      <div className="h-14 px-4 flex items-center justify-between gap-2">
        {isHome ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Dumbbell size={18} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-xs text-muted-foreground">{greeting()}</p>
              <p className="font-bold truncate">{profile.name}</p>
            </div>
          </div>
        ) : (
          <h1 className="text-lg font-bold truncate">{titles[location] ?? "يلا جيم"}</h1>
        )}

        <div className="flex items-center gap-1">
          {timer.running && (
            <Link
              href="/day"
              className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 border border-primary/25 text-primary px-3 h-9 rounded-full tabular-nums"
              aria-label="الوقت المتبقي حتى استراحة الحركة"
            >
              <Timer size={14} />
              <span dir="ltr">{mmss(timer.remainingMs)}</span>
            </Link>
          )}
          <IconLink href="/library" label="مكتبة التمارين" active={location === "/library"}><BookOpen size={20} /></IconLink>
          <IconLink href="/profile" label="الملف الشخصي" active={location === "/profile"}><UserRound size={20} /></IconLink>
        </div>
      </div>
    </header>
  );
}

function IconLink({ href, label, active, children }: { href: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
        active ? "text-primary bg-primary/10" : "text-muted-foreground active:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}

function TabBar() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 mx-auto max-w-md glass border-x-0 border-b-0 rounded-t-3xl pb-safe" aria-label="التنقل الرئيسي">
      <div className="grid grid-cols-5 h-16 px-2">
        {tabs.map((t) => {
          const active = location === t.href;
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link key={t.href} href={t.href} onClick={() => haptic()} aria-label={t.label} className="flex items-start justify-center">
                <span
                  className={cn(
                    "-mt-6 w-16 h-16 rounded-full flex items-center justify-center border-4 border-background transition-all",
                    "bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(171_36%_52%/0.45)]",
                    active && "scale-105",
                  )}
                >
                  <Icon size={26} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => haptic()}
              className={cn("relative flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors", active ? "text-primary" : "text-muted-foreground")}
            >
              {active && <motion.span layoutId="tab-dot" className="absolute top-1.5 w-1 h-1 rounded-full bg-primary" />}
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-dvh bg-[hsl(224_22%_4%)]">
      <div className="relative mx-auto max-w-md min-h-dvh bg-background md:border-x md:border-white/[0.06] overflow-x-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[360px] rounded-full bg-primary/12 blur-[100px]" />
        <TopBar />
        {/* Keyed so each page re-runs a CSS enter animation; no exit phase that could leave a page hidden. */}
        <main key={location} className="page-in relative px-4 pt-4 pb-32">
          {children}
        </main>
        <TabBar />
      </div>
    </div>
  );
}
