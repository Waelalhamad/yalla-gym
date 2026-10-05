import { useEffect, useState } from "react";
import { X, Youtube } from "lucide-react";
import type { ExerciseInfo } from "@/lib/library";
import { youtubeAr, youtubeEn } from "@/lib/library";
import { cn } from "@/lib/utils";

/**
 * Alternates the start/end photos of an exercise so the movement reads like a
 * short animation. Photos: free-exercise-db (public domain).
 */
export function ExerciseMedia({ info, className, still = false }: { info: ExerciseInfo; className?: string; still?: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setFrame((f) => 1 - f), 1100);
    return () => clearInterval(t);
  }, [still]);

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {[0, 1].map((n) => (
        <img
          key={n}
          src={`/ex/${info.img}/${n}.jpg`}
          alt={n === 0 ? `${info.ar}: وضعية البداية` : `${info.ar}: وضعية النهاية`}
          loading="lazy"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            frame === n ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      {!still && (
        <span className="absolute bottom-2 start-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-md">
          {frame === 0 ? "البداية" : "النهاية"}
        </span>
      )}
    </div>
  );
}

export function VideoLinks({ info }: { info: ExerciseInfo }) {
  const cls = "btn-press inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-colors";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={youtubeAr(info)} target="_blank" rel="noreferrer" className={cn(cls, "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20")}>
        <Youtube size={14} /> فيديو شرح بالعربي
      </a>
      <a href={youtubeEn(info)} target="_blank" rel="noreferrer" className={cn(cls, "border-border bg-secondary text-secondary-foreground hover:bg-muted")}>
        <Youtube size={14} /> فيديو بالإنجليزي
      </a>
    </div>
  );
}

/** Full "how to" block: steps + common mistakes + video links. */
export function HowTo({ info }: { info: ExerciseInfo }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-bold mb-2">طريقة الأداء</p>
        <ol className="space-y-1.5">
          {info.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
              <span className="text-muted-foreground leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      {info.mistakes.length > 0 && (
        <div>
          <p className="font-bold mb-2">أخطاء شائعة</p>
          <ul className="space-y-1">
            {info.mistakes.map((m) => (
              <li key={m} className="text-muted-foreground flex gap-2"><X size={14} className="text-destructive shrink-0 mt-0.5" />{m}</li>
            ))}
          </ul>
        </div>
      )}
      <VideoLinks info={info} />
    </div>
  );
}
