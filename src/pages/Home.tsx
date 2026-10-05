import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Activity, BookOpen, ChevronLeft, Clock, Footprints, Moon, PersonStanding, Play, Scale, Sparkles, Timer, UtensilsCrossed,
} from "lucide-react";
import { todayISO, useStore } from "@/lib/storage";
import { currentPhase, num, targets, weeksSinceStart } from "@/lib/fitness";
import {
  dayNames, phases, prescriptionsFor, rules, shortTitle, todayDow, walkDay, weekOrder, weekSchedule, workouts, type Phase,
} from "@/lib/program";
import { library } from "@/lib/library";
import { dayScore, BREAK_GOAL } from "@/lib/habits";
import { Button, Card, Section } from "@/components/ui";
import { Ring } from "@/components/Ring";
import { cn } from "@/lib/utils";

export default function Home() {
  const { profile, weights, habits } = useStore();
  const t = targets(profile);
  const phase = currentPhase(profile);
  const week = weeksSinceStart(profile) + 1;
  const schedule = weekSchedule(phase, profile.daysPerWeek);
  const today = schedule[todayDow()];
  const todayWorkout = today.kind === "workout" ? workouts[today.workoutId] : null;
  const items = todayWorkout ? prescriptionsFor(todayWorkout, phase, profile.machinesOnly) : [];
  const day = habits[todayISO()];
  const score = dayScore(day, t.steps);

  const start = weights[0]?.kg ?? profile.weightKg;
  const lost = Math.max(0, start - profile.weightKg);
  const pct = Math.min(100, (lost / Math.max(0.1, start - profile.goalWeightKg)) * 100);
  // Rough session length: sets × (work + rest) + warm-up and finisher
  const minutes = Math.round(items.reduce((s, x) => s + x.sets * 2.2, 0) + 15);

  return (
    <div>
      <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 h-8 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-primary text-xs font-bold">الأسبوع {week} · مرحلة {phases[phase].name}</span>
      </div>

      {/* Today hero card */}
      <div
        className="card-in relative mt-4 rounded-[2rem] overflow-hidden border border-primary/25 bg-gradient-to-br from-[hsl(171_36%_20%)] via-[hsl(190_30%_12%)] to-[hsl(224_20%_9%)] p-5"
      >
        <div className="absolute -top-16 -end-16 w-48 h-48 rounded-full bg-primary/25 blur-3xl" />
        <p className="relative text-xs font-bold text-primary">اليوم · {dayNames[todayDow()]}</p>
        {todayWorkout ? (
          <div className="relative">
            <h2 className="text-3xl font-black mt-1">{todayWorkout.title}</h2>
            <p className="text-sm text-white/70 mt-1">{todayWorkout.focus}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-white/70 font-bold">
              <span className="flex items-center gap-1"><Activity size={14} />{items.length} تمارين</span>
              <span className="flex items-center gap-1"><Clock size={14} />~{minutes} دقيقة</span>
            </div>
            <div className="flex mt-4">
              {items.slice(0, 6).map((x, i) => (
                <img
                  key={x.ex} src={`/ex/${library[x.ex].img}/0.jpg`} alt={library[x.ex].ar}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[hsl(190_30%_12%)]"
                  style={{ marginInlineStart: i ? -10 : 0 }}
                />
              ))}
            </div>
            <Link href="/workout">
              <Button className="w-full mt-5 h-14 text-base"><Play size={18} fill="currentColor" /> ابدأ التمرين</Button>
            </Link>
          </div>
        ) : today.kind === "walk" ? (
          <div className="relative">
            <h2 className="text-3xl font-black mt-1">{walkDay.title}</h2>
            <p className="text-sm text-white/70 mt-1">30-45 دقيقة مشي سريع أو سير مائل</p>
            <Link href="/workout">
              <Button className="w-full mt-5 h-14 text-base"><Footprints size={18} /> تفاصيل يوم المشي</Button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            <h2 className="text-3xl font-black mt-1 flex items-center gap-2"><Moon size={26} /> يوم راحة</h2>
            <p className="text-sm text-white/70 mt-2">ارتح، لكن حافظ على الخطوات والبروتين والنوم.</p>
          </div>
        )}
      </div>

      {/* Today's habits summary */}
      <Link href="/day" className="block">
        <Card i={1} className="mt-3 flex items-center gap-4 active:scale-[0.99] transition-transform">
          <Ring value={score / 7} label={`${score}/7`} />
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Footprints size={12} />الخطوات</p>
              <p className="font-black tabular-nums">{num(day?.steps ?? 0)}<span className="text-xs text-muted-foreground font-bold"> / {num(t.steps)}</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><PersonStanding size={12} />استراحات</p>
              <p className="font-black tabular-nums">{day?.breaks ?? 0}<span className="text-xs text-muted-foreground font-bold"> / {BREAK_GOAL}</span></p>
            </div>
          </div>
          <ChevronLeft size={20} className="text-muted-foreground" />
        </Card>
      </Link>

      {/* Weight journey */}
      <Link href="/progress" className="block">
        <Card i={2} className="mt-3 active:scale-[0.99] transition-transform">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Scale size={14} className="text-primary" />رحلة الوزن</p>
            <p className="text-xs font-bold text-primary">خسرت {num(lost, 1)} كغ</p>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black tabular-nums">{profile.weightKg}<span className="text-sm text-muted-foreground"> كغ</span></p>
            <p className="text-sm text-muted-foreground tabular-nums">الهدف {profile.goalWeightKg}</p>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden mt-3">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 3)}%` }} transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full bg-gradient-to-l from-primary to-[#a8e6dd]"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{num(t.calories)} سعرة · {t.protein} غ بروتين يومياً · ~{t.weeksToGoal} أسبوعاً للهدف</p>
        </Card>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {[
          { href: "/library", label: "التمارين", icon: BookOpen },
          { href: "/day", label: "المؤقت", icon: Timer },
          { href: "/nutrition", label: "الأكل", icon: UtensilsCrossed },
          { href: "/progress", label: "الوزن", icon: Scale },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 py-3 rounded-3xl bg-card border border-white/[0.06] active:bg-secondary">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><a.icon size={20} /></span>
            <span className="text-xs font-bold">{a.label}</span>
          </Link>
        ))}
      </div>

      <Section title="هذا الأسبوع" href="/workout" action="التمرين">
        <div className="swipe-row">
          {weekOrder.map((dow) => {
            const d = schedule[dow];
            const isToday = dow === todayDow();
            return (
              <div key={dow} className={cn("w-[76px] rounded-2xl py-3 text-center border", isToday ? "border-primary bg-primary/15" : "border-white/[0.06] bg-card")}>
                <p className={cn("text-xs font-bold", isToday ? "text-primary" : "text-muted-foreground")}>{dayNames[dow]}</p>
                <p className={cn("text-xs font-bold mt-1", d.kind === "rest" && "text-muted-foreground")}>{shortTitle(d)}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="خارطة الطريق">
        <div className="swipe-row">
          {([1, 2, 3] as Phase[]).map((ph) => {
            const info = phases[ph];
            const active = ph === phase;
            return (
              <div key={ph} className={cn("w-[80%] rounded-3xl p-4 border bg-card", active ? "border-primary/50 glow-primary" : "border-white/[0.06]")}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{info.weeks}</span>
                  {active && <span className="flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-2 h-6 rounded-full"><Sparkles size={12} />أنت هنا</span>}
                </div>
                <p className="text-lg font-black mt-2">{ph}. {info.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{info.goal}</p>
                <ul className="mt-3 space-y-1">
                  {info.points.map((pt) => <li key={pt} className="text-xs flex gap-2"><span className="text-primary">•</span>{pt}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="القواعد الذهبية">
        <div className="swipe-row">
          {rules.map((r, i) => (
            <div key={r.title} className="w-[72%] rounded-3xl p-4 bg-card border border-white/[0.06]">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-black flex items-center justify-center">{i + 1}</span>
              <p className="font-bold mt-3">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
