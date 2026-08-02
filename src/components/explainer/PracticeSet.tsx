import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExplainerQuestion } from "@/lib/explainer-schema";
import { Badge } from "@/components/ui/badge";

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
              <h3 className="font-medium">{q.question}</h3>
              <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                {q.difficulty}
              </Badge>
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
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      answered && isCorrect
                        ? "border-primary bg-primary/10"
                        : answered && isPicked
                          ? "border-destructive bg-destructive/10"
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    {opt}
                    {answered && isCorrect && <Check className="size-4 text-primary" />}
                    {answered && isPicked && !isCorrect && (
                      <X className="size-4 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>
            {choice !== undefined && (
              <p className="mt-3 text-sm text-muted-foreground">{q.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}