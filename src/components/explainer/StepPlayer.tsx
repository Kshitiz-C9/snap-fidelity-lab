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
    <div ref={containerRef} className="slab scroll-mt-24 overflow-hidden">
      {/* notebook page: the animation canvas */}
      <div
        className={`notebook relative min-h-[320px] px-8 py-8 transition-opacity duration-300 ease-out ${
          transitioning ? "opacity-70" : "opacity-100"
        }`}
      >
        <div className="mb-6">
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

        <div className="h-px w-full bg-border" />

        <div className="flex flex-wrap gap-2 pt-6">
          {step.entities.map((entity, i) => (
            <span
              key={`${index}-${entity}-${i}`}
              className="rounded-[3px] border border-border px-2.5 py-1 font-mono text-xs text-foreground/80"
            >
              {entity}
            </span>
          ))}
        </div>

        <h3 className="mt-6 max-w-3xl text-left font-display text-3xl">{step.label}</h3>
        <p className="mt-3 max-w-2xl text-left text-sm text-accent">{step.visual}</p>
      </div>

      <div className="border-t border-border bg-background px-8 py-6">
        <p className="max-w-3xl text-left text-base leading-relaxed">{step.narration}</p>

        <div className="mt-4 h-px w-full bg-border" />

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-[3px]"
            onClick={() => goToStep(index - 1)}
            aria-label="Previous step"
          >
            <SkipBack className="size-4" />
          </Button>
          <Button
            size="icon"
            className="rounded-[3px]"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-[3px]"
            onClick={() => goToStep(index + 1)}
            aria-label="Next step"
          >
            <SkipForward className="size-4" />
          </Button>

          {/* connected dots instead of numbered badges */}
          <div className="relative ml-3 flex flex-1 items-center">
            <div className="absolute left-0 right-0 h-px bg-border" />
            <div className="relative flex w-full items-center justify-between">
              {steps.map((s, i) => (
                <button
                  key={i}
                  aria-label={`Go to step ${i + 1}: ${s.label}`}
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => goToStep(i)}
                  className="group flex size-5 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all ${
                      i === index
                        ? "size-3 bg-primary"
                        : i < index
                          ? "size-2 bg-primary/70"
                          : "size-2 border border-muted-foreground/60 bg-background group-hover:border-primary"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <span className="font-sans text-xs text-muted-foreground">
            Step {index + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
