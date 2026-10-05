import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] } }),
};

/** Arabic month names with Western digits, e.g. "5 أكتوبر". */
export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00").toLocaleDateString("ar-SY-u-nu-latn", { day: "numeric", month: "short" });
