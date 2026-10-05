import type { Phase } from "./program";

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate";

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  daysPerWeek: 3 | 4;
  activity: Activity;
  /** ISO date the plan started; drives the phase and the step target. */
  startDate: string;
  /** 0 = automatic (by weeks since start) */
  phaseOverride: 0 | Phase;
  /** Prefer machines over free weights (easier and safer to learn). */
  machinesOnly: boolean;
}

export const defaultProfile: Profile = {
  name: "وائل",
  age: 19,
  sex: "male",
  heightCm: 170,
  weightKg: 114,
  goalWeightKg: 85,
  daysPerWeek: 4,
  activity: "sedentary",
  startDate: new Date().toISOString().slice(0, 10),
  phaseOverride: 0,
  machinesOnly: true,
};

const activityFactor: Record<Activity, number> = {
  sedentary: 1.35,
  light: 1.5,
  moderate: 1.65,
};

export const activityLabel: Record<Activity, string> = {
  sedentary: "مكتبي: جلوس معظم اليوم + الجيم",
  light: "خفيف: جيم + 7-8 آلاف خطوة",
  moderate: "نشيط: جيم + 10 آلاف خطوة أو أكثر",
};

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function bmi(p: Profile) {
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}

export function bmiCategory(v: number) {
  if (v < 18.5) return "نقص وزن";
  if (v < 25) return "وزن طبيعي";
  if (v < 30) return "وزن زائد";
  if (v < 35) return "سمنة درجة 1";
  if (v < 40) return "سمنة درجة 2";
  return "سمنة درجة 3";
}

/** Mifflin–St Jeor resting metabolic rate */
export function bmr(p: Profile) {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

export function tdee(p: Profile) {
  return bmr(p) * activityFactor[p.activity];
}

export function weeksSinceStart(p: Profile) {
  const ms = Date.now() - new Date(p.startDate + "T00:00").getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 3600 * 1000)));
}

export function currentPhase(p: Profile): Phase {
  if (p.phaseOverride) return p.phaseOverride;
  const w = weeksSinceStart(p);
  return w < 4 ? 1 : w < 12 ? 2 : 3;
}

/** Start from where a desk worker is (~5k) and add 1,000 steps a week, up to 10k. */
export function stepTarget(p: Profile) {
  return Math.min(10000, 5000 + 1000 * weeksSinceStart(p));
}

/**
 * Fat-loss targets that still allow strength gains:
 * ~20% deficit (capped at 700 kcal); protein 2 g per kg of *goal* weight
 * (with obesity, actual body weight overestimates needs); fat ~0.9 g/kg goal;
 * carbs fill the rest to fuel training.
 */
export function targets(p: Profile) {
  const maintenance = tdee(p);
  const deficit = Math.min(700, maintenance * 0.2);
  const calories = round(Math.max(maintenance - deficit, bmr(p)), 50);
  const protein = round(2 * p.goalWeightKg, 5);
  const fat = round(0.9 * p.goalWeightKg, 5);
  const carbs = round(Math.max(0, (calories - protein * 4 - fat * 9) / 4), 5);
  const weeklyLossKg = ((maintenance - calories) * 7) / 7700;
  const toLose = Math.max(0, p.weightKg - p.goalWeightKg);
  return {
    maintenance: round(maintenance, 50),
    calories,
    protein,
    fat,
    carbs,
    waterL: round(p.weightKg * 0.035, 0.5),
    steps: stepTarget(p),
    weeklyLossKg,
    weeksToGoal: weeklyLossKg > 0 ? Math.ceil(toLose / weeklyLossKg) : 0,
  };
}

/** Epley estimated one-rep max */
export const e1rm = (weight: number, reps: number) => (reps <= 0 ? 0 : weight * (1 + reps / 30));

export const num = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
