import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Upload as UploadIcon, Wand2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDocument, generateExplainer } from "@/lib/conceptlens.functions";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "New explainer — ConceptLens" },
      {
        name: "description",
        content:
          "Paste or upload study material and generate an animated visual explainer with concept map and practice questions.",
      },
      { property: "og:title", content: "New explainer — ConceptLens" },
      {
        property: "og:description",
        content: "Generate a visual explainer from your own study material.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <UploadPage />
      </RequireAuth>
    </AppShell>
  ),
});

const STAGES = [
  "Ingesting document",
  "Extracting concept schema",
  "Composing animation steps",
  "Writing practice questions",
];

function UploadPage() {
  const navigate = useNavigate();
  const create = useServerFn(createDocument);
  const generate = useServerFn(generateExplainer);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [stage, setStage] = useState(0);

  async function extractPdf(file: File) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;
    const doc = await pdfjs.getDocument({
      data: await file.arrayBuffer(),
    }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    }
    return pages.filter(Boolean).join("\n\n");
  }

  async function onFile(file: File) {
    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    setParsing(true);
    try {
      const text = isPdf ? await extractPdf(file) : await file.text();
      if (isPdf && text.trim().length < 200) {
        toast.error(
          "Couldn't read enough text from this PDF — it may be a scanned image. Paste the text instead.",
        );
        return;
      }
      const clipped = text.length > MAX_CHARS;
      setContent(clipped ? text.slice(0, MAX_CHARS) : text);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      if (clipped) {
        toast.warning(
          `That file is long — only the first ${MAX_CHARS.toLocaleString()} characters were kept.`,
        );
      } else if (isPdf) {
        toast.success(`Extracted text from ${file.name}`);
      }
    } catch {
      toast.error("Could not read that file.");
    } finally {
      setParsing(false);
    }
  }

  async function run() {
    if (content.trim().length < 200) {
      toast.error("Add at least 200 characters of source material.");
      return;
    }
    setBusy(true);
    setStage(0);
    const ticker = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      4000,
    );
    try {
      const doc = await create({
        data: { title: title.trim() || "Untitled document", content, sourceType: "text" },
      });
      const explainer = await generate({ data: { documentId: doc.id } });
      toast.success("Explainer ready");
      navigate({ to: "/explainer/$id", params: { id: explainer.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      clearInterval(ticker);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">New explainer</h1>
      <p className="mt-2 text-muted-foreground">
        Paste a chapter, paper or lecture transcript. PDF, plain text and markdown
        files can be dropped in directly.
      </p>

      <div className="panel mt-8 space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Document title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dijkstra's shortest path algorithm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-end justify-between">
            <Label htmlFor="content">Source text</Label>
            <label className="cursor-pointer text-xs text-primary hover:underline">
              {parsing ? (
                <Loader2 className="mr-1 inline size-3.5 animate-spin" />
              ) : (
                <UploadIcon className="mr-1 inline size-3.5" />
              )}
              {parsing ? "Reading file…" : "Upload .pdf / .txt / .md"}
              <input
                type="file"
                accept=".pdf,application/pdf,.txt,.md,.markdown,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onFile(file);
                }}
              />
            </label>
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            placeholder="Paste the material you want explained…"
            className="font-mono text-xs leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            {content.length.toLocaleString()} characters
          </p>
        </div>

        <Button onClick={run} disabled={busy} size="lg" className="w-full">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {STAGES[stage]}…
            </>
          ) : (
            <>
              <Wand2 className="size-4" />
              Generate explainer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}