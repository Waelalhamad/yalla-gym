import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultProfile, type Profile } from "./fitness";

export interface WeightEntry { date: string; kg: number }
export interface SetLog { weight: number; reps: number; done: boolean }
export interface Session {
  id: string;
  date: string;
  workoutId: string;
  sets: Record<string, SetLog[]>;
}

export const habitKeys = ["workout", "protein", "water", "sleep", "noSugar"] as const;
export type HabitKey = (typeof habitKeys)[number];
export interface DayHabits {
  steps: number;
  breaks: number;
  checks: Partial<Record<HabitKey, boolean>>;
}

function usePersisted<T>(key: string, initial: T, migrate: (v: T) => T = (v) => v) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? migrate(JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue] as const;
}

/** Local date (not UTC) so late-night entries land on the right day. */
export const todayISO = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export const emptyDay = (): DayHabits => ({ steps: 0, breaks: 0, checks: {} });

interface Store {
  profile: Profile;
  setProfile: (p: Profile) => void;
  weights: WeightEntry[];
  logWeight: (kg: number, date?: string) => void;
  removeWeight: (date: string) => void;
  sessions: Session[];
  saveSession: (s: Omit<Session, "id">) => void;
  removeSession: (id: string) => void;
  lastSetsFor: (exerciseId: string) => SetLog[] | undefined;
  habits: Record<string, DayHabits>;
  updateDay: (date: string, fn: (d: DayHabits) => DayHabits) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Merge with defaults so older saved profiles pick up new fields.
  const [profile, setProfile] = usePersisted<Profile>("yg.profile", defaultProfile, (v) => {
    const merged = { ...defaultProfile, ...v };
    if (!["sedentary", "light", "moderate"].includes(merged.activity)) merged.activity = "sedentary";
    return merged;
  });
  const [weights, setWeights] = usePersisted<WeightEntry[]>("yg.weights", [
    { date: todayISO(), kg: defaultProfile.weightKg },
  ]);
  const [sessions, setSessions] = usePersisted<Session[]>("yg.sessions", []);
  const [habits, setHabits] = usePersisted<Record<string, DayHabits>>("yg.habits", {});

  const logWeight = (kg: number, date = todayISO()) => {
    const next = [...weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
    setWeights(next);
    // Keep the profile in sync with the most recent weigh-in so targets update.
    setProfile({ ...profile, weightKg: next[next.length - 1].kg });
  };

  const removeWeight = (date: string) => setWeights(weights.filter((w) => w.date !== date));

  const updateDay = (date: string, fn: (d: DayHabits) => DayHabits) =>
    setHabits((h) => ({ ...h, [date]: fn(h[date] ?? emptyDay()) }));

  const saveSession = (s: Omit<Session, "id">) => {
    setSessions([...sessions, { ...s, id: `${Date.now()}` }]);
    updateDay(s.date, (d) => ({ ...d, checks: { ...d.checks, workout: true } }));
  };

  const removeSession = (id: string) => setSessions(sessions.filter((s) => s.id !== id));

  const lastSetsFor = (exerciseId: string) => {
    for (let i = sessions.length - 1; i >= 0; i--) {
      const sets = sessions[i].sets[exerciseId]?.filter((s) => s.done);
      if (sets?.length) return sets;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        profile, setProfile, weights, logWeight, removeWeight,
        sessions, saveSession, removeSession, lastSetsFor, habits, updateDay,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
