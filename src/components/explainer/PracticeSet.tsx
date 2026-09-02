import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExplainerQuestion } from "@/lib/explainer-schema";

export function PracticeSet({ questions }: { questions: ExplainerQuestion[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});

  if (!questions.length)
    return <p className="text-sm text-muted-foreground">No questions generated.</p>;

  return (
    <div className="space-y-4">
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