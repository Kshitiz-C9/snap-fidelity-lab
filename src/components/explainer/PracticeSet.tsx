import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExplainerQuestion } from "@/lib/explainer-schema";

export function PracticeSet({ questions }: { questions: ExplainerQuestion[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});

  if (!questions.length)
    return <p className="text-sm text-muted-foreground">No questions generated.</p>;

  const answered = Object.keys(picked).length;
  const correct = questions.reduce(
    (n, q, i) => n + (picked[i] === q.answer_index ? 1 : 0),
    0,
  );
  const pct = answered ? Math.round((correct / questions.length) * 100) : 0;
  const band =
    pct >= 80
      ? { label: "Excellent", color: "#4E7C59" }
      : pct >= 60
        ? { label: "Good", color: "#7C9A4E" }
        : pct >= 40
          ? { label: "Needs review", color: "#E8A33D" }
          : { label: "Weak — revise this chapter", color: "#C2492F" };

  return (
    <div className="space-y-4">
      <div className="border border-border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-display text-lg font-bold">Your score</h4>
          <span className="font-sans text-xs text-muted-foreground">
            {answered} of {questions.length} answered
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: band.color }}
          />
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold" style={{ color: band.color }}>
            {correct}/{questions.length}
          </span>
          <span className="font-sans text-sm font-medium" style={{ color: band.color }}>
            {band.label} · {pct}%
          </span>
        </div>
        {answered > 0 && (
          <button
            onClick={() => setPicked({})}
            className="mt-4 rounded-[4px] border border-border px-3 py-1.5 font-sans text-xs hover:border-primary/50"
          >
            Reset answers
          </button>
        )}
      </div>
      {questions.map((q, qi) => {
        const choice = picked[qi];
        return (
          <div key={qi} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold leading-snug">{q.question}</h3>
              <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 font-sans text-[11px] font-normal capitalize">
                {q.difficulty}
              </span>

            </div>
            <div className="mt-4 grid gap-2">
              {q.options.map((opt, oi) => {
                const answered = choice !== undefined;
                const isCorrect = oi === q.answer_index;
                const isPicked = choice === oi;
                return (
                  <button
                    key={oi}
                    disabled={answered}
                    onClick={() => setPicked({ ...picked, [qi]: oi })}
                    className={`flex items-center justify-between rounded-[4px] border px-3 py-2 text-left text-sm transition-colors ${
                      answered && isCorrect
                        ? "border-accent bg-accent/10"
                        : answered && isPicked
                          ? "border-destructive bg-destructive/10"
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    {opt}
                    {answered && isCorrect && <Check className="size-4 text-accent" />}
                    {answered && isPicked && !isCorrect && (
                      <X className="size-4 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>
            {choice !== undefined && (
              <p className="mt-3 font-sans text-sm text-muted-foreground">{q.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}