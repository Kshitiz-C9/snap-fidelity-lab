import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ListChecks } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { PracticeSet } from "@/components/explainer/PracticeSet";
import { StepExercises } from "@/components/explainer/StepExercises";
import type {
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
  const flags = (data.revision_flags ?? []) as ExplainerFlag[];
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

        <TabsContent value="knowledge" className="mt-5 grid gap-4 md:grid-cols-2">
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
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <AlertTriangle className="size-4 text-accent" />
              Revision flags
            </h2>
            <ul className="mt-4 space-y-3">
              {flags.map((f, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{f.claim}</span>
                  <span className="block text-muted-foreground">{f.reason}</span>
                </li>
              ))}
              {!flags.length && (
                <li className="text-sm text-muted-foreground">
                  Nothing in this document looked outdated or unsupported.
                </li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="mt-5 space-y-8">
          <StepExercises steps={steps} />
          <div className="border-t border-border pt-6">
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