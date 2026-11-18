import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, FileText, Sparkles, Waypoints } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConceptLens — AI visual explainers from your documents" },
      {
        name: "description",
        content:
          "Upload a paper, chapter or set of notes and get an animated step-by-step explainer, a concept map, prerequisites and practice questions.",
      },
      { property: "og:title", content: "ConceptLens — visual explainers from documents" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content:
          "Turn dense study material into animated explainers, concept maps and practice questions.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Ingest",
    body: "Paste or upload a chapter, paper or lecture transcript. ConceptLens reads it end to end.",
  },
  {
    icon: Sparkles,
    title: "Extract",
    body: "A structured concept schema is pulled out: steps, entities, relations, claims and prerequisites.",
  },
  {
    icon: Boxes,
    title: "Animate",
    body: "Steps become a narrated, animated explainer you can scrub through frame by frame.",
  },
  {
    icon: Waypoints,
    title: "Explore",
    body: "Concept map, prerequisite trail, revision flags and generated practice questions.",
  },
];

function Index() {
  return (
    <AppShell>
      <section className="-mx-5 -mt-10 px-5 pb-16 pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 border-l-2 border-primary py-1 pl-3 text-sm text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Document in, explainer out
          </span>
          <h1 className="mt-6 max-w-2xl text-balance text-5xl leading-[1.08] sm:text-6xl">
            See the concept, not just the{" "}
            <span className="text-primary">paragraph</span>.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
            ConceptLens turns dense study material into an animated, narrated
            explainer with a concept map, prerequisites and practice questions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/upload">
                Generate an explainer
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/library">Open library</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-border" />

      <section className="grid gap-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="panel p-5">
            <f.icon className="size-4 text-primary" />
            <h2 className="mt-3 font-display text-xl">{f.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
