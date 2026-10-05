import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, ChevronDown, Clock, Cog, Flame, HelpCircle, Info, Lightbulb, Moon, PartyPopper, TrendingUp, Trophy } from "lucide-react";
import { type SetLog, todayISO, useStore } from "@/lib/storage";
import { currentPhase, num } from "@/lib/fitness";
import {
  dayNames, phases, prescriptionsFor, shortTitle, todayDow, walkDay, warmup, weekOrder, weekSchedule, workouts, type Prescription,
} from "@/lib/program";
import { library } from "@/lib/library";
import { ExerciseMedia, HowTo } from "@/components/ExerciseMedia";
import { Button, Card, Segmented, Sheet, haptic } from "@/components/ui";
import { cn } from "@/lib/utils";

type Draft = Record<string, SetLog[]>;

const LOWER = new Set(["squat", "goblet", "legpress", "hacksquat", "rdl", "rdl_db", "trapbar"]);

function suggestion(x: Prescription, last?: SetLog[]) {
  if (!last?.length) return null;
  const hitTop = last.length >= x.sets && last.every((s) => s.reps >= x.repMax);
  if (!hitTop) return null;
  if (x.unit === "s") return `+5 ثوانٍ اليوم`;
  const add = LOWER.has(x.ex) ? 5 : 2.5;
  return `زِد إلى ${last[0].weight + add} كغ`;
}

const reps = (x: Prescription) => `${x.repMin === x.repMax ? x.repMin : `${x.repMin}-${x.repMax}`}${x.unit === "s" ? " ث" : ""}`;

export default function Workout() {
  const { profile, setProfile, lastSetsFor, saveSession } = useStore();
  const machines = profile.machinesOnly;
  const phase = currentPhase(profile);
  const schedule = weekSchedule(phase, profile.daysPerWeek);
  const [dow, setDow] = useState(todayDow());
  const [howId, setHowId] = useState<string | null>(null);
  const [warmOpen, setWarmOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<{ sets: number; volume: number; title: string } | null>(null);
  const plan = schedule[dow];
  // On walk/rest days the user can still pick a workout (e.g. already at the gym).
  const [pick, setPick] = useState<string | null>(null);
  const workout = plan.kind === "workout" ? workouts[plan.workoutId] : pick ? workouts[pick] : null;
  const phaseWorkouts = [...new Set(schedule.flatMap((d) => (d.kind === "workout" ? [d.workoutId] : [])))];
  const items = workout ? prescriptionsFor(workout, phase, machines) : [];
  const todayChip = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    todayChip.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  // One draft per workout and equipment mode, so the two never overwrite each other.
  const draftKey = workout ? `yg.draft.${workout.id}.${machines ? "m" : "f"}` : "";

  const freshDraft = useMemo<Draft>(() => {
    const d: Draft = {};
    for (const x of items) {
      const last = lastSetsFor(x.ex);
      d[x.ex] = Array.from({ length: x.sets }, (_, i) => ({
        weight: last?.[i]?.weight ?? last?.[0]?.weight ?? 0,
        reps: 0,
        done: false,
      }));
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.id, phase, machines]);

  // `owner` records which workout the draft belongs to, so switching days never
  // saves one workout's sets under another workout's key.
  const [{ owner, sets: draft }, setState] = useState<{ owner: string; sets: Draft }>({ owner: "", sets: {} });

  // Restore an unfinished workout (e.g. after the phone locks at the gym).
  useEffect(() => {
    if (!workout) return;
    let sets = freshDraft;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Draft;
        if (items.every((x) => parsed[x.ex]?.length === x.sets)) sets = parsed;
      }
    } catch { /* ignore */ }
    setState({ owner: draftKey, sets });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, draftKey, freshDraft]);

  useEffect(() => {
    if (!workout || owner !== draftKey) return;
    try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft, owner, draftKey, workout]);

  const updateSet = (exId: string, idx: number, patch: Partial<SetLog>) =>
    setState((st) => ({
      ...st,
      sets: { ...st.sets, [exId]: st.sets[exId].map((s, i) => (i === idx ? { ...s, ...patch } : s)) },
    }));

  const allSets = Object.values(draft).flat();
  const doneCount = allSets.filter((s) => s.done).length;
  const progress = allSets.length ? doneCount / allSets.length : 0;

  const finish = () => {
    if (!workout) return;
    const done = allSets.filter((s) => s.done);
    saveSession({ date: todayISO(), workoutId: workout.id, sets: draft });
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setState({
      owner: draftKey,
      sets: Object.fromEntries(
        Object.entries(draft).map(([id, sets]) => [id, sets.map((s) => ({ weight: s.weight, reps: 0, done: false }))]),
      ),
    });
    haptic(60);
    setCelebrate({ sets: done.length, volume: done.reduce((v, s) => v + s.weight * s.reps, 0), title: workout.title });
  };

  return (
    <div>
      {/* Day chips */}
      <div className="swipe-row pb-1">
        {weekOrder.map((i) => (
          <button
            key={i}
            ref={i === todayDow() ? todayChip : undefined}
            onClick={() => { haptic(); setDow(i); setPick(null); }}
            className={cn(
              "w-[74px] h-16 rounded-2xl text-center border transition-colors",
              i === dow ? "border-primary bg-primary/15 text-primary" : "border-white/[0.06] bg-card",
            )}
          >
            <p className="text-xs font-bold">{dayNames[i]}</p>
            <p className="text-[11px] font-bold mt-1 text-muted-foreground truncate px-1">{shortTitle(schedule[i])}</p>
          </button>
        ))}
      </div>

      {workout ? (
        <>
          <Card className="mt-3">
            <p className="text-xs font-bold text-primary">مرحلة {phases[phase].name}</p>
            <div className="flex items-end justify-between gap-3 mt-1">
              <div>
                <h2 className="text-2xl font-black">{workout.title}</h2>
                <p className="text-sm text-muted-foreground">{workout.focus}</p>
              </div>
              <p className="text-2xl font-black tabular-nums">{doneCount}<span className="text-sm text-muted-foreground">/{allSets.length}</span></p>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden mt-3">
              <motion.div animate={{ width: `${progress * 100}%` }} className="h-full bg-primary rounded-full" />
            </div>
          </Card>

          {/* Equipment mode: machines are easier to learn and safer alone */}
          <div className="mt-3 flex items-center gap-3 bg-card border border-white/[0.06] rounded-3xl p-2 ps-4">
            <Cog size={18} className="text-primary shrink-0" />
            <p className="flex-1 text-sm font-bold">{machines ? "أجهزة فقط" : "أوزان حرة + أجهزة"}</p>
            <Segmented
              className="w-44"
              value={machines ? "m" : "f"}
              onChange={(v) => setProfile({ ...profile, machinesOnly: v === "m" })}
              options={[{ value: "m", label: "أجهزة" }, { value: "f", label: "حرة" }]}
            />
          </div>

          {machines && (
            <div className="mt-3 bg-primary/5 border border-primary/20 rounded-3xl p-4">
              <p className="font-bold text-sm flex items-center gap-2"><Lightbulb size={16} className="text-primary" />قبل أي جهاز</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• اضبط المقعد أولاً: المقابض بمستوى الصدر أو الكتف، والمفصل بمحاذاة محور الجهاز.</li>
                <li>• ضع الدبوس على أخف وزن، وجرّب جولة إحماء، ثم زِد خطوة خطوة.</li>
                <li>• الحركة بطيئة ومتحكم بها: ثانية للدفع وثانيتان للرجوع، ولا تترك الأوزان تخبط.</li>
                <li>• سجّل رقم الدبوس أو الوزن المكتوب على الجهاز في خانة الوزن.</li>
              </ul>
            </div>
          )}

          <button onClick={() => setWarmOpen((o) => !o)} className="w-full mt-3 bg-orange-500/[0.07] border border-orange-500/20 rounded-3xl px-4 min-h-14 text-start">
            <span className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2"><Flame size={18} className="text-orange-400" />الإحماء أولاً (5 دقائق)</span>
              <ChevronDown size={18} className={cn("text-muted-foreground transition-transform", warmOpen && "rotate-180")} />
            </span>
            <AnimatePresence initial={false}>
              {warmOpen && (
                <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden text-sm text-muted-foreground">
                  {warmup.map((w) => <li key={w} className="pt-1.5 last:pb-3">• {w}</li>)}
                </motion.ul>
              )}
            </AnimatePresence>
          </button>

          <div className="space-y-3 mt-3">
            {items.map((x, i) => {
              const info = library[x.ex];
              const last = lastSetsFor(x.ex);
              const tip = suggestion(x, last);
              const sets = draft[x.ex] ?? [];
              const exDone = sets.length > 0 && sets.every((s) => s.done);
              return (
                <Card key={x.ex} i={i} className={cn("p-0", exDone && "border-primary/40")}>
                  <button onClick={() => setHowId(x.ex)} className="relative block w-full text-start" aria-label={`شرح ${info.ar}`}>
                    <ExerciseMedia info={info} className="aspect-[16/10]" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          {x.main && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-md">تمرين أساسي</span>}
                          <h3 className="font-black text-lg text-white mt-1">{info.ar}</h3>
                          <p className="text-xs text-white/70">{info.muscles}</p>
                        </div>
                        <span className="shrink-0 flex items-center gap-1 text-xs font-bold bg-white/15 backdrop-blur text-white px-3 h-9 rounded-full">
                          <HelpCircle size={14} /> كيف؟
                        </span>
                      </div>
                    </div>
                    {exDone && (
                      <span className="absolute top-3 end-3 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <Check size={18} strokeWidth={3} />
                      </span>
                    )}
                  </button>

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="bg-secondary px-3 h-8 rounded-full flex items-center tabular-nums">{x.sets} جولات × {reps(x)}</span>
                      <span className="bg-secondary px-3 h-8 rounded-full flex items-center gap-1"><Clock size={12} />راحة {x.rest}</span>
                      {tip && <span className="text-primary bg-primary/10 border border-primary/25 px-3 h-8 rounded-full flex items-center gap-1"><TrendingUp size={12} />{tip}</span>}
                    </div>
                    {(x.note || last) && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                        <Info size={13} className="shrink-0 mt-0.5" />
                        <span>
                          {x.note}
                          {x.note && last && " · "}
                          {last && <>المرة السابقة: <span dir="ltr" className="tabular-nums">{last.map((s) => `${s.weight}×${s.reps}`).join("  ")}</span></>}
                        </span>
                      </p>
                    )}

                    <div className="mt-3 space-y-2">
                      {sets.map((s, idx) => (
                        <div key={idx} className={cn("flex items-center gap-2 rounded-2xl p-1 transition-colors", s.done && "bg-primary/10")}>
                          <span className="w-7 text-center text-sm font-black text-muted-foreground">{idx + 1}</span>
                          <label className="relative flex-1">
                            <span className="sr-only">الوزن</span>
                            <input
                              type="number" inputMode="decimal" min={0} step={0.5}
                              value={s.weight || ""} placeholder="0"
                              onChange={(ev) => updateSet(x.ex, idx, { weight: Number(ev.target.value) })}
                              className="w-full h-12 bg-input border border-white/[0.06] rounded-xl ps-3 pe-9 text-base font-bold tabular-nums outline-none focus:border-primary"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">كغ</span>
                          </label>
                          <label className="relative flex-1">
                            <span className="sr-only">{x.unit === "s" ? "الثواني" : "العدّات"}</span>
                            <input
                              type="number" inputMode="numeric" min={0}
                              value={s.reps || ""} placeholder={`${x.repMax}`}
                              onChange={(ev) => updateSet(x.ex, idx, { reps: Number(ev.target.value) })}
                              className="w-full h-12 bg-input border border-white/[0.06] rounded-xl ps-3 pe-11 text-base font-bold tabular-nums outline-none focus:border-primary placeholder:text-muted-foreground/50"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{x.unit === "s" ? "ث" : "عدّة"}</span>
                          </label>
                          <button
                            aria-label={`إنهاء الجولة ${idx + 1}`}
                            onClick={() => { haptic(s.done ? 10 : 25); updateSet(x.ex, idx, { done: !s.done, reps: s.reps || x.repMax }); }}
                            className={cn(
                              "btn-press w-12 h-12 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all",
                              s.done ? "bg-primary border-primary text-primary-foreground shadow-[0_0_16px_hsl(171_36%_52%/0.4)]" : "border-white/15 text-muted-foreground",
                            )}
                          >
                            <Check size={20} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-4 text-sm">
              <span className="font-bold text-primary">الختام: </span>{workout.finisher}
            </div>
          </div>

          {/* Finish bar, sits above the tab bar in the thumb zone */}
          <div className="fixed inset-x-0 mx-auto max-w-md px-4 z-40" style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}>
            <Button onClick={finish} disabled={doneCount === 0} className="w-full h-14 text-base">
              <Trophy size={18} /> إنهاء التمرين ({doneCount}/{allSets.length})
            </Button>
          </div>
          <div className="h-20" />
        </>
      ) : plan.kind === "walk" ? (
        <>

          <div className="mt-3 bg-card border border-primary/25 rounded-3xl p-4">
            <p className="font-bold">في الجيم الآن؟</p>
            <p className="text-xs text-muted-foreground mt-1">اختر تمريناً وابدأ. التمرين الإضافي ممتاز، لكن لا تتمرن نفس العضلات يومين متتاليين.</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {phaseWorkouts.map((id) => (
                <Button key={id} variant="soft" onClick={() => { haptic(); setPick(id); }}>{workouts[id].title}</Button>
              ))}
            </div>
          </div>
        <Card className="mt-3 p-0">
          <ExerciseMedia info={library.treadmill} className="aspect-[16/10]" />
          <div className="p-4">
            <h2 className="text-2xl font-black flex items-center gap-2"><Activity className="text-primary" />{walkDay.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{walkDay.focus}</p>
            <ul className="mt-4 space-y-3">
              {walkDay.items.map((w) => <li key={w} className="flex gap-3 text-sm"><Check size={18} className="text-primary shrink-0 mt-0.5" />{w}</li>)}
            </ul>
          </div>
        </Card>
        </>
      ) : (
        <>

          <div className="mt-3 bg-card border border-primary/25 rounded-3xl p-4">
            <p className="font-bold">في الجيم الآن؟</p>
            <p className="text-xs text-muted-foreground mt-1">اختر تمريناً وابدأ. التمرين الإضافي ممتاز، لكن لا تتمرن نفس العضلات يومين متتاليين.</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {phaseWorkouts.map((id) => (
                <Button key={id} variant="soft" onClick={() => { haptic(); setPick(id); }}>{workouts[id].title}</Button>
              ))}
            </div>
          </div>
        <Card className="mt-3 text-center py-10">
          <Moon className="text-primary mx-auto mb-3" size={36} />
          <h2 className="text-2xl font-black">يوم راحة</h2>
          <p className="text-sm text-muted-foreground mt-2">امشِ قليلاً، تمطّط 10 دقائق، كُل بروتينك ونَم باكراً.</p>
        </Card>
        </>
      )}

      <Sheet open={!!howId} onClose={() => setHowId(null)} title={howId ? library[howId].ar : ""}>
        {howId && (
          <>
            <ExerciseMedia info={library[howId]} className="aspect-[4/3] rounded-3xl" />
            <p className="text-sm text-muted-foreground mt-3">{library[howId].muscles}</p>
            <div className="mt-4"><HowTo info={library[howId]} /></div>
          </>
        )}
      </Sheet>

      {/* Peak moment: celebrate the finished workout */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setCelebrate(null)}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="w-full max-w-sm text-center bg-card border border-primary/30 rounded-[2rem] p-6 glow-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="w-20 h-20 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center"
              >
                <PartyPopper size={40} />
              </motion.div>
              <h2 className="text-2xl font-black mt-4">عاش يا بطل!</h2>
              <p className="text-sm text-muted-foreground mt-1">أنهيت {celebrate.title}. كل تمرين يقرّبك من هدفك.</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-secondary rounded-2xl p-3">
                  <p className="text-2xl font-black tabular-nums">{celebrate.sets}</p>
                  <p className="text-xs text-muted-foreground">جولة</p>
                </div>
                <div className="bg-secondary rounded-2xl p-3">
                  <p className="text-2xl font-black tabular-nums">{num(celebrate.volume)}</p>
                  <p className="text-xs text-muted-foreground">كغ مرفوعة</p>
                </div>
              </div>
              <Button className="w-full mt-5" onClick={() => setCelebrate(null)}>تم</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
