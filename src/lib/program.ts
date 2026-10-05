import { machineAlt } from "./library";

export interface Prescription {
  /** id in library.ts */
  ex: string;
  sets: number;
  repMin: number;
  repMax: number;
  /** "s" means seconds (plank etc.) */
  unit?: "reps" | "s";
  rest: string;
  main?: boolean;
  note?: string;
}

export interface WorkoutDay {
  id: string;
  title: string;
  focus: string;
  items: Prescription[];
  finisher: string;
}

export type DayPlan = { kind: "workout"; workoutId: string } | { kind: "walk" } | { kind: "rest" };
export type Phase = 1 | 2 | 3;

const p = (ex: string, sets: number, repMin: number, repMax: number, rest: string, extra: Partial<Prescription> = {}): Prescription =>
  ({ ex, sets, repMin, repMax, rest, ...extra });

export const phases: Record<Phase, { name: string; weeks: string; goal: string; points: string[] }> = {
  1: {
    name: "التأسيس",
    weeks: "الأسابيع 1-4",
    goal: "تعلّم الحركات وعوّد جسمك ومفاصلك",
    points: ["3 أيام جيم بأجهزة سهلة ودمبل", "أوزان خفيفة: اترك 3 عدّات في الخزان", "الهدف هو الالتزام، وليس الوزن"],
  },
  2: {
    name: "البناء",
    weeks: "الأسابيع 5-12",
    goal: "زيادة الأوزان كل أسبوع وتعلّم التمارين الأساسية بالبار",
    points: ["4 أيام: علوي / سفلي", "بنش، سكوات، ضغط كتف، رفعة مميتة", "اترك عدّة إلى عدّتين في الخزان"],
  },
  3: {
    name: "القوة",
    weeks: "الأسبوع 13 وما بعده",
    goal: "قوة حقيقية: أوزان أثقل وعدّات أقل في التمارين الأساسية",
    points: ["التمارين الأساسية 5 جولات × 3-5 عدّات", "أسبوع خفيف كل 6-8 أسابيع", "استمر بالنزول بالوزن تدريجياً"],
  },
};

export const workouts: Record<string, WorkoutDay> = {
  // ---------- Phase 1: foundation (machines + dumbbells) ----------
  f1A: {
    id: "f1A", title: "تأسيس A", focus: "كامل الجسم بالأجهزة",
    finisher: "10 دقائق مشي على السير بميل 3-5%",
    items: [
      p("legpress", 3, 10, 12, "دقيقتان", { main: true }),
      p("machinepress", 3, 10, 12, "90 ث", { main: true }),
      p("pulldown", 3, 10, 12, "90 ث"),
      p("legcurl", 2, 12, 15, "60 ث"),
      p("plank", 3, 15, 30, "60 ث", { unit: "s", note: "ابدأ على ركبتيك إذا كان صعباً" }),
    ],
  },
  f1B: {
    id: "f1B", title: "تأسيس B", focus: "سكوات · ظهر · كتف",
    finisher: "10 دقائق دراجة بهدوء",
    items: [
      p("goblet", 3, 8, 12, "دقيقتان", { main: true, note: "ابدأ بدمبل 8-12 كغ" }),
      p("cablerow", 3, 10, 12, "90 ث", { main: true }),
      p("dbpress", 2, 10, 12, "90 ث"),
      p("rdl_db", 3, 10, 12, "90 ث"),
      p("deadbug", 2, 8, 10, "60 ث"),
    ],
  },
  f1C: {
    id: "f1C", title: "تأسيس C", focus: "رجل واحدة · صدر · ظهر",
    finisher: "10 دقائق مشي على السير",
    items: [
      p("stepup", 2, 8, 10, "90 ث", { note: "بدون وزن، صندوق منخفض" }),
      p("incline", 3, 10, 12, "90 ث", { main: true }),
      p("dbrow", 3, 10, 12, "90 ث", { main: true }),
      p("legext", 2, 12, 15, "60 ث"),
      p("lateral", 2, 12, 15, "60 ث"),
      p("calf", 2, 12, 15, "60 ث"),
    ],
  },

  // ---------- Phase 2+: upper / lower ----------
  upperA: {
    id: "upperA", title: "علوي A", focus: "صدر · ظهر · ذراعين",
    finisher: "10 دقائق مشي مائل 8-12%",
    items: [
      p("bench", 4, 6, 10, "2-3 د", { main: true }),
      p("pulldown", 3, 8, 12, "90 ث"),
      p("dbpress", 3, 8, 12, "90 ث"),
      p("cablerow", 3, 10, 12, "90 ث"),
      p("pushdown", 2, 12, 15, "60 ث"),
      p("curl", 2, 12, 15, "60 ث"),
    ],
  },
  lowerA: {
    id: "lowerA", title: "سفلي A", focus: "سكوات · خلفي الفخذ · بطن",
    finisher: "10 دقائق دراجة",
    items: [
      p("squat", 4, 6, 10, "2-3 د", { main: true, note: "بديل: سكوات الكأس أو ضغط الأرجل" }),
      p("rdl", 3, 8, 10, "دقيقتان"),
      p("legpress", 3, 10, 15, "90 ث"),
      p("legcurl", 3, 10, 15, "60 ث"),
      p("calf", 3, 12, 20, "60 ث"),
      p("plank", 3, 30, 45, "60 ث", { unit: "s" }),
    ],
  },
  upperB: {
    id: "upperB", title: "علوي B", focus: "كتف · سماكة الظهر · أعلى الصدر",
    finisher: "10 دقائق مشي مائل",
    items: [
      p("ohp", 4, 6, 8, "2-3 د", { main: true, note: "بديل: ضغط الكتف بالدمبل جلوساً" }),
      p("dbrow", 4, 8, 10, "90 ث"),
      p("incline", 3, 8, 12, "90 ث"),
      p("pulldown", 3, 10, 12, "90 ث"),
      p("lateral", 3, 12, 20, "60 ث"),
      p("facepull", 3, 15, 15, "60 ث"),
    ],
  },
  lowerB: {
    id: "lowerB", title: "سفلي B", focus: "رفعة مميتة · رجل واحدة · بطن",
    finisher: "10 دقائق دراجة أو مشي",
    items: [
      p("trapbar", 4, 5, 8, "2-3 د", { main: true }),
      p("hacksquat", 3, 10, 12, "دقيقتان", { note: "أو ضغط الأرجل" }),
      p("stepup", 3, 8, 12, "90 ث"),
      p("legext", 3, 12, 15, "60 ث"),
      p("seatcalf", 3, 15, 20, "60 ث"),
      p("deadbug", 3, 8, 12, "60 ث"),
    ],
  },
  // 3-day option for phase 2+
  fullA: {
    id: "fullA", title: "كامل الجسم A", focus: "سكوات · بنش · سحب",
    finisher: "10 دقائق مشي مائل",
    items: [
      p("squat", 4, 6, 10, "2-3 د", { main: true }),
      p("bench", 4, 6, 10, "2-3 د", { main: true }),
      p("pulldown", 3, 8, 12, "90 ث"),
      p("legcurl", 3, 10, 15, "60 ث"),
      p("plank", 3, 30, 45, "60 ث", { unit: "s" }),
    ],
  },
  fullB: {
    id: "fullB", title: "كامل الجسم B", focus: "رفعة مميتة · ضغط كتف · تجديف",
    finisher: "10 دقائق دراجة",
    items: [
      p("trapbar", 4, 5, 8, "2-3 د", { main: true }),
      p("ohp", 4, 6, 8, "2-3 د", { main: true }),
      p("cablerow", 3, 10, 12, "90 ث"),
      p("legpress", 3, 10, 15, "90 ث"),
      p("curl", 2, 12, 15, "60 ث"),
    ],
  },
  fullC: {
    id: "fullC", title: "كامل الجسم C", focus: "رومانية · صدر مائل · ظهر",
    finisher: "10 دقائق مشي مائل",
    items: [
      p("rdl", 3, 8, 10, "دقيقتان", { main: true }),
      p("incline", 4, 8, 12, "90 ث"),
      p("dbrow", 4, 8, 10, "90 ث"),
      p("stepup", 3, 8, 12, "90 ث"),
      p("lateral", 3, 12, 20, "60 ث"),
    ],
  },
};

/** In phase 3 the main lifts switch to heavier, lower-rep strength work. */
export function prescriptionsFor(w: WorkoutDay, phase: Phase, machinesOnly = false): Prescription[] {
  let items = w.items;
  if (machinesOnly) {
    // Swap free weights for machines; skip alternatives already in this workout.
    const used = new Set(items.map((x) => x.ex));
    items = items.map((x) => {
      const alt = machineAlt[x.ex]?.find((a) => !used.has(a));
      if (!alt) return x;
      used.add(alt);
      return { ...x, ex: alt, note: undefined };
    });
  }
  if (phase < 3) return items;
  return items.map((x) => (x.main && x.unit !== "s" ? { ...x, sets: 5, repMin: 3, repMax: 5, rest: "3 د" } : x));
}

/** Week shown Saturday → Friday. Index = JS getDay() (0 = Sunday). */
export const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const weekOrder = [6, 0, 1, 2, 3, 4, 5];

/** Returns the plan for each JS weekday (0 = Sunday ... 6 = Saturday). */
export function weekSchedule(phase: Phase, daysPerWeek: 3 | 4): DayPlan[] {
  const w = (workoutId: string): DayPlan => ({ kind: "workout", workoutId });
  const walk: DayPlan = { kind: "walk" };
  const rest: DayPlan = { kind: "rest" };
  // order: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  if (phase === 1) return [walk, w("f1B"), walk, w("f1C"), walk, rest, w("f1A")];
  if (daysPerWeek === 4) return [w("lowerA"), walk, w("upperB"), w("lowerB"), walk, rest, w("upperA")];
  return [walk, w("fullB"), walk, w("fullC"), walk, rest, w("fullA")];
}

export const todayDow = () => new Date().getDay();

export const shortTitle = (d: DayPlan) =>
  d.kind === "workout" ? workouts[d.workoutId].title : d.kind === "walk" ? "مشي" : "راحة";

export const walkDay = {
  title: "يوم مشي ونشاط",
  focus: "حرق دهون بدون ضغط على المفاصل",
  items: [
    "30-45 دقيقة مشي سريع خارجاً أو على السير بميل",
    "السرعة المناسبة: تتعرّق لكن تستطيع الكلام بجمل كاملة",
    "إن استطعت: 10 دقائق تمطيط من روتين المكتب",
    "تجنّب الجري والقفز الآن، فهما يضغطان على الركبتين مع الوزن الحالي",
  ],
};

export const warmup = [
  "5 دقائق دراجة أو مشي سريع",
  "دوائر الكتف والورك (10 لكل اتجاه)",
  "جولتان إحماء خفيفتان قبل أول تمرين: 50% ثم 75% من الوزن",
];

export const rules = [
  { title: "الزيادة التدريجية", text: "عندما تصل لأعلى عدد عدّات في كل الجولات، زِد الوزن قليلاً في المرة القادمة. التطبيق يخبرك بذلك تلقائياً." },
  { title: "اترك عدّات في الخزان", text: "أوقف الجولة عندما تستطيع عمل 1-3 عدّات إضافية بشكل صحيح. الأداء الصحيح أهم من الوزن." },
  { title: "الألم العضلي طبيعي", text: "ستشعر بتيبّس العضلات يومين بعد أول تمارين. هذا طبيعي ويخف. أما الألم الحاد في المفصل فتوقف فوراً." },
  { title: "النوم 7-9 ساعات", text: "العضلات تُبنى أثناء النوم. وقلة النوم تزيد الجوع والرغبة بالسكر." },
  { title: "الثبات أهم من الكمال", text: "تمرين متوسط تلتزم به سنة أفضل من برنامج مثالي تتركه بعد شهر. لا تفوّت أسبوعين متتاليين." },
  { title: "أسبوع خفيف", text: "كل 6-8 أسابيع: أسبوع بنصف الجولات. المفاصل ترتاح وترجع أقوى." },
];

/** A daily routine designed for a desk-bound software engineer. */
export const dailyRoutine = [
  { time: "07:00", title: "استيقاظ", text: "كوب ماء كبير و5 دقائق ضوء شمس. نفس الوقت كل يوم." },
  { time: "07:30", title: "فطور بروتين", text: "بيض أو لبنة أو زبادي يوناني. البروتين يقلل الجوع طوال اليوم." },
  { time: "09:00", title: "بداية العمل", text: "شغّل مؤقت الحركة: كل 30-45 دقيقة قم 3 دقائق." },
  { time: "11:00", title: "استراحة تمطيط", text: "روتين المكتب: مقدمة الورك، الصدر، الرقبة (5 دقائق)." },
  { time: "13:30", title: "غداء ثم مشي", text: "10-15 دقيقة مشي بعد الأكل تخفض سكر الدم وتساعد الهضم." },
  { time: "16:00", title: "سناك ذكي", text: "فاكهة مع زبادي، أو حفنة لوز صغيرة. لا للبسكويت والمشروبات الغازية." },
  { time: "18:00", title: "الجيم أو المشي", text: "حسب جدول اليوم. جهّز حقيبتك من الليلة السابقة." },
  { time: "20:00", title: "عشاء خفيف", text: "بروتين وخضار. قلّل النشويات مساءً إذا لم يكن يوم تمرين." },
  { time: "22:30", title: "بدون شاشات", text: "اطفِ الكمبيوتر. تمطيط خفيف (وضعية الطفل) وجهّز النوم." },
  { time: "23:00", title: "نوم", text: "7-9 ساعات. الغرفة مظلمة وباردة." },
];

export const beginnerGuide = [
  { q: "ماذا آخذ معي للجيم؟", a: "حذاء رياضي مريح، منشفة صغيرة، قنينة ماء، وسماعات. وحمّل خطة اليوم على هاتفك من هذا الموقع." },
  { q: "كيف أختار الوزن المناسب؟", a: "ابدأ بوزن خفيف جداً في أول أسبوع. الوزن الصحيح هو الذي تستطيع رفعه بأداء نظيف وتشعر أن 2-3 عدّات إضافية ممكنة. سجّله، وزِد عندما يصبح سهلاً." },
  { q: "ما معنى 3 × 10-12؟", a: "3 جولات (مجموعات)، وكل جولة من 10 إلى 12 تكراراً. ارتح بين الجولات حسب الوقت المكتوب." },
  { q: "لا أعرف كيف أستخدم الجهاز", a: "افتح صفحة التمارين وشاهد الصورة المتحركة والخطوات، أو اضغط على زر الفيديو. ولا تخجل أن تسأل المدرب في الجيم، فهذا عمله." },
  { q: "أشعر بالخجل في الجيم", a: "الجميع بدأ من الصفر، ولا أحد ينظر إليك كما تتخيل. اذهب في وقت هادئ (الصباح أو بعد 9 مساءً) أول أسبوعين." },
  { q: "ماذا لو فوّت يوماً؟", a: "لا مشكلة. أكمل الخطة من التمرين التالي. المهم ألا تفوّت أسبوعاً كاملاً." },
];
