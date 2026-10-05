import { Beef, CupSoda, Droplets, Dumbbell, Moon, type LucideIcon } from "lucide-react";
import type { DayHabits, HabitKey } from "./storage";

export const BREAK_GOAL = 6;

export const checkItems: { key: HabitKey; label: string; hint: string; icon: LucideIcon }[] = [
  { key: "workout", label: "تمرين أو مشي اليوم", hint: "حسب جدول اليوم", icon: Dumbbell },
  { key: "protein", label: "وصلت لهدف البروتين", hint: "بروتين في كل وجبة", icon: Beef },
  { key: "water", label: "شربت الماء الكافي", hint: "قنينة على المكتب دائماً", icon: Droplets },
  { key: "sleep", label: "نمت 7 ساعات أو أكثر", hint: "عن الليلة الماضية", icon: Moon },
  { key: "noSugar", label: "بدون مشروبات سكرية", hint: "لا غازيات ولا عصائر", icon: CupSoda },
];

/** 7 points a day: 5 checks + steps goal + break goal */
export function dayScore(d: DayHabits | undefined, stepGoal: number) {
  if (!d) return 0;
  const checks = checkItems.filter((c) => d.checks[c.key]).length;
  return checks + (d.steps >= stepGoal ? 1 : 0) + (d.breaks >= BREAK_GOAL ? 1 : 0);
}
