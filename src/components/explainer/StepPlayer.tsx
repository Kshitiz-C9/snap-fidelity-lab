import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExplainerStep } from "@/lib/explainer-schema";
import { TopicVisual } from "./TopicVisual";

export function StepPlayer({
  steps,
  templateType = "process_flow",
}: {
  steps: ExplainerStep[];
  templateType?: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function goToStep(next: number, scroll = false) {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setTransitioning(true);
    setIndex(clamped);
    if (scroll) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.setTimeout(() => setTransitioning(false), 320);
  }

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      setIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 7000);
    return () => clearTimeout(t);
  }, [playing, index, steps.length]);

  const step = steps[index];
  if (!step) return null;

  return (
    <div ref={containerRef} className="panel scroll-mt-24 overflow-hidden">
      <div
        className={`hero-surface relative min-h-[320px] p-8 transition-all duration-300 ease-out ${
          transitioning ? "scale-[0.99] opacity-70 blur-[1px]" : "scale-100 opacity-100 blur-0"
        }`}
      >
        <div key={`visualdiagram-${index}`} className="animate-in fade-in mb-6">
          <TopicVisual
            templateType={templateType}
            steps={steps}
            index={index}
            onSelect={(i) => {
              setPlaying(false);
              goToStep(i, true);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {step.entities.map((entity, i) => (
            <span
              key={`${index}-${entity}-${i}`}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-primary/40 bg-card/80 px-3 py-2 font-mono text-xs text-primary"
              style={{ animationDelay: `${i * 90}ms`, animationFillMode: "backwards" }}
            >
              {entity}
            </span>
          ))}
        </div>
        <h3
          key={`label-${index}`}
          className="animate-in fade-in slide-in-from-bottom-3 mt-8 text-3xl font-semibold"
        >
          {step.label}
        </h3>
        <p
          key={`visual-${index}`}
          className="animate-in fade-in mt-4 max-w-2xl text-sm text-accent"
        >
          {step.visual}
        </p>
      </div>

      <div className="border-t border-border bg-card px-6 py-5">
        <p key={`narration-${index}`} className="animate-in fade-in text-base leading-relaxed">
          {step.narration}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToStep(index - 1)}
            aria-label="Previous step"
          >
            <SkipBack className="size-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToStep(index + 1)}
            aria-label="Next step"
          >
            <SkipForward className="size-4" />
          </Button>
          <div className="ml-2 flex flex-1 gap-1">
            {steps.map((s, i) => (
              <button
                key={i}
                aria-label={`Go to step ${i + 1}: ${s.label}`}
                onClick={() => goToStep(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= index ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {index + 1}/{steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}