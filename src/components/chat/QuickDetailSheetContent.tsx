import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWidgetStore } from "@/store/useWidgetStore";
import { composerRef } from "@/lib/composerRef";
import type { QuickFaqItem } from "@/types";

/** Resolve a query template into composer text: drop the {input} placeholder and
 *  leave a trailing space so the user keeps typing where the value goes. */
function resolveCommand(command: string) {
  if (!command.includes("{input}")) return command;
  return command.replace("{input}", "").replace(/\s{2,}/g, " ").trimEnd() + " ";
}

export function QuickDetailSheetContent() {
  const { quickDetailSheet, fillComposer } = useWidgetStore();
  const [selectedFaq, setSelectedFaq] = useState<QuickFaqItem | null>(null);

  if (!quickDetailSheet) return null;
  const { label, type } = quickDetailSheet;

  // Dynamic FAQ category: list of questions that push to a read-only answer view.
  if (type === "dynamic") {
    return (
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {selectedFaq ? (
            <motion.div
              key="detail"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="px-1 pb-6 pt-1"
            >
              <div className="mb-3 flex items-center gap-1 px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFaq(null)}
                  className="h-8 w-8 hover:bg-foreground/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="truncate text-sm font-semibold">{selectedFaq.question}</p>
              </div>
              <div className="whitespace-pre-wrap px-3 text-sm leading-relaxed text-foreground/80">
                {selectedFaq.answer}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="px-1 pb-6 pt-2"
            >
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="flex flex-col gap-y-0.5 px-1">
                {quickDetailSheet.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedFaq(item)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-foreground/5 active:bg-foreground/10"
                  >
                    <span className="flex-1 text-sm font-medium leading-snug">{item.question}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Fill category: list of query templates that populate the composer when picked.
  return (
    <div className="px-1 pb-6 pt-2">
      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-y-0.5 px-1">
        {quickDetailSheet.items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              composerRef.current?.focus();
              fillComposer(resolveCommand(item.command));
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-foreground/5 active:bg-foreground/10"
          >
            <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
              <span className="text-sm font-medium leading-snug">{item.title}</span>
              <span className="truncate text-xs text-muted-foreground">{item.command}</span>
            </div>
            <CornerDownLeft className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
