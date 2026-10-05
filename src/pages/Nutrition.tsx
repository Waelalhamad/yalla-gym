import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ArrowLeft, Beef, CircleCheck, CircleX, Droplets, Egg, Flame, Wheat } from "lucide-react";
import { useStore } from "@/lib/storage";
import { num, targets } from "@/lib/fitness";
import { Card, Section, Segmented, StatTile } from "@/components/ui";
import { cn } from "@/lib/utils";

const meals = [
  { name: "الفطور", time: "07:30", share: 0.25, ideas: ["3 بيضات + بياض بيضتين + رغيف أسمر صغير + خيار وبندورة", "زبادي يوناني 250 غ + 40 غ شوفان + فاكهة"] },
  { name: "الغداء", time: "13:30", share: 0.35, ideas: ["200 غ صدر دجاج مشوي + كوب رز + صحن سلطة كبير", "كفتة لحم قليل الدهن 180 غ + برغل + فتوش بقليل من الزيت"] },
  { name: "قبل أو بعد الجيم", time: "17:30", share: 0.15, ideas: ["سكوب بروتين + موزة", "علبة تونة بالماء + 2 خبز رز"] },
  { name: "العشاء", time: "20:00", share: 0.25, ideas: ["كوب فول مدمس + بيضتان مسلوقتان + خضار", "سمك مشوي 200 غ + بطاطا مسلوقة 200 غ + خضار"] },
];

const swaps = [
  ["سندويشة شاورما بالثوم والبطاطا", "صحن شاورما دجاج بدون مايونيز + سلطة"],
  ["عصير أو مشروب غازي", "ماء، مياه غازية، أو شاي بدون سكر"],
  ["صحن رز كبير", "نصف الكمية + سلطة + بروتين"],
  ["فلافل مقلية", "فول أو حمص بزيت قليل"],
  ["كنافة أو بقلاوة", "قطعة صغيرة مرة بالأسبوع"],
  ["شيبس أثناء الكود", "خيار، جزر، فشار بدون زبدة"],
];

const doThis = [
  "بروتين في كل وجبة: كف ونصف من اللحم أو البيض أو الزبادي",
  "نصف الصحن خضار",
  "كوب ماء قبل كل وجبة",
  "حضّر غداء الشغل من الليلة السابقة",
];

const avoid = [
  "المشروبات السكرية والعصائر",
  "المقالي والسناكات المقلية",
  "الأكل أمام الشاشة بدون انتباه",
  "تخطّي الوجبات ثم الأكل بشراهة",
];

const COLORS = ["#5DB1A1", "#f59e0b", "#a78bfa"];

export default function Nutrition() {
  const { profile } = useStore();
  const t = targets(profile);
  const [meal, setMeal] = useState(0);
  const [tab, setTab] = useState<"do" | "avoid">("do");
  const macro = [
    { name: "بروتين", g: t.protein, kcal: t.protein * 4 },
    { name: "كربوهيدرات", g: t.carbs, kcal: t.carbs * 4 },
    { name: "دهون", g: t.fat, kcal: t.fat * 9 },
  ];
  const total = macro.reduce((s, m) => s + m.kcal, 0);
  const m = meals[meal];

  return (
    <div>
      {/* Calories hero */}
      <Card className="flex items-center gap-4">
        <div className="w-32 h-32 relative shrink-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={macro} dataKey="kcal" innerRadius={44} outerRadius={62} paddingAngle={4} stroke="none" startAngle={90} endAngle={-270}>
                {macro.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black tabular-nums">{num(t.calories)}</span>
            <span className="text-[11px] text-muted-foreground">سعرة/يوم</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {macro.map((x, i) => (
            <li key={x.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />{x.name}</span>
              <span className="font-black tabular-nums">{x.g} غ <span className="text-xs text-muted-foreground font-bold">{Math.round((x.kcal / total) * 100)}%</span></span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <StatTile icon={<Flame size={14} />} label="أقل من الثبات" value={num(t.maintenance - t.calories)} unit="سعرة" />
        <StatTile icon={<Droplets size={14} />} label="الماء" value={t.waterL} unit="لتر" />
      </div>

      {/* Plate method */}
      <Section title="طريقة الصحن (بدون حساب)">
        <Card className="flex items-center gap-4">
          <svg viewBox="0 0 200 200" className="w-32 h-32 shrink-0" role="img" aria-label="صحن: نصف خضار، ربع بروتين، ربع نشويات">
            <circle cx="100" cy="100" r="96" fill="hsl(224 16% 13%)" />
            <path d="M100 100 L100 12 A88 88 0 0 1 100 188 Z" fill="#22c55e" opacity="0.85" />
            <path d="M100 100 L100 188 A88 88 0 0 1 12 100 Z" fill="#5DB1A1" />
            <path d="M100 100 L12 100 A88 88 0 0 1 100 12 Z" fill="#f59e0b" opacity="0.9" />
            <text x="146" y="106" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Tajawal">½</text>
            <text x="62" y="150" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Tajawal">¼</text>
            <text x="62" y="64" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Tajawal">¼</text>
          </svg>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" /><b>½ خضار</b></li>
            <li className="flex items-center gap-2"><Beef size={14} className="text-primary shrink-0" /><b>¼ بروتين</b><span className="text-muted-foreground text-xs">دجاج، سمك، بيض</span></li>
            <li className="flex items-center gap-2"><Wheat size={14} className="text-amber-400 shrink-0" /><b>¼ نشويات</b><span className="text-muted-foreground text-xs">رز، برغل، خبز</span></li>
          </ul>
        </Card>
      </Section>

      {/* Meals: one meal at a time, picked with chips */}
      <Section title="وجباتك اليوم">
        <div className="swipe-row">
          {meals.map((x, i) => (
            <button key={x.name} onClick={() => setMeal(i)}
              className={cn("h-10 px-4 rounded-full text-sm font-bold border whitespace-nowrap", meal === i ? "bg-primary text-primary-foreground border-primary" : "bg-card border-white/[0.06] text-muted-foreground")}>
              {x.name}
            </button>
          ))}
        </div>
        <Card className="mt-3" key={meal}>
          <div className="flex items-baseline justify-between">
            <p className="font-bold">{m.name} <span className="text-xs text-muted-foreground font-bold tabular-nums">· {m.time}</span></p>
            <p className="text-sm tabular-nums"><b>{num(Math.round((t.calories * m.share) / 10) * 10)}</b> <span className="text-muted-foreground">سعرة</span></p>
          </div>
          <div className="flex gap-2 mt-3 text-xs font-bold">
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 h-8 rounded-full"><Beef size={12} />{Math.round(t.protein * m.share)} غ بروتين</span>
            <span className="flex items-center gap-1 bg-amber-400/10 text-amber-400 px-3 h-8 rounded-full"><Wheat size={12} />{Math.round(t.carbs * m.share)} غ</span>
            <span className="flex items-center gap-1 bg-violet-400/10 text-violet-400 px-3 h-8 rounded-full"><Egg size={12} />{Math.round(t.fat * m.share)} غ</span>
          </div>
          <ul className="space-y-2 mt-3">
            {m.ideas.map((idea, k) => (
              <li key={idea} className="text-sm flex gap-3 bg-secondary/60 rounded-2xl p-3">
                <span className="text-xs font-black text-primary mt-0.5">{k === 0 ? "أ" : "ب"}</span>{idea}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="بدائل ذكية">
        <div className="bg-card border border-white/[0.06] rounded-3xl divide-y divide-white/[0.06]">
          {swaps.map(([from, to]) => (
            <div key={from} className="p-4">
              <p className="text-xs text-muted-foreground line-through decoration-destructive/60">{from}</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-1.5"><ArrowLeft size={14} className="text-primary shrink-0" />{to}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="القواعد">
        <Segmented value={tab} onChange={setTab} options={[{ value: "do", label: "افعل" }, { value: "avoid", label: "قلّل من" }]} />
        <ul className="mt-3 bg-card border border-white/[0.06] rounded-3xl divide-y divide-white/[0.06]">
          {(tab === "do" ? doThis : avoid).map((x) => (
            <li key={x} className="flex items-center gap-3 p-4 text-sm">
              {tab === "do" ? <CircleCheck size={18} className="text-primary shrink-0" /> : <CircleX size={18} className="text-destructive shrink-0" />}
              {x}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
