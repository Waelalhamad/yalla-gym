import { useState } from "react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Check, Flame, Footprints, Minus, Pause, PersonStanding, Play, Plus } from "lucide-react";
import { emptyDay, todayISO, useStore, type DayHabits } from "@/lib/storage";
import { num, targets } from "@/lib/fitness";
import { dailyRoutine } from "@/lib/program";
import { deskRoutine, library } from "@/lib/library";
import { BREAK_GOAL, checkItems, dayScore } from "@/lib/habits";
import { mmss, useBreakTimer } from "@/hooks/use-break-timer";
import { ExerciseMedia, HowTo } from "@/components/ExerciseMedia";
import { Button, Card, Section, Segmented, Sheet, haptic } from "@/components/ui";
import { Ring } from "@/components/Ring";
import { cn, fmtDate } from "@/lib/utils";

const tooltipStyle = { background: "hsl(224 18% 9%)", border: "1px solid hsl(224 16% 18%)", borderRadius: 12, fontSize: 12, direction: "rtl" as const };

export default function Day() {
  const { profile, habits, updateDay } = useStore();
  const timer = useBreakTimer();
  const t = targets(profile);
  const today = todayISO();
  const d = habits[today] ?? emptyDay();
  const score = dayScore(d, t.steps);
  const [stepsInput, setStepsInput] = useState("");
  const [chart, setChart] = useState<"score" | "steps">("score");
  const [stretchId, setStretchId] = useState<string | null>(null);

  const set = (fn: (x: DayHabits) => DayHabits) => { haptic(); updateDay(today, fn); };

  const history = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const iso = todayISO(date);
    const h = habits[iso];
    return { label: fmtDate(iso), score: Math.round((dayScore(h, t.steps) / 7) * 100), steps: h?.steps ?? 0 };
  });

  // Streak of days at 70%+; today doesn't break it while it's still in progress.
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].score >= 70) streak++;
    else if (i !== history.length - 1) break;
  }

  return (
    <div>
      {/* Score */}
      <Card className="flex items-center gap-5">
        <Ring value={score / 7} label={`${score}/7`} size={96} stroke={8} />
        <div>
          <p className="text-xs font-bold text-muted-foreground">نتيجة اليوم</p>
          <p className="text-2xl font-black mt-1">{score >= 5 ? "يوم ممتاز!" : score >= 3 ? "استمر، أنت قريب" : "يلا نبدأ"}</p>
          <p className="text-sm mt-1 flex items-center gap-1.5">
            <Flame size={16} className="text-orange-400" />
            سلسلة: <span className="font-black">{streak}</span> يوم
          </p>
        </div>
      </Card>

      {/* Move timer */}
      <Card i={1} className={cn("mt-3", timer.running && "border-primary/40 glow-primary")}>
        <div className="flex items-center justify-between">
          <p className="font-bold">مؤقت الحركة</p>
          <span className={cn("text-[11px] font-bold px-2 h-6 rounded-full flex items-center", timer.running ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
            {timer.running ? "يعمل" : "متوقف"}
          </span>
        </div>
        <p className="text-5xl font-black tabular-nums text-center my-4" dir="ltr">
          {timer.running ? mmss(timer.remainingMs) : `${timer.intervalMin}:00`}
        </p>
        <Segmented
          value={timer.intervalMin}
          onChange={(m) => (timer.running ? timer.start(m) : timer.setIntervalMin(m))}
          options={[{ value: 30, label: "30 د" }, { value: 40, label: "40 د" }, { value: 60, label: "60 د" }]}
        />
        {timer.running ? (
          <Button variant="ghost" className="w-full mt-3" onClick={timer.stop}><Pause size={16} /> إيقاف</Button>
        ) : (
          <Button className="w-full mt-3" onClick={() => timer.start()}><Play size={16} fill="currentColor" /> شغّل أثناء الشغل</Button>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          بضع دقائق مشي خفيف كل 20-30 دقيقة جلوس تخفض سكر الدم بشكل واضح. اترك التطبيق مفتوحاً وسيصلك تنبيه.
        </p>
      </Card>

      {/* Steps + breaks */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Card i={2}>
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Footprints size={14} className="text-primary" />الخطوات</p>
          <p className="text-2xl font-black mt-2 tabular-nums">{num(d.steps)}</p>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-2">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (d.steps / t.steps) * 100)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">الهدف {num(t.steps)}</p>
        </Card>
        <Card i={3}>
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><PersonStanding size={14} className="text-primary" />استراحات</p>
          <p className="text-2xl font-black mt-2 tabular-nums">{d.breaks}<span className="text-sm text-muted-foreground"> / {BREAK_GOAL}</span></p>
          <div className="flex gap-2 mt-2">
            <button aria-label="إنقاص" onClick={() => set((x) => ({ ...x, breaks: Math.max(0, x.breaks - 1) }))} className="flex-1 h-10 rounded-xl bg-secondary active:bg-muted flex items-center justify-center"><Minus size={16} /></button>
            <button aria-label="زيادة" onClick={() => set((x) => ({ ...x, breaks: x.breaks + 1 }))} className="flex-1 h-10 rounded-xl bg-primary/15 text-primary active:bg-primary/25 flex items-center justify-center"><Plus size={16} /></button>
          </div>
        </Card>
      </div>

      <Card i={4} className="mt-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(stepsInput);
            if (stepsInput && v >= 0) set((x) => ({ ...x, steps: Math.round(v) }));
            setStepsInput("");
          }}
        >
          <input
            type="number" inputMode="numeric" min={0} value={stepsInput} onChange={(e) => setStepsInput(e.target.value)}
            placeholder="خطواتك من الهاتف"
            className="flex-1 min-w-0 h-12 bg-input border border-white/[0.06] rounded-2xl px-4 text-base outline-none focus:border-primary"
          />
          <Button type="submit" className="px-5">حفظ</Button>
        </form>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[500, 1000, 2000].map((n) => (
            <button key={n} onClick={() => set((x) => ({ ...x, steps: x.steps + n }))}
              className="btn-press h-10 text-sm font-bold bg-secondary active:bg-muted rounded-xl tabular-nums">+{num(n)}</button>
          ))}
        </div>
      </Card>

      {/* Habits checklist */}
      <Section title="عادات اليوم">
        <div className="bg-card border border-white/[0.06] rounded-3xl divide-y divide-white/[0.06] overflow-hidden">
          {checkItems.map((c) => {
            const on = !!d.checks[c.key];
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => set((x) => ({ ...x, checks: { ...x.checks, [c.key]: !on } }))}
                className="w-full flex items-center gap-3 px-4 min-h-16 text-start active:bg-secondary/60 transition-colors"
              >
                <span className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", on ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                  <Icon size={18} />
                </span>
                <span className="flex-1 py-2">
                  <span className={cn("block font-bold text-sm", on && "text-primary")}>{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.hint}</span>
                </span>
                <span className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all", on ? "bg-primary border-primary text-primary-foreground scale-110" : "border-white/15")}>
                  {on && <Check size={16} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Chart */}
      <Section title="آخر 14 يوماً">
        <Card>
          <Segmented value={chart} onChange={setChart} options={[{ value: "score", label: "الالتزام" }, { value: "steps", label: "الخطوات" }]} />
          <div className="h-48 mt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" stroke="hsl(220 10% 50%)" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <Tooltip cursor={{ fill: "hsl(224 16% 13% / 0.6)" }} contentStyle={tooltipStyle}
                  formatter={(v: number) => (chart === "score" ? [`${v}%`, "النتيجة"] : [num(v), "خطوة"])} />
                <ReferenceLine y={chart === "score" ? 70 : t.steps} stroke={chart === "score" ? "#5DB1A1" : "#f59e0b"} strokeDasharray="4 4" />
                <Bar dataKey={chart} radius={[6, 6, 0, 0]}>
                  {history.map((h, i) => (
                    <Cell key={i} fill={chart === "score" ? (h.score >= 70 ? "#5DB1A1" : "hsl(224 14% 22%)") : h.steps >= t.steps ? "#a8e6dd" : "hsl(171 20% 35%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      {/* Desk routine */}
      <Section title="روتين المكتب · 5 دقائق">
        <p className="text-sm text-muted-foreground -mt-1 mb-3 px-1">ضد أضرار الجلوس. مرتين يومياً: قبل الظهر وبعد العصر.</p>
        <div className="swipe-row">
          {deskRoutine.map((id) => {
            const info = library[id];
            return (
              <button key={id} onClick={() => setStretchId(id)} className="w-40 text-start bg-card border border-white/[0.06] rounded-3xl overflow-hidden active:scale-[0.98] transition-transform">
                <ExerciseMedia info={info} still className="aspect-square" />
                <p className="font-bold text-sm p-3">{info.ar}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Daily timeline */}
      <Section title="يوم المبرمج النشيط">
        <ol className="relative border-s-2 border-primary/25 ms-3 space-y-4">
          {dailyRoutine.map((r) => (
            <li key={r.time} className="ps-5 relative">
              <span className="absolute -start-[7px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
              <p className="text-xs font-black text-primary tabular-nums">{r.time}</p>
              <p className="font-bold text-sm mt-0.5">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Sheet open={!!stretchId} onClose={() => setStretchId(null)} title={stretchId ? library[stretchId].ar : ""}>
        {stretchId && (
          <>
            <ExerciseMedia info={library[stretchId]} className="aspect-[4/3] rounded-3xl" />
            <div className="mt-4"><HowTo info={library[stretchId]} /></div>
          </>
        )}
      </Sheet>
    </div>
  );
}
