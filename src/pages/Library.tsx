import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GraduationCap, Search } from "lucide-react";
import { categoryLabel, library, machineIds, type Category } from "@/lib/library";
import { beginnerGuide } from "@/lib/program";
import { ExerciseMedia, HowTo } from "@/components/ExerciseMedia";
import { Sheet, haptic } from "@/components/ui";
import { cn } from "@/lib/utils";

const all = Object.values(library);
const cats = ["all", "machines", "gym", "cardio", "home", "desk"] as const;

export default function Library() {
  const [cat, setCat] = useState<Category | "all" | "machines">("machines");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);

  const list = useMemo(
    () => all.filter((x) => (cat === "all" || (cat === "machines" ? machineIds.has(x.id) : x.category === cat)) && (x.ar + x.en + x.muscles).toLowerCase().includes(q.toLowerCase())),
    [cat, q],
  );
  const open = openId ? library[openId] : null;

  return (
    <div>
      <button
        onClick={() => setGuideOpen(true)}
        className="w-full flex items-center gap-3 p-4 rounded-3xl bg-gradient-to-l from-primary/20 to-primary/5 border border-primary/25 text-start active:scale-[0.99] transition-transform"
      >
        <span className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><GraduationCap size={22} /></span>
        <span>
          <span className="block font-bold">أول مرة في الجيم؟</span>
          <span className="block text-xs text-muted-foreground mt-0.5">دليل المبتدئ: الوزن المناسب، المصطلحات، والخجل</span>
        </span>
      </button>

      <div className="relative mt-4">
        <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن تمرين أو عضلة"
          className="w-full h-12 bg-card border border-white/[0.06] rounded-2xl ps-11 pe-4 text-base outline-none focus:border-primary"
        />
      </div>

      <div className="swipe-row mt-3">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => { haptic(); setCat(c); }}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-bold border whitespace-nowrap",
              cat === c ? "bg-primary text-primary-foreground border-primary" : "border-white/[0.06] bg-card text-muted-foreground",
            )}
          >
            {c === "all" ? `الكل (${all.length})` : c === "machines" ? "الأجهزة" : categoryLabel[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {list.map((x) => (
          <button key={x.id} onClick={() => setOpenId(x.id)} className="text-start bg-card border border-white/[0.06] rounded-3xl overflow-hidden active:scale-[0.98] transition-transform">
            <ExerciseMedia info={x} still className="aspect-square" />
            <div className="p-3">
              <p className="font-bold text-sm leading-snug">{x.ar}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{x.muscles}</p>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">
            لا توجد نتائج. جرّب كلمة أخرى مثل "صدر" أو "ظهر".
          </div>
        )}
      </div>

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.ar}>
        {open && (
          <>
            <ExerciseMedia info={open} className="aspect-[4/3] rounded-3xl" />
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] font-bold bg-primary/15 text-primary px-2 h-6 rounded-full flex items-center">{categoryLabel[open.category]}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">{open.en}</span>
            </div>
            <p className="text-sm mt-2"><span className="text-muted-foreground">العضلات: </span>{open.muscles}</p>
            <div className="mt-4"><HowTo info={open} /></div>
          </>
        )}
      </Sheet>

      <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title="دليل المبتدئ">
        <div className="divide-y divide-white/[0.06]">
          {beginnerGuide.map((g, i) => (
            <div key={g.q}>
              <button onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between gap-3 min-h-14 text-start">
                <span className="font-bold text-sm">{g.q}</span>
                <ChevronDown size={18} className={cn("text-muted-foreground transition-transform shrink-0", faq === i && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {faq === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-sm text-muted-foreground">
                    <span className="block pb-4">{g.a}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
