import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ListChecks, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { StepPlayer } from "@/components/explainer/StepPlayer";
import { PracticeSet } from "@/components/explainer/PracticeSet";
import type {
  ExplainerConcept,
  ExplainerFlag,
  ExplainerPrereq,
  ExplainerQuestion,
  ExplainerStep,
} from "@/lib/explainer-schema";

export const Route = createFileRoute("/explainer/$id")({
  head: () => ({
    meta: [
      { title: "Explainer — ConceptLens" },
      {
        name: "description",
        content:
          "Animated step-by-step explainer with concept map, prerequisites, practice questions and grounded Q&A.",
      },
      { property: "og:title", content: "Explainer — ConceptLens" },
      {
        property: "og:description",
        content: "Watch, explore and practise a generated visual explainer.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <ExplainerPage />
      </RequireAuth>
    </AppShell>
  ),
});

function ExplainerPage() {
  const { id } = Route.useParams();
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-muted-foreground">This explainer could not be loaded.</p>;
  }

  const steps = (data.steps ?? []) as ExplainerStep[];
  const prerequisites = (data.prerequisites ?? []) as ExplainerPrereq[];
  const concepts = (data.concepts ?? []) as ExplainerConcept[];
  const rawFlags = (data.revision_flags ?? []) as ExplainerFlag[];
  const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const flags = [...rawFlags].sort(
    (a, b) => (rank[a.priority ?? "medium"] ?? 1) - (rank[b.priority ?? "medium"] ?? 1),
  );
  const questions = (data.questions ?? []) as ExplainerQuestion[];

  return (
    <div className="space-y-8">
      <header>
        <span className="rounded-full bg-primary/12 px-2.5 py-1 font-sans text-[11px] font-normal capitalize text-foreground/80">
          {String(data.template_type).replace(/_/g, " ")}
        </span>
        <h1 className="mt-3 font-display text-[2.75rem] font-bold leading-[1.1] tracking-tight">
          {data.title}
        </h1>
        <p className="mt-2 max-w-3xl font-sans text-sm font-normal leading-relaxed text-muted-foreground">
          {data.summary}
        </p>
      </header>


      <StepPlayer steps={steps} templateType={String(data.template_type ?? "process_flow")} />

      <Tabs defaultValue="knowledge">
        <TabsList>
          <TabsTrigger value="knowledge">Knowledge DNA</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="mt-5 space-y-4">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <AlertTriangle className="size-4 text-accent" />
              Revision flags
            </h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Sorted by how urgently they need a second pass.
            </p>
            <ul className="mt-4 space-y-3">
              {flags.map((f, i) => {
                const priority = f.priority ?? "medium";
                const high = priority === "high";
                return (
                  <li
                    key={i}
                    className={`border-l-2 py-1 pl-4 ${
                      high ? "border-accent bg-accent/[0.07]" : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-[15px] font-medium">{f.claim}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide ${
                          high
                            ? "bg-accent/20 text-accent"
                            : priority === "medium"
                              ? "bg-primary/12 text-foreground/70"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {high && <Flame className="size-3" />}
                        {priority} priority
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-sm text-muted-foreground">{f.reason}</p>
                    {f.revise && (
                      <p className="mt-1 font-sans text-sm text-foreground/80">Revise: {f.revise}</p>
                    )}
                  </li>
                );
              })}
              {!flags.length && (
                <li className="text-sm text-muted-foreground">
                  Nothing in this document needs a flagged revision pass.
                </li>
              )}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-xl font-bold">Key concepts</h2>
            <ul className="mt-4 divide-y divide-border">
              {concepts.map((c, i) => (
                <li key={i} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-display text-lg font-bold leading-snug">{c.label}</h3>
                  <p className="mt-1 font-sans text-sm text-muted-foreground">{c.description}</p>
                  {c.detail && (
                    <p className="mt-2 font-sans text-[0.95rem] leading-relaxed">{c.detail}</p>
                  )}
                  {c.example && (
                    <p className="mt-2 border-l-2 border-primary bg-primary/[0.08] px-3 py-2 font-mono text-[0.82rem] leading-relaxed">
                      {c.example}
                    </p>
                  )}
                </li>
              ))}
              {!concepts.length && (
                <li className="py-2 text-sm text-muted-foreground">No concepts extracted.</li>
              )}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <ListChecks className="size-4 text-primary" />
              Prerequisites
            </h2>
            <ul className="mt-4 space-y-3">
              {prerequisites.map((p, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{p.topic}</span>
                  <span className="block text-muted-foreground">{p.why}</span>
                </li>
              ))}
              {!prerequisites.length && (
                <li className="text-sm text-muted-foreground">None detected.</li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="mt-5 space-y-8">
          <div>
            <h3 className="font-display text-xl font-bold">Check your understanding</h3>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Multiple-choice questions drawn from the same source.
            </p>
            <div className="mt-4">
              <PracticeSet questions={questions} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}