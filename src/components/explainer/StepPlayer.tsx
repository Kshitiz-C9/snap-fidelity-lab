import { useRef, useState } from "react";
import { SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExplainerStep } from "@/lib/explainer-schema";
import { TopicVisual } from "./TopicVisual";
import { StepStage } from "./StepStage";

export function StepPlayer({
  steps,
  templateType = "process_flow",
}: {
  steps: ExplainerStep[];
  templateType?: string;
}) {
  const [index, setIndex] = useState(0);
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

  const step = steps[index];
  if (!step) return null;

  return (
    <div ref={containerRef} className="slab scroll-mt-24 overflow-hidden">
      {/* notebook page: the animation canvas */}
      <div
        className={`notebook relative px-8 py-8 transition-opacity duration-300 ease-out ${
          transitioning ? "opacity-70" : "opacity-100"
        }`}
      >
        <TopicVisual
          templateType={templateType}
          steps={steps}
          index={index}
          onSelect={(i) => goToStep(i, true)}
        />

        <div className="mt-6 border-t border-border pt-6">
          <StepStage steps={steps} index={index} />
        </div>

        {step.example ? (
          <div className="mt-6 border-l-2 border-primary bg-primary/10 px-4 py-3">
            <span className="font-sans text-[11px] font-medium text-accent">
              Example
            </span>
            <p className="mt-1 max-w-2xl text-left font-mono text-[0.9rem] leading-relaxed text-foreground">
              <mark className="bg-primary/25 px-1 text-foreground">{step.example}</mark>
            </p>
          </div>
        ) : null}


        <div className="mt-7 border-t border-border pt-6">
          <h3 className="max-w-3xl text-left font-display text-[2rem] font-bold leading-tight tracking-tight">
            {step.label}
          </h3>
          <p className="mt-2 max-w-2xl text-left font-sans text-sm font-normal text-accent">
            {step.visual}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
            {step.entities.map((entity, i) => (
              <span
                key={`${index}-${entity}-${i}`}
                className="rounded-full bg-primary/12 px-2.5 py-1 font-sans text-[11px] font-normal text-foreground/80"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background px-8 py-6">
        <p className="max-w-3xl text-left font-sans text-[0.95rem] font-normal leading-relaxed text-foreground/85">
          {step.narration}
        </p>

        <div className="mt-5 h-px w-full bg-border" />

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
                  className="group flex size-6 items-center justify-center bg-background"
                >
                  <span
                    className={`block rounded-full transition-all ${
                      i === index
                        ? "size-3 bg-primary ring-4 ring-primary/25"
                        : i < index
                          ? "size-2.5 bg-primary"
                          : "size-2.5 border border-muted-foreground/50 bg-transparent group-hover:border-primary"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <span className="font-sans text-xs font-normal text-muted-foreground">
            Step {index + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
