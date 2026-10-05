import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface Toast { id: number; title: string; text?: string }
const ToastContext = createContext<(title: string, text?: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((title: string, text?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-28 inset-x-4 mx-auto max-w-sm z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass rounded-2xl p-4 flex gap-3 shadow-[0_20px_40px_hsl(224_20%_3%/0.6)]"
            >
              <CheckCircle2 className="text-primary shrink-0" size={20} />
              <div>
                <p className="font-bold text-sm">{t.title}</p>
                {t.text && <p className="text-muted-foreground text-xs mt-0.5">{t.text}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
