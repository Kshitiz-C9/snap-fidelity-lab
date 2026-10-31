import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ListChecks } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { StepPlayer } from "@/components/explainer/StepPlayer";
import { PracticeSet } from "@/components/explainer/PracticeSet";
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
    <div className="space-y-12">
      <header className="border-b border-border pb-8">
        <span className="kicker">{String(data.template_type).replace(/_/g, " ")}</span>
        <h1 className="mt-3 max-w-4xl font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight sm:text-[3.25rem]">
          {data.title}
        </h1>
        <p className="mt-4 max-w-[68ch] font-sans text-base leading-relaxed text-muted-foreground">
          {data.summary}
        </p>
      </header>

      <StepPlayer steps={steps} />


      <Tabs defaultValue="knowledge">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="knowledge" className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 font-sans text-sm text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">Knowledge DNA</TabsTrigger>
          <TabsTrigger value="practice" className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 font-sans text-sm text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="mt-8 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <ListChecks className="size-4 " />
              Prerequisites
            </h2>
            <ol className="mt-5 border-l border-foreground">
              {prerequisites.map((p, i) => (
                <li key={i} className="relative border-b border-border py-3 pl-5 text-sm last:border-b-0">
                  <span className="absolute -left-[4.5px] top-[1.15rem] size-2 rounded-full bg-foreground" />
                  <span className="font-medium">{p.topic}</span>
                  <span className="block text-muted-foreground">{p.why}</span>
                </li>
              ))}
              {!prerequisites.length && (
                <li className="py-3 pl-5 text-sm text-muted-foreground">None detected.</li>
              )}
            </ol>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <AlertTriangle className="size-4 " />
              Revision flags
            </h2>
            <ul className="mt-4 space-y-3">
              {flags.map((f, i) => (
                <li key={i} className="border border-dashed border-foreground/60 px-4 py-3 text-sm">
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
          <div>
            <h3 className="font-display text-xl font-bold">Check your understanding</h3>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Multiple-choice questions drawn from the same source.
            </p>
            <Link
              to="/quiz/$id"
              params={{ id }}
              className="mt-3 inline-block rounded-none bg-primary px-4 py-2 font-sans text-xs text-primary-foreground"
            >
              Take the chapter quiz
            </Link>
            <div className="mt-4">
              <PracticeSet questions={questions} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}