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
    <div ref={containerRef} className="scroll-mt-24">
      {/* timeline */}
      <nav aria-label="Chapters" className="-mx-1 overflow-x-auto pb-2">
        <ol className="relative flex min-w-max px-1">
          {steps.map((s, i) => {
            const state = i === index ? "active" : i < index ? "done" : "todo";
            return (
              <li key={i} className="relative w-36 shrink-0">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-3 right-0 top-[11px] h-px ${i < index ? "bg-foreground" : "bg-border"}`}
                  />
                )}
                <button
                  onClick={() => goToStep(i)}
                  aria-current={state === "active" ? "step" : undefined}
                  aria-label={`Go to step ${i + 1}: ${s.label}`}
                  className="group relative flex w-full flex-col items-start gap-2 pr-4 text-left"
                >
                  <span className="flex size-6 items-center justify-center bg-background">
                    <span
                      className={`block rounded-full transition-all ${
                        state === "active"
                          ? "size-3.5 bg-foreground ring-4 ring-foreground/10"
                          : state === "done"
                            ? "size-2.5 bg-muted-foreground"
                            : "size-2.5 border border-muted-foreground bg-card group-hover:border-foreground"
                      }`}
                    />
                  </span>
                  <span
                    className={`font-sans text-xs leading-snug ${
                      state === "active" ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* canvas */}
      <div
        className={`notebook mt-6 border border-foreground px-5 py-8 transition-opacity duration-300 ease-out sm:px-8 ${
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
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 border-x border-b border-border bg-card px-4 py-3">
        <Button variant="outline" size="icon" className="size-9 rounded-none" onClick={() => goToStep(index - 1)} disabled={index === 0} aria-label="Previous step">
          <SkipBack className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-9 rounded-none" onClick={() => goToStep(index + 1)} disabled={index === steps.length - 1} aria-label="Next step">
          <SkipForward className="size-4" />
        </Button>
        <div className="mx-3 h-px flex-1 bg-border">
          <div className="h-px bg-foreground transition-all duration-300" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
      </div>

      {/* reading column */}
      <article className={`mx-auto mt-12 max-w-[68ch] transition-opacity duration-300 ${transitioning ? "opacity-70" : "opacity-100"}`}>
        <span className="kicker">Section {String(index + 1).padStart(2, "0")}</span>
        <h2 className="mt-2 font-display text-[2.25rem] font-bold leading-[1.1] tracking-tight sm:text-[2.6rem]">
          {step.label}
        </h2>

        {step.definition ? (
          <div className="mt-6 border-l-2 border-foreground pl-5">
            <span className="kicker">Definition</span>
            <p className="mt-1.5 font-sans text-[1.02rem] leading-relaxed text-foreground">{step.definition}</p>
          </div>
        ) : null}

        <p className="mt-6 font-sans text-[1.02rem] leading-[1.75] text-foreground/90">{step.narration}</p>

        {step.key_points && step.key_points.length > 0 ? (
          <ul className="mt-6 space-y-2.5 border-t border-border pt-6">
            {step.key_points.map((point, i) => (
              <li key={`${index}-kp-${i}`} className="flex gap-3 font-sans text-[0.95rem] leading-relaxed text-foreground/90">
                <span className="mt-0.5 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {step.example ? (
          <div className="mt-8 border border-border bg-secondary px-5 py-4">
            <span className="kicker">Worked example</span>
            <p className="mt-2 font-mono text-[0.88rem] leading-relaxed text-foreground">{step.example}</p>
          </div>
        ) : null}

        <p className="mt-6 font-sans text-sm italic text-muted-foreground">{step.visual}</p>

        {step.entities.length > 0 && (
          <p className="mt-4 font-sans text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Key terms: </span>
            {step.entities.join(" · ")}
          </p>
        )}
      </article>
    </div>
  );
}
