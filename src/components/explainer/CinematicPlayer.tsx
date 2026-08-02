import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { narrate } from "@/lib/tts.functions";
import type { ExplainerStep } from "@/lib/explainer-schema";
import { TopicVisual } from "./TopicVisual";

const FALLBACK_MS = 8000;

export function CinematicPlayer({
  title,
  steps,
  templateType,
  onClose,
}: {
  title: string;
  steps: ExplainerStep[];
  templateType: string;
  onClose: () => void;
}) {
  const speak = useServerFn(narrate);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<number, string>());
  const failed = useRef(false);

  const step = steps[index];

  const load = useCallback(
    async (i: number) => {
      const cached = cache.current.get(i);
      if (cached) return cached;
      const text = steps[i]?.narration;
      if (!text || failed.current) return null;
      try {
        const { audio, mimeType } = await speak({ data: { text, voice: "alloy" } });
        const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
        cache.current.set(i, url);
        return url;
      } catch {
        failed.current = true;
        return null;
      }
    },
    [speak, steps],
  );

  // Play narration for the current step, advance when it ends.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const audio = audioRef.current;
    audio?.pause();

    if (!playing) return;

    const advance = () => {
      if (cancelled) return;
      setIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    };

    if (muted) {
      timer = setTimeout(advance, FALLBACK_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    setLoading(true);
    void load(index).then((url) => {
      setLoading(false);
      if (cancelled) return;
      if (!url || !audioRef.current) {
        timer = setTimeout(advance, FALLBACK_MS);
        return;
      }
      const el = audioRef.current;
      el.src = url;
      el.onended = advance;
      void el.play().catch(() => {
        timer = setTimeout(advance, FALLBACK_MS);
      });
      void load(index + 1);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      audioRef.current?.pause();
    };
  }, [index, playing, muted, load, steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") setIndex((i) => Math.min(steps.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, steps.length]);

  useEffect(() => {
    const urls = cache.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur">
      <audio ref={audioRef} className="hidden" />

      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Now playing
          </p>
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close video">
          <X className="size-4" />
        </Button>
      </header>

      <div className="hero-surface relative flex flex-1 flex-col justify-center overflow-hidden px-5 py-8 sm:px-10">
        <div
          key={`stage-${index}`}
          className="animate-in fade-in zoom-in-95 mx-auto w-full max-w-4xl duration-700"
        >
          <TopicVisual
            templateType={templateType}
            steps={steps}
            index={index}
            onSelect={(i) => setIndex(i)}
          />
        </div>

        <div key={`copy-${index}`} className="mx-auto mt-8 w-full max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Chapter {index + 1} of {steps.length}
          </p>
          <h3 className="animate-in fade-in slide-in-from-bottom-3 mt-2 text-2xl font-semibold sm:text-4xl">
            {step.label}
          </h3>
          <div className="animate-in fade-in mt-4 flex flex-wrap gap-2 delay-200">
            {step.entities.map((entity, i) => (
              <span
                key={`${index}-${entity}-${i}`}
                className="rounded-lg border border-primary/40 bg-card/70 px-2.5 py-1 font-mono text-[10px] text-primary"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card px-5 py-4 sm:px-10">
        <p
          key={`caption-${index}`}
          className="animate-in fade-in mx-auto max-w-3xl text-center text-sm leading-relaxed sm:text-base"
        >
          {step.narration}
        </p>
        <div className="mx-auto mt-4 flex max-w-3xl items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Previous chapter"
          >
            <SkipBack className="size-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
            aria-label="Next chapter"
          >
            <SkipForward className="size-4" />
          </Button>
          <div className="flex flex-1 gap-1">
            {steps.map((s, i) => (
              <button
                key={i}
                aria-label={`Chapter ${i + 1}: ${s.label}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= index ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute narration" : "Mute narration"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}