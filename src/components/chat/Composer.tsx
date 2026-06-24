import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Mic, Send, X, Check, Lightbulb, FileText, Search, BellRing, Mail, Tv, Wrench, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useFileAttachments } from "@/hooks/useFileAttachments";
import { useWidgetStore } from "@/store/useWidgetStore";
import { FileChips } from "./FileChips";
import { SkillPopup } from "./SkillPopup";
import { Chip } from "../shared/Chip";
import { QUICK_SUGGESTIONS } from "@/data/messages";
import { filterSkills } from "@/data/skills";
import type { Skill } from "@/types";
import { cn } from "@/lib/utils";
import { composerRef } from "@/lib/composerRef";

const ICONS = { FileText, Search, BellRing, Mail, Tv, Wrench, HelpCircle } as const;

// Fixed, varied bar heights (px) so the waveform is deterministic, not re-randomized per render.
const WAVE_BARS = [
  10, 16, 22, 14, 8, 18, 24, 12, 20, 16, 10, 22, 14, 18, 8, 24, 12, 20, 16, 10,
];
const MAX_TEXTAREA_HEIGHT = 160;

const merge = (...parts: string[]) =>
  parts
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

export function Composer({
  placeholder,
  onSend,
}: {
  placeholder: string;
  onSend: (text: string, files?: File[]) => void;
}) {
  const [value, setValue] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsVisible, setSkillsVisible] = useState(false);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  // Index in `value` where the active `/word` starts (-1 when no popup).
  const slashStartRef = useRef(-1);
  const textBeforeRecordRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechRecognition();
  const attach = useFileAttachments();
  const openQuickDetailSheet = useWidgetStore((s) => s.openQuickDetailSheet);
  const composerFillRequest = useWidgetStore((s) => s.composerFillRequest);
  const consumeComposerFill = useWidgetStore((s) => s.consumeComposerFill);

  const submit = () => {
    const t = value.trim();
    if (!t && attach.files.length === 0) return;
    onSend(t, attach.files.length > 0 ? attach.files : undefined);
    setValue("");
    attach.clear();
    closeSkillPopup();
  };

  const closeSkillPopup = () => {
    setSkillsVisible(false);
    slashStartRef.current = -1;
  };

  // Detect a `/word` immediately before the cursor and open the skill popup
  // with matches. The token must start at line-start or after whitespace.
  const detectSlash = (text: string, cursor: number) => {
    const before = text.slice(0, cursor);
    const match = before.match(/(?:^|\s)(\/\S*)$/);
    if (!match) {
      closeSkillPopup();
      return;
    }
    const slashWord = match[1]; // e.g. "/sla"
    const found = filterSkills(slashWord.slice(1));
    if (found.length === 0) {
      closeSkillPopup();
      return;
    }
    slashStartRef.current = cursor - slashWord.length;
    setSkills(found);
    setSelectedSkillIndex(0);
    setSkillsVisible(true);
  };

  const selectSkill = (skill: Skill) => {
    const el = textareaRef.current;
    if (!el || slashStartRef.current === -1) return;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, slashStartRef.current);
    const after = value.slice(cursor);
    const next = `${before}${skill.slashCommand} ${after}`;
    setValue(next);
    closeSkillPopup();
    const caret = before.length + skill.slashCommand.length + 1;
    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  // While recording, the textarea shows pre-record text + the live transcript.
  const displayValue = speech.isListening
    // eslint-disable-next-line react-hooks/refs -- snapshot taken at record-start; safe to read during render
    ? merge(textBeforeRecordRef.current, speech.transcript)
    : value;
  const canSend = value.trim().length > 0 || attach.files.length > 0;

  const fillInput = (text: string) => {
    setValue(text);
    setShowQuick(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  useEffect(() => {
    composerRef.current = textareaRef.current;
    requestAnimationFrame(() => textareaRef.current?.focus());
    return () => { composerRef.current = null; };
  }, []);

  // Apply a fill request raised by the quick-detail sheet, then clear it so the
  // same query can be picked again later.
  useEffect(() => {
    if (composerFillRequest != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncs external store fill-request into the composer
      fillInput(composerFillRequest);
      consumeComposerFill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerFillRequest]);

  const startRecording = () => {
    textBeforeRecordRef.current = value;
    speech.start();
  };
  const confirmRecording = () => {
    const merged = merge(textBeforeRecordRef.current, speech.transcript);
    speech.stop();
    setValue(merged);
  };
  const cancelRecording = () => {
    speech.cancel();
    setValue(textBeforeRecordRef.current);
  };

  return (
    <div className="flex-shrink-0 px-3 pb-2" {...attach.getRootProps()}>
      <input {...attach.getInputProps()} />
      <div className="relative rounded-[14px] border border-border focus-within:border-primary">
        <AnimatePresence initial={false}>
          {skillsVisible && (
            <motion.div
              key="skills"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <SkillPopup
                skills={skills}
                selectedIndex={selectedSkillIndex}
                onSelect={selectSkill}
                onHover={setSelectedSkillIndex}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {showQuick && (
            <motion.div
              key="quick"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-b border-border/60 px-3 py-2.5">
                <div className="mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Gợi ý nhanh
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((suggestion) => {
                    const Icon = ICONS[suggestion.icon as keyof typeof ICONS];
                    return (
                      <Chip
                        key={suggestion.label}
                        onClick={() => {
                          openQuickDetailSheet(suggestion);
                          setShowQuick(false);
                        }}
                      >
                        <Icon className="h-[15px] w-[15px]" />
                        {suggestion.label}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {attach.files.length > 0 && (
          <FileChips files={attach.files} onRemove={attach.removeFile} />
        )}
        <div className="relative flex flex-col px-2 pt-2">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={displayValue}
            placeholder={placeholder}
            onChange={(e) => {
              if (speech.isListening) return;
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
              detectSlash(e.target.value, e.target.selectionStart ?? e.target.value.length);
            }}
            onPaste={(e) => {
              if (speech.isListening) return;
              const images = Array.from(e.clipboardData.items)
                .filter(
                  (it) => it.kind === "file" && it.type.startsWith("image/"),
                )
                .map((it) => it.getAsFile())
                .filter((f): f is File => f !== null);
              if (images.length > 0) {
                e.preventDefault();
                attach.addFiles(images);
              }
            }}
            onKeyDown={(e) => {
              if (skillsVisible && skills.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedSkillIndex((i) => (i + 1) % skills.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedSkillIndex((i) => (i - 1 + skills.length) % skills.length);
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  selectSkill(skills[selectedSkillIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeSkillPopup();
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="min-h-0 max-h-[160px] w-full resize-none border-0 bg-transparent px-0 py-0 text-[13.5px] md:text-[13.5px] shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Đính kèm"
                onClick={attach.open}
                className="hover:bg-foreground/5"
              >
                <Plus />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Gợi ý nhanh"
                onClick={() => setShowQuick((v) => !v)}
                className={cn(
                  "hover:bg-foreground/5",
                  showQuick && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
              >
                <Lightbulb />
              </Button>
            </div>
            <div className="flex items-center gap-0.5">
              {!speech.isListening && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title={
                    speech.isSupported
                      ? "Nhập bằng giọng nói"
                      : "Trình duyệt không hỗ trợ ghi âm"
                  }
                  disabled={!speech.isSupported}
                  onClick={startRecording}
                  className="hover:bg-foreground/5"
                >
                  <Mic />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant={canSend ? "default" : "ghost"}
                title="Gửi"
                onClick={submit}
                disabled={!canSend}
                className={
                  canSend
                    ? ""
                    : "disabled:opacity-100 bg-transparent hover:bg-transparent shadow-none"
                }
              >
                <Send />
              </Button>
            </div>
          </div>

          {speech.isListening && (
            <div
              data-testid="recording-overlay"
              className="absolute inset-0 z-10 flex items-center rounded-[14px] bg-muted px-1"
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Hủy ghi âm"
                aria-label="Hủy ghi âm"
                onClick={cancelRecording}
                className="flex-shrink-0"
              >
                <X />
              </Button>
              <div
                className="flex flex-1 items-center justify-center gap-[2px]"
                aria-hidden="true"
              >
                {WAVE_BARS.map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-primary animate-wave"
                    style={{ height: h, animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Lưu ghi âm"
                aria-label="Lưu ghi âm"
                onClick={confirmRecording}
                className="flex-shrink-0"
              >
                <Check />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
