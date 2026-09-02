import { useState } from "react";
import { Code2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExplainerStep } from "@/lib/explainer-schema";

export function StepExercises({
  steps,
  onJumpToStep,
}: {
  steps: ExplainerStep[];
  onJumpToStep?: (index: number) => void;
}) {
  const exercises = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => Boolean(step.example?.trim()));

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  if (!exercises.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This explainer has no worked examples yet — regenerate it to get code exercises.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold">Solve the walkthrough</h3>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Each highlighted example from the step player, restated as something to write in code.
        </p>
      </div>

      {exercises.map(({ step, index }) => (
        <div key={index} className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-sans text-[11px] text-muted-foreground">
                Step {index + 1}
              </span>
              <h4 className="font-display text-lg font-bold leading-snug">{step.label}</h4>
            </div>
            {onJumpToStep && (
              <button
                onClick={() => onJumpToStep(index)}
                className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 font-sans text-[11px]"
              >
                View step
              </button>
            )}
          </div>

          <div className="mt-3 border-l-2 border-primary bg-primary/10 px-4 py-3">
            <span className="font-sans text-[11px] font-medium text-accent">Example</span>
            <p className="mt-1 font-mono text-[0.9rem] leading-relaxed">
              <mark className="bg-primary/25 px-1 text-foreground">{step.example}</mark>
            </p>
          </div>

          <label className="mt-4 flex items-center gap-2 font-sans text-[11px] text-muted-foreground">
            <Code2 className="size-3.5" />
            Your solution
          </label>
          <textarea
            spellCheck={false}
            value={answers[index] ?? ""}
            onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
            placeholder="// implement this example in code"
            className="mt-2 min-h-32 w-full resize-y rounded-[4px] border border-border bg-background px-3 py-2 font-mono text-[0.85rem] leading-relaxed outline-none focus:border-primary/60"
          />

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-[3px]"
              onClick={() => setRevealed({ ...revealed, [index]: !revealed[index] })}
            >
              {revealed[index] ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {revealed[index] ? "Hide hint" : "Show hint"}
            </Button>
          </div>

          {revealed[index] && (
            <p className="mt-3 border-t border-border pt-3 font-sans text-sm text-muted-foreground">
              {step.narration}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
