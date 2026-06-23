import { SquarePen, Moon, Sun } from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function MoreSheetContent() {
  const { newChat, cycleTheme, theme, closeSheet } = useWidgetStore();

  return (
    <div className="px-1 pb-6 pt-2">
      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Tùy chọn
      </p>
      <div className="flex flex-col gap-y-1 px-1">
        <Button
          variant="ghost"
          onClick={() => {
            newChat();
            closeSheet();
          }}
          className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-foreground/5 active:bg-foreground/10"
        >
          <SquarePen className="h-4 w-4 text-muted-foreground" />
          Tạo cuộc trò chuyện mới
        </Button>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-foreground/5 focus-within:bg-foreground/5">
          {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          <Label htmlFor="theme-switch" className="flex-1 text-sm font-medium">
            Chế độ tối
          </Label>
          <Switch
            id="theme-switch"
            checked={theme === "dark"}
            onCheckedChange={cycleTheme}
          />
        </div>
      </div>

    </div>
  );
}
