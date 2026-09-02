import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Film, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Explainer library — ConceptLens" },
      {
        name: "description",
        content: "Every visual explainer you have generated from your own documents.",
      },
      { property: "og:title", content: "Explainer library — ConceptLens" },
      {
        property: "og:description",
        content: "Browse and replay your generated visual explainers.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <LibraryPage />
      </RequireAuth>
    </AppShell>
  ),
});

function LibraryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["explainers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("explainers")
        .select("id, title, summary, template_type, steps, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Library</h1>
          <p className="mt-2 text-muted-foreground">
            Your generated explainers, concept maps and practice sets.
          </p>
        </div>
        <Button asChild>
          <Link to="/upload">
            <Plus className="size-4" />
            New
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : !data?.length ? (
        <div className="panel mt-10 p-12 text-center">
          <Film className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-xl">No explainers yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Upload a chapter or paste notes and ConceptLens will build your first
            animated explainer.
          </p>
          <Button asChild className="mt-6">
            <Link to="/upload">Create one</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data.map((row) => (
            <Link
              key={row.id}
              to="/explainer/$id"
              params={{ id: row.id }}
              className="panel group p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-[3px] text-[11px] font-normal capitalize">
                  {String(row.template_type).replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(row.steps as unknown[])?.length ?? 0} steps
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl">
                {row.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {row.summary}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}