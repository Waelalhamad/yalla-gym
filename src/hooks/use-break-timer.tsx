import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, PersonStanding, X } from "lucide-react";
import { todayISO, useStore } from "@/lib/storage";
import { deskRoutine, library } from "@/lib/library";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Button } from "@/components/ui";

interface TimerState { intervalMin: number; nextAt: number | null }
interface BreakTimer {
  intervalMin: number;
  running: boolean;
  remainingMs: number;
  start: (min?: number) => void;
  stop: () => void;
  setIntervalMin: (m: number) => void;
}

const Ctx = createContext<BreakTimer | null>(null);
const KEY = "yg.breakTimer";

function load(): TimerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { intervalMin: 40, nextAt: null };
}

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* audio not available */ }
}

export function BreakTimerProvider({ children }: { children: ReactNode }) {
  const { updateDay } = useStore();
  const [state, setState] = useState<TimerState>(load);
  const [now, setNow] = useState(Date.now());
  const [alertOpen, setAlertOpen] = useState(false);
  const [stretchIdx, setStretchIdx] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (state.nextAt && now >= state.nextAt && !fired.current) {
      fired.current = true;
      setStretchIdx(Math.floor(Math.random() * deskRoutine.length));
      setAlertOpen(true);
      beep();
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("يلا قوم! وقت الحركة", { body: "3 دقائق مشي أو تمطيط، ثم ارجع للكود." });
      }
    }
  }, [now, state.nextAt]);

  const schedule = (min: number) => {
    fired.current = false;
    setState((s) => ({ ...s, nextAt: Date.now() + min * 60000 }));
  };

  const start = (min = state.intervalMin) => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    setState((s) => ({ ...s, intervalMin: min }));
    schedule(min);
  };

  const stop = () => {
    fired.current = false;
    setState((s) => ({ ...s, nextAt: null }));
    setAlertOpen(false);
  };

  const done = () => {
    updateDay(todayISO(), (d) => ({ ...d, breaks: d.breaks + 1 }));
    setAlertOpen(false);
    schedule(state.intervalMin);
  };

  const snooze = () => {
    setAlertOpen(false);
    schedule(5);
  };

  const stretch = library[deskRoutine[stretchIdx]];
  const remainingMs = state.nextAt ? Math.max(0, state.nextAt - now) : 0;

  return (
    <Ctx.Provider
      value={{
        intervalMin: state.intervalMin,
        running: !!state.nextAt,
        remainingMs,
        start,
        stop,
        setIntervalMin: (m) => setState((s) => ({ ...s, intervalMin: m })),
      }}
    >
      {children}
      <AnimatePresence>
        {alertOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-6 w-full max-w-md relative"
              role="dialog" aria-modal="true" aria-label="وقت الحركة"
            >
              <button onClick={snooze} aria-label="إغلاق" className="absolute top-4 end-4 p-2 rounded-xl text-muted-foreground hover:bg-secondary">
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 text-primary mb-2">
                <PersonStanding size={22} />
                <span className="font-bold text-sm">وقت الحركة</span>
              </div>
              <h2 className="text-2xl font-black mb-1">يلا قوم 3 دقائق</h2>
              <p className="text-muted-foreground text-sm mb-4">امشِ في البيت أو المكتب، اشرب ماء، وجرّب هذا التمطيط:</p>
              <ExerciseMedia info={stretch} className="aspect-[4/3] rounded-2xl" />
              <p className="font-bold mt-3">{stretch.ar}</p>
              <p className="text-sm text-muted-foreground mt-1">{stretch.steps.join(" ")}</p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <Button onClick={done}><Check size={16} /> تحركت</Button>
                <Button variant="ghost" onClick={snooze}><Clock size={16} /> بعد 5 دقائق</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useBreakTimer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBreakTimer must be used inside BreakTimerProvider");
  return ctx;
}

export const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
