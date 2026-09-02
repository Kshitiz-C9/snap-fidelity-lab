import { useState } from "react";
import { Code2, Eye, EyeOff, Play, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runJavaScript, type RunResult } from "@/lib/code-runner";
import type { ExplainerStep } from "@/lib/explainer-schema";

const starter = (step: ExplainerStep) =>
  `// ${step.label}\n// Example: ${step.example}\n// Write JavaScript below, then press Run. Use console.log to print.\n\nfunction solve() {\n  // your code here\n}\n\nconsole.log(solve());\n`;

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
  const [results, setResults] = useState<Record<number, RunResult>>({});
  const [running, setRunning] = useState<number | null>(null);

  if (!exercises.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This explainer has no worked examples yet — regenerate it to get code exercises.
      </p>
    );
  }

  const run = async (index: number, code: string) => {
    setRunning(index);
    const result = await runJavaScript(code);
    setResults((prev) => ({ ...prev, [index]: result }));
    setRunning(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold">Solve the walkthrough</h3>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Each highlighted example, restated as code you can write and run right here in the browser
          (JavaScript).
        </p>
      </div>

      {exercises.map(({ step, index }) => {
        const code = answers[index] ?? starter(step);
        const result = results[index];
        return (
          <div key={index} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-sans text-[11px] text-muted-foreground">Step {index + 1}</span>
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
              value={code}
              onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void run(index, code);
                }
              }}
              className="mt-2 min-h-40 w-full resize-y rounded-[4px] border border-border bg-background px-3 py-2 font-mono text-[0.85rem] leading-relaxed outline-none focus:border-primary/60"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="rounded-[3px]"
                disabled={running === index}
                onClick={() => void run(index, code)}
              >
                {running === index ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Play className="size-3.5" />
                )}
                Run code
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-[3px]"
                onClick={() => setRevealed({ ...revealed, [index]: !revealed[index] })}
              >
                {revealed[index] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {revealed[index] ? "Hide hint" : "Show hint"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-[3px]"
                onClick={() => {
                  setAnswers({ ...answers, [index]: starter(step) });
                  setResults((prev) => ({ ...prev, [index]: undefined as unknown as RunResult }));
                }}
              >
                <Trash2 className="size-3.5" />
                Reset
              </Button>
              <span className="font-sans text-[11px] text-muted-foreground">⌘/Ctrl + Enter to run</span>
            </div>

            {result && (
              <div className="mt-3 rounded-[4px] border border-border bg-foreground/[0.04] p-3">
                <div className="flex items-center justify-between font-sans text-[11px] text-muted-foreground">
                  <span>Output</span>
                  <span>{result.durationMs} ms</span>
                </div>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-mono text-[0.8rem] leading-relaxed">
                  {result.error
                    ? [...result.logs, result.error].join("\n")
                    : result.logs.join("\n") || "(no output — use console.log to print a value)"}
                </pre>
                {result.error && (
                  <p className="mt-2 font-sans text-[11px] text-destructive">
                    Your code threw an error — fix it and run again.
                  </p>
                )}
              </div>
            )}

            {revealed[index] && (
              <p className="mt-3 border-t border-border pt-3 font-sans text-sm text-muted-foreground">
                {step.narration}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
