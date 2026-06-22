import { useRef, useState } from "react";
import { Paperclip, Mic, Send, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useFileAttachments } from "@/hooks/useFileAttachments";
import { FileChips } from "./FileChips";

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
  const textBeforeRecordRef = useRef("");
  const speech = useSpeechRecognition();
  const attach = useFileAttachments();

  const submit = () => {
    const t = value.trim();
    if (!t && attach.files.length === 0) return;
    onSend(t, attach.files.length > 0 ? attach.files : undefined);
    setValue("");
    attach.clear();
  };

  // While recording, the textarea shows pre-record text + the live transcript.
  const displayValue = speech.isListening
    ? merge(textBeforeRecordRef.current, speech.transcript)
    : value;
  const canSend = value.trim().length > 0 || attach.files.length > 0;

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
    <div
      className="flex-shrink-0 border-t border-border/60 px-3 py-2"
      {...attach.getRootProps()}
    >
      <input {...attach.getInputProps()} />
      <div className="rounded-[14px] border border-border bg-muted/60 focus-within:border-primary">
        {attach.files.length > 0 && (
          <FileChips files={attach.files} onRemove={attach.removeFile} />
        )}
        <div className="relative flex items-end gap-1 py-1 px-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title="Đính kèm"
            onClick={attach.open}
            className="flex-shrink-0"
          >
            <Paperclip />
          </Button>
          <Textarea
            rows={1}
            value={displayValue}
            placeholder={placeholder}
            onChange={(e) => {
              if (speech.isListening) return;
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="min-h-0 max-h-[160px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-[13.5px] md:text-[13.5px] shadow-none focus-visible:ring-0"
          />
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
              className="flex-shrink-0"
            >
              <Mic />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            title="Gửi"
            onClick={submit}
            disabled={!canSend}
            className="flex-shrink-0"
          >
            <Send />
          </Button>

          {speech.isListening && (
            <div
              data-testid="recording-overlay"
              className="absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-[14px] bg-muted"
            >
              <div
                className="flex flex-1 items-center justify-center gap-[2px]"
                style={{ maxWidth: 200 }}
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
              <div className="flex flex-shrink-0 items-center">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title="Hủy ghi âm"
                  aria-label="Hủy ghi âm"
                  onClick={cancelRecording}
                  className="text-destructive hover:text-destructive"
                >
                  <X />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title="Lưu ghi âm"
                  aria-label="Lưu ghi âm"
                  onClick={confirmRecording}
                  className="text-[hsl(var(--status-done))] hover:text-[hsl(var(--status-done))]"
                >
                  <Check />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
