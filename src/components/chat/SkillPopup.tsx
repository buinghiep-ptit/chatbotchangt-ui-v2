import { Sparkles } from "lucide-react";
import type { Skill } from "@/types";
import { cn } from "@/lib/utils";

export function SkillPopup({
  skills,
  selectedIndex,
  onSelect,
  onHover,
}: {
  skills: Skill[];
  selectedIndex: number;
  onSelect: (skill: Skill) => void;
  onHover: (index: number) => void;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="border-b border-border/60 px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Skills ({skills.length})
        </span>
      </div>
      <div className="flex max-h-[200px] flex-col overflow-y-auto">
        {skills.map((skill, i) => (
          <button
            key={skill.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(skill);
            }}
            onMouseEnter={() => onHover(i)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
              i === selectedIndex ? "bg-foreground/5" : "bg-transparent",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md",
                i === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "bg-foreground/5 text-muted-foreground",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[12.5px] font-medium leading-snug text-foreground">
                {skill.slashCommand}
              </span>
              <span className="block truncate text-[11.5px] text-muted-foreground">
                {skill.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
