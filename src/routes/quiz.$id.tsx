import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ExplainerQuestion, ExplainerStep } from "@/lib/explainer-schema";

export const Route = createFileRoute("/quiz/$id")({
  head: () => ({
    meta: [
      { title: "Chapter quiz — ConceptLens" },
      {
        name: "description",
        content:
          "Pick a chapter, answer its multiple-choice questions and get a full score report with explanations.",
      },
      { property: "og:title", content: "Chapter quiz — ConceptLens" },
      {
        property: "og:description",
        content: "Test yourself chapter by chapter and review every answer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <QuizPage />
      </RequireAuth>
    </AppShell>
  ),
});

function bandFor(pct: number) {
  if (pct >= 80) return { label: "Excellent", color: "#4E7C59" };
  if (pct >= 60) return { label: "Good", color: "#7C9A4E" };
  if (pct >= 40) return { label: "Needs review", color: "#E8A33D" };
  return { label: "Weak — revise this chapter", color: "#C2492F" };
}

/** Questions carry an optional chapter index; otherwise spread them evenly. */
function chapterOf(q: ExplainerQuestion, qi: number, total: number, chapters: number) {
  const tagged = (q as { step_index?: number }).step_index;
  if (typeof tagged === "number" && tagged >= 0 && tagged < chapters) return tagged;
  if (!chapters || !total) return 0;
  return Math.min(chapters - 1, Math.floor((qi * chapters) / total));
}

function QuizPage() {
  const { id } = Route.useParams();
  const [chapter, setChapter] = useState<number | "all">("all");
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["explainer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("explainers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const steps = (data?.steps ?? []) as ExplainerStep[];
  const allQuestions = (data?.questions ?? []) as ExplainerQuestion[];

  const questions = useMemo(
    () =>
      allQuestions
        .map((q, qi) => ({
          q,
          qi,
          chapter: chapterOf(q, qi, allQuestions.length, steps.length),
        }))
        .filter((item) => chapter === "all" || item.chapter === chapter),
    [allQuestions, steps.length, chapter],
  );

  function reset(next: number | "all") {
    setChapter(next);
    setPicked({});
    setSubmitted(false);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-muted-foreground">This quiz could not be loaded.</p>;
  }

  const answered = Object.keys(picked).length;
  const correct = questions.reduce(
    (n, { q, qi }) => n + (picked[qi] === q.answer_index ? 1 : 0),
    0,
  );
  const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const band = bandFor(pct);

  return (
    <div className="space-y-8">
      <header>
        <Link
          to="/explainer/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to explainer
        </Link>
        <h1 className="mt-3 font-display text-[2.5rem] font-bold leading-[1.1] tracking-tight">
          Quiz: {data.title}
        </h1>
        <p className="mt-2 max-w-3xl font-sans text-sm text-muted-foreground">
          Choose a chapter, answer its questions, then submit for a full score report.
        </p>
      </header>

      <section className="border-t border-border pt-6">
        <h2 className="font-display text-lg font-bold">Chapter</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", ...steps.map((_, i) => i)] as (number | "all")[]).map((c) => (
            <button
              key={String(c)}
              onClick={() => reset(c)}
              className={`rounded-full px-3 py-1.5 font-sans text-xs transition-colors ${
                chapter === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/12 text-foreground/80 hover:bg-primary/20"
              }`}
            >
              {c === "all" ? "All chapters" : `${c + 1}. ${steps[c]?.label ?? ""}`}
            </button>
          ))}
        </div>
      </section>

      {!questions.length ? (
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">
          No questions for this chapter yet. Regenerate the explainer to get a full
          question set.
        </p>
      ) : (
        <section className="space-y-4 border-t border-border pt-6">
          {questions.map(({ q, qi }, n) => {
            const choice = picked[qi];
            return (
              <div key={qi} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-bold leading-snug">
                    {n + 1}. {q.question}
                  </h3>
                  <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 font-sans text-[11px] capitalize">
                    {q.difficulty}
                  </span>
                </div>
                <div className="mt-4 grid gap-2">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.answer_index;
                    const isPicked = choice === oi;
                    return (
                      <button
                        key={oi}
                        disabled={submitted}
                        onClick={() => setPicked({ ...picked, [qi]: oi })}
                        className={`flex items-center justify-between rounded-[4px] border px-3 py-2 text-left text-sm transition-colors ${
                          submitted && isCorrect
                            ? "border-accent bg-accent/10"
                            : submitted && isPicked
                              ? "border-destructive bg-destructive/10"
                              : isPicked
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                        }`}
                      >
                        {opt}
                        {submitted && isCorrect && <Check className="size-4 text-accent" />}
                        {submitted && isPicked && !isCorrect && (
                          <X className="size-4 text-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-3 font-sans text-sm text-muted-foreground">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <div className="flex items-center gap-4">
              <Button onClick={() => setSubmitted(true)} disabled={!answered}>
                Submit answers
              </Button>
              <span className="font-sans text-xs text-muted-foreground">
                {answered} of {questions.length} answered
              </span>
            </div>
          ) : (
            <div className="border border-border p-6">
              <h2 className="font-display text-xl font-bold">Score report</h2>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: band.color }}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span
                  className="font-display text-3xl font-bold"
                  style={{ color: band.color }}
                >
                  {correct}/{questions.length}
                </span>
                <span
                  className="font-sans text-sm font-medium"
                  style={{ color: band.color }}
                >
                  {band.label} · {pct}%
                </span>
              </div>
              <ul className="mt-5 space-y-3 border-t border-border pt-5">
                {questions.map(({ q, qi }, n) => {
                  const ok = picked[qi] === q.answer_index;
                  return (
                    <li key={qi} className="font-sans text-sm">
                      <span className={ok ? "text-accent" : "text-destructive"}>
                        {ok ? "Correct" : "Incorrect"}
                      </span>
                      <span className="text-muted-foreground"> · Q{n + 1}: </span>
                      {q.question}
                      {!ok && (
                        <span className="block text-muted-foreground">
                          Answer: {q.options[q.answer_index]} — {q.explanation}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-5" variant="outline" onClick={() => reset(chapter)}>
                Retake quiz
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
