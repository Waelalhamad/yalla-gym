import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bar, BarChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Dumbbell, Plus, Scale, Target, Trash2, TrendingDown } from "lucide-react";
import { todayISO, useStore } from "@/lib/storage";
import { e1rm, num, targets } from "@/lib/fitness";
import { workouts } from "@/lib/program";
import { library } from "@/lib/library";
import { Button, Card, Section, Segmented, StatTile, haptic } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { cn, fmtDate } from "@/lib/utils";

const schema = z.object({
  kg: z.coerce.number({ invalid_type_error: "اكتب رقماً" }).min(30, "رقم صغير جداً").max(300, "رقم كبير جداً"),
});
type FormValues = z.infer<typeof schema>;

const tooltipStyle = { background: "hsl(224 18% 9%)", border: "1px solid hsl(224 16% 18%)", borderRadius: 12, fontSize: 12, direction: "rtl" as const };
const axis = { stroke: "hsl(220 10% 50%)", fontSize: 10, tickLine: false, axisLine: false };
const DAY = 24 * 3600 * 1000;

export default function Progress() {
  const { profile, weights, logWeight, removeWeight, sessions, removeSession } = useStore();
  const toast = useToast();
  const [attempted, setAttempted] = useState(false);
  const [chart, setChart] = useState<"weight" | "strength" | "volume">("weight");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (v: FormValues) => {
    logWeight(v.kg);
    haptic(30);
    toast("تم تسجيل الوزن", `${v.kg} كغ · اليوم`);
    reset();
    setAttempted(false);
  };

  const t = targets(profile);
  const start = weights[0]?.kg ?? profile.weightKg;
  const startDate = weights[0]?.date ?? todayISO();
  const current = weights[weights.length - 1]?.kg ?? profile.weightKg;
  const lost = start - current;

  const weightData = useMemo(() => {
    const t0 = new Date(startDate + "T00:00").getTime();
    const expected = (iso: string) =>
      Math.max(profile.goalWeightKg, start - (t.weeklyLossKg * (new Date(iso + "T00:00").getTime() - t0)) / (7 * DAY));
    const rows: { label: string; kg?: number; expected: number }[] =
      weights.map((w) => ({ label: fmtDate(w.date), kg: w.kg, expected: +expected(w.date).toFixed(1) }));
    // Extend the expected line 8 weeks ahead so there's a target to chase.
    const last = weights[weights.length - 1]?.date ?? startDate;
    for (let k = 1; k <= 8; k++) {
      const iso = todayISO(new Date(new Date(last + "T00:00").getTime() + k * 7 * DAY));
      rows.push({ label: fmtDate(iso), expected: +expected(iso).toFixed(1) });
    }
    return rows;
  }, [weights, startDate, start, t.weeklyLossKg, profile.goalWeightKg]);

  const loggedExercises = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((s) => Object.entries(s.sets).forEach(([id, sets]) => sets.some((x) => x.done && x.weight > 0) && ids.add(id)));
    return [...ids].filter((id) => library[id]?.category === "gym" && id !== "plank");
  }, [sessions]);
  const [exId, setExId] = useState<string | null>(null);
  const selected = exId && loggedExercises.includes(exId) ? exId : loggedExercises[0];
  const strengthData = useMemo(
    () => sessions.flatMap((s) => {
      const sets = (s.sets[selected ?? ""] ?? []).filter((x) => x.done && x.weight > 0);
      return sets.length ? [{ label: fmtDate(s.date), e1rm: +Math.max(...sets.map((x) => e1rm(x.weight, x.reps))).toFixed(1) }] : [];
    }),
    [sessions, selected],
  );

  const volumeData = useMemo(() => {
    const byWeek = new Map<string, number>();
    sessions.forEach((s) => {
      const d = new Date(s.date + "T00:00");
      d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // weeks start Saturday
      const key = todayISO(d);
      const vol = Object.values(s.sets).flat().filter((x) => x.done).reduce((sum, x) => sum + x.weight * x.reps, 0);
      byWeek.set(key, (byWeek.get(key) ?? 0) + vol);
    });
    return [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([k, v]) => ({ label: fmtDate(k), volume: Math.round(v) }));
  }, [sessions]);

  const kgs = weights.map((w) => w.kg);
  const minY = Math.floor(Math.min(profile.goalWeightKg, ...kgs) - 2);
  const maxY = Math.ceil(Math.max(...kgs, start) + 2);

  return (
    <div>
      {/* Quick weigh-in: the most frequent action, first on screen */}
      <Card>
        <p className="font-bold mb-3">وزن اليوم</p>
        <form onSubmit={(e) => { setAttempted(true); handleSubmit(onSubmit)(e); }} className="flex gap-2" noValidate>
          <div className="relative flex-1">
            <input
              type="number" step="0.1" inputMode="decimal" placeholder={`${current}`} {...register("kg")}
              className={cn("w-full h-14 bg-input border border-white/[0.06] rounded-2xl ps-4 pe-12 text-xl font-black tabular-nums outline-none focus:border-primary", attempted && errors.kg && "border-destructive")}
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">كغ</span>
          </div>
          <Button type="submit" className="h-14 px-5"><Plus size={18} /> سجّل</Button>
        </form>
        {attempted && errors.kg && <p className="text-destructive text-xs mt-1.5">{errors.kg.message}</p>}
        <p className="text-xs text-muted-foreground mt-2">كل صباح بعد الحمام وقبل الأكل. انظر لاتجاه الأسبوع، لا ليوم واحد.</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <StatTile icon={<Scale size={14} />} label="الحالي" value={current} unit="كغ" />
        <StatTile icon={<TrendingDown size={14} />} label="خسرت" value={lost > 0 ? num(lost, 1) : "0"} unit="كغ" />
        <StatTile icon={<Target size={14} />} label="المتبقي" value={num(Math.max(0, current - profile.goalWeightKg), 1)} unit="كغ" />
        <StatTile icon={<Dumbbell size={14} />} label="التمارين" value={sessions.length} />
      </div>

      <Section title="الرسوم البيانية">
        <Segmented value={chart} onChange={setChart} options={[{ value: "weight", label: "الوزن" }, { value: "strength", label: "القوة" }, { value: "volume", label: "الحجم" }]} />
        <Card className="mt-3">
          {chart === "weight" && (
            <>
              <div className="flex gap-4 text-xs font-bold mb-2">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-primary" />الفعلي</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-amber-500" />المتوقع</span>
              </div>
              <div className="h-56" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
                    <YAxis domain={[minY, maxY]} {...axis} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v} كغ`, n === "kg" ? "الفعلي" : "المتوقع"]} />
                    <ReferenceLine y={profile.goalWeightKg} stroke="hsl(171 36% 52%)" strokeDasharray="6 6" />
                    <Line type="monotone" dataKey="expected" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="kg" stroke="#5DB1A1" strokeWidth={3} dot={{ r: 4, fill: "#5DB1A1" }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {chart === "strength" && (loggedExercises.length === 0 ? (
            <Empty text="سجّل أول تمرين لترى قوتك تزيد هنا." />
          ) : (
            <>
              <div className="swipe-row pb-2">
                {loggedExercises.map((id) => (
                  <button key={id} onClick={() => setExId(id)}
                    className={cn("h-9 px-3 rounded-full text-xs font-bold border whitespace-nowrap",
                      selected === id ? "bg-primary text-primary-foreground border-primary" : "border-white/[0.06] bg-secondary text-muted-foreground")}>
                    {library[id].ar}
                  </button>
                ))}
              </div>
              <div className="h-52" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={strengthData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <XAxis dataKey="label" {...axis} />
                    <YAxis {...axis} domain={["dataMin - 5", "dataMax + 5"]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} كغ`, "أقصى رفعة تقديرية"]} />
                    <Line type="monotone" dataKey="e1rm" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: "#a78bfa" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">تقدير لأقصى وزن ترفعه مرة واحدة، محسوب من جولاتك. لا تجرّبه فعلياً كمبتدئ.</p>
            </>
          ))}

          {chart === "volume" && (volumeData.length === 0 ? (
            <Empty text="سيظهر هنا مجموع ما رفعته كل أسبوع." />
          ) : (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
                  <XAxis dataKey="label" {...axis} />
                  <YAxis {...axis} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                  <Tooltip cursor={{ fill: "hsl(224 16% 13% / 0.6)" }} contentStyle={tooltipStyle} formatter={(v: number) => [`${num(v)} كغ`, "الحجم الأسبوعي"]} />
                  <Bar dataKey="volume" fill="#5DB1A1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="سجل الوزن">
        <div className="bg-card border border-white/[0.06] rounded-3xl divide-y divide-white/[0.06] max-h-72 overflow-y-auto">
          {[...weights].reverse().map((w, i, arr) => {
            const prev = arr[i + 1];
            const diff = prev ? w.kg - prev.kg : 0;
            return (
              <div key={w.date} className="flex items-center justify-between px-4 min-h-14">
                <span className="text-sm text-muted-foreground">{fmtDate(w.date)}</span>
                <span className="flex items-center gap-3">
                  {prev && diff !== 0 && (
                    <span className={cn("text-xs font-bold tabular-nums", diff < 0 ? "text-primary" : "text-orange-400")} dir="ltr">
                      {diff > 0 ? "+" : ""}{num(diff, 1)}
                    </span>
                  )}
                  <span className="font-black tabular-nums">{w.kg} كغ</span>
                  {weights.length > 1 && (
                    <button aria-label="حذف" onClick={() => removeWeight(w.date)} className="w-10 h-10 -me-2 rounded-full flex items-center justify-center text-muted-foreground active:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="سجل التمارين">
        {sessions.length === 0 ? (
          <Empty text="لا يوجد تمارين بعد. أنهِ أول تمرين من زر التمرين في الأسفل." />
        ) : (
          <div className="bg-card border border-white/[0.06] rounded-3xl divide-y divide-white/[0.06]">
            {[...sessions].reverse().slice(0, 20).map((s) => {
              const done = Object.values(s.sets).flat().filter((x) => x.done);
              const volume = done.reduce((sum, x) => sum + x.weight * x.reps, 0);
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 min-h-16">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Dumbbell size={18} /></span>
                  <div className="flex-1 py-2">
                    <p className="font-bold text-sm">{workouts[s.workoutId]?.title ?? s.workoutId}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(s.date)} · {done.length} جولة · {num(volume)} كغ</p>
                  </div>
                  <button aria-label="حذف التمرين" onClick={() => removeSession(s.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground active:text-destructive">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="h-44 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
      {text}
    </div>
  );
}
