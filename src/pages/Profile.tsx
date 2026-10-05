import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, HeartPulse, Save, Share } from "lucide-react";
import { useStore } from "@/lib/storage";
import {
  activityLabel, bmi, bmiCategory, currentPhase, num, targets, type Activity, type Profile,
} from "@/lib/fitness";
import { phases } from "@/lib/program";
import { Button, Card, Field, Section, haptic } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { canInstall, isStandalone, promptInstall, onInstallAvailable } from "@/lib/pwa";

const schema = z.object({
  name: z.string().min(1, "اكتب اسمك"),
  age: z.coerce.number().int().min(14, "14 سنة أو أكثر").max(90),
  sex: z.enum(["male", "female"]),
  heightCm: z.coerce.number().min(120, "تحقق من الطول").max(230, "تحقق من الطول"),
  weightKg: z.coerce.number().min(30, "تحقق من الوزن").max(300, "تحقق من الوزن"),
  goalWeightKg: z.coerce.number().min(30, "تحقق من الوزن").max(300),
  daysPerWeek: z.coerce.number().pipe(z.union([z.literal(3), z.literal(4)])),
  activity: z.enum(["sedentary", "light", "moderate"]),
  startDate: z.string().min(1, "اختر التاريخ"),
  phaseOverride: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])),
  machinesOnly: z.boolean(),
}).refine((v) => v.goalWeightKg <= v.weightKg, { message: "الهدف يجب أن يكون أقل من وزنك الحالي أو مساوياً له", path: ["goalWeightKg"] });

type ChoiceField = "sex" | "daysPerWeek" | "activity" | "phaseOverride" | "machinesOnly";

export default function ProfilePage() {
  const { profile, setProfile, logWeight } = useStore();
  const toast = useToast();
  const [attempted, setAttempted] = useState(false);
  const [installable, setInstallable] = useState(canInstall());
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Profile>({
    resolver: zodResolver(schema),
    defaultValues: profile,
  });

  useEffect(() => onInstallAvailable(() => setInstallable(true)), []);

  const live = watch();
  const parsed = schema.safeParse(live);
  const preview = parsed.success ? (parsed.data as Profile) : profile;
  const t = targets(preview);

  const onSubmit = (v: Profile) => {
    // logWeight also writes the profile, so it must run before setProfile(v).
    if (v.weightKg !== profile.weightKg) logWeight(v.weightKg);
    setProfile(v);
    haptic(30);
    toast("تم الحفظ", "تم تحديث أهدافك وخطتك.");
    setAttempted(false);
  };

  const err = (k: keyof Profile) => (attempted ? errors[k]?.message : undefined);

  const choice = <K extends ChoiceField>(field: K, options: { value: Profile[K]; label: string }[], cols = 2) => (
    <div className={cn("grid gap-2", cols === 1 ? "grid-cols-1" : "grid-cols-2")}>
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => { haptic(); setValue(field, o.value as never, { shouldDirty: true }); }}
          className={cn(
            "min-h-12 px-4 rounded-2xl text-sm font-bold border text-start transition-colors",
            String(live[field]) === String(o.value) ? "bg-primary/15 border-primary text-primary" : "border-white/[0.06] bg-input text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const label = (s: string) => <span className="text-xs font-bold text-muted-foreground mb-2 block px-1">{s}</span>;

  return (
    <div>
      {/* Live summary */}
      <Card className="bg-gradient-to-br from-primary/15 to-card">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-xl font-black tabular-nums">{num(t.calories)}</p><p className="text-[11px] text-muted-foreground">سعرة/يوم</p></div>
          <div><p className="text-xl font-black tabular-nums">{t.protein}غ</p><p className="text-[11px] text-muted-foreground">بروتين</p></div>
          <div><p className="text-xl font-black tabular-nums">~{t.weeksToGoal}</p><p className="text-[11px] text-muted-foreground">أسبوع للهدف</p></div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          مؤشر الكتلة {num(bmi(preview), 1)} ({bmiCategory(bmi(preview))}) · مرحلة {phases[currentPhase(preview)].name}
        </p>
      </Card>

      {!isStandalone() && (
        <Card i={1} className="mt-3 flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Download size={22} /></span>
          <div className="flex-1">
            <p className="font-bold text-sm">ثبّت التطبيق على هاتفك</p>
            {installable ? (
              <p className="text-xs text-muted-foreground">يعمل بدون إنترنت في الجيم.</p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                آيفون: اضغط <Share size={12} /> مشاركة ثم "إضافة إلى الشاشة الرئيسية"
              </p>
            )}
          </div>
          {installable && <Button className="px-4 min-h-10" onClick={async () => setInstallable(!(await promptInstall()))}>تثبيت</Button>}
        </Card>
      )}

      <form onSubmit={(e) => { setAttempted(true); handleSubmit(onSubmit)(e); }} noValidate>
        <Section title="معلوماتك">
          <Card className="space-y-4">
            <Field label="الاسم" error={err("name")} {...register("name")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="العمر" type="number" inputMode="numeric" suffix="سنة" error={err("age")} {...register("age")} />
              <Field label="الطول" type="number" inputMode="numeric" suffix="سم" error={err("heightCm")} {...register("heightCm")} />
              <Field label="الوزن الحالي" type="number" inputMode="decimal" step="0.1" suffix="كغ" error={err("weightKg")} {...register("weightKg")} />
              <Field label="الوزن الهدف" type="number" inputMode="decimal" step="0.1" suffix="كغ" error={err("goalWeightKg")} {...register("goalWeightKg")} />
            </div>
            <div>
              {label("الجنس")}
              {choice("sex", [{ value: "male", label: "ذكر" }, { value: "female", label: "أنثى" }])}
            </div>
          </Card>
        </Section>

        <Section title="الخطة">
          <Card className="space-y-5">
            <Field label="تاريخ بداية الخطة" type="date" error={err("startDate")} {...register("startDate")} />
            <div>
              {label("المرحلة")}
              {choice("phaseOverride", [
                { value: 0, label: "تلقائي" },
                { value: 1, label: `1 · ${phases[1].name}` },
                { value: 2, label: `2 · ${phases[2].name}` },
                { value: 3, label: `3 · ${phases[3].name}` },
              ])}
            </div>
            <div>
              {label("نوع الأدوات")}
              {choice("machinesOnly", [{ value: true, label: "أجهزة فقط (أسهل)" }, { value: false, label: "أوزان حرة + أجهزة" }])}
            </div>
            <div>
              {label("أيام الجيم من المرحلة 2")}
              {choice("daysPerWeek", [{ value: 4, label: "4 أيام: علوي / سفلي" }, { value: 3, label: "3 أيام: كامل الجسم" }])}
            </div>
            <div>
              {label("مستوى النشاط")}
              {choice("activity", (Object.keys(activityLabel) as Activity[]).map((a) => ({ value: a, label: activityLabel[a] })), 1)}
            </div>
          </Card>
        </Section>

        <Button type="submit" className="w-full h-14 mt-6 text-base"><Save size={18} /> حفظ</Button>
      </form>

      <div className="flex items-start gap-3 mt-8 bg-primary/5 border border-primary/15 rounded-3xl p-4">
        <HeartPulse size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          هذا دليل عام وليس استشارة طبية. راجع طبيباً قبل البدء، وأوقف أي تمرين يسبب ألماً حاداً. بياناتك محفوظة على هاتفك فقط.
          صور التمارين من free-exercise-db (ملكية عامة).
        </p>
      </div>
    </div>
  );
}
