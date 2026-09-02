import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload as UploadIcon,
  Wand2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  appendDocumentChunk,
  createDocument,
  createDocumentDraft,
  finalizeDocument,
  generateExplainer,
} from "@/lib/conceptlens.functions";

/** Manual textarea limit only — uploaded PDFs are not bound by this. */
const MAX_TEXT_CHARS = 120000;
/** Characters per upload request; the document is streamed up in these pieces. */
const CHUNK_CHARS = 40000;

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "New explainer — ConceptLens" },
      {
        name: "description",
        content:
          "Upload a PDF or paste study material and generate an animated visual explainer with concept map and practice questions.",
      },
      { property: "og:title", content: "New explainer — ConceptLens" },
      {
        property: "og:description",
        content: "Generate a visual explainer from your own study material.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  "Reading the document",
  "Extracting concept schema",
  "Composing animation steps",
  "Writing practice questions",
];

type Phase = "idle" | "uploading" | "extracting" | "processing" | "ready" | "error";

type UploadedDoc = {
  documentId: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  charCount: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadPage() {
  const navigate = useNavigate();
  const create = useServerFn(createDocument);
  const draft = useServerFn(createDocumentDraft);
  const appendChunk = useServerFn(appendDocumentChunk);
  const finalize = useServerFn(finalizeDocument);
  const generate = useServerFn(generateExplainer);

  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<string>("");
  const [uploaded, setUploaded] = useState<UploadedDoc | null>(null);
  const [failure, setFailure] = useState<string>("");

  /** Long PDF uploads can outlive the access token; refresh and retry once. */
  async function withAuthRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/unauthor|invalid token|jwt|expired/i.test(message)) throw error;
      await supabase.auth.refreshSession();
      return await fn();
    }
  }

  async function extractPdfPages(file: File) {

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const text = await page.getTextContent();
      pages.push(
        text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      );
      if (i % 5 === 0 || i === doc.numPages) {
        setProgress(`Processing ${i} of ${doc.numPages} pages…`);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    return pages;
  }

  /** Group pages into page-aligned chunks that never split a page in half. */
  function buildChunks(pages: string[]) {
    const chunks: { content: string; pageStart: number; pageEnd: number }[] = [];
    let buffer = "";
    let start = 1;
    pages.forEach((text, index) => {
      const pageNo = index + 1;
      if (!text) return;
      const piece = `${buffer ? "\n\n" : ""}[page ${pageNo}]\n${text}`;
      if (buffer.length + piece.length > CHUNK_CHARS && buffer) {
        chunks.push({ content: buffer, pageStart: start, pageEnd: pageNo - 1 });
        buffer = `[page ${pageNo}]\n${text}`;
        start = pageNo;
      } else {
        if (!buffer) start = pageNo;
        buffer += piece;
      }
    });
    if (buffer.trim()) {
      chunks.push({ content: buffer, pageStart: start, pageEnd: pages.length });
    }
    return chunks;
  }

  async function onFile(file: File) {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    setFailure("");
    setUploaded(null);

    if (!isPdf) {
      // Plain text / markdown keeps the original paste-into-textarea behaviour.
      setPhase("extracting");
      setProgress("Reading file…");
      try {
        const text = await file.text();
        setContent(text.slice(0, MAX_TEXT_CHARS));
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
        setPhase("idle");
        setProgress("");
      } catch {
        setPhase("error");
        setFailure("Could not read that file.");
      }
      return;
    }

    try {
      setPhase("extracting");
      setProgress("Extracting text…");
      const pages = await extractPdfPages(file);
      const total = pages.join("").replace(/\s/g, "").length;
      if (total < 200) {
        setPhase("error");
        setFailure(
          "Unable to extract text from this PDF. This may be a scanned or image-only document — OCR would be required, or you can paste the text below instead.",
        );
        return;
      }

      const chunks = buildChunks(pages);
      const charCount = chunks.reduce((sum, c) => sum + c.content.length, 0);
      const docTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");
      if (!title.trim()) setTitle(docTitle);

      setPhase("uploading");
      setProgress("Uploading document…");
      const { id } = await withAuthRetry(() =>
        draft({
          data: {
          title: docTitle,
          sourceType: "pdf",
          fileName: file.name,
          fileSize: file.size,
            pageCount: pages.length,
          },
        }),
      );

      setPhase("processing");
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!;
        setProgress(`Uploading section ${i + 1} of ${chunks.length}…`);
        await withAuthRetry(() =>
          appendChunk({
            data: {
              documentId: id,
              chunkIndex: i,
              pageStart: chunk.pageStart,
              pageEnd: chunk.pageEnd,
              content: chunk.content,
            },
          }),
        );
      }

      await withAuthRetry(() =>
        finalize({
          data: {
            documentId: id,
            charCount,
            preview: chunks[0]!.content.slice(0, 4000),
          },
        }),
      );

      setUploaded({
        documentId: id,
        fileName: file.name,
        fileSize: file.size,
        pageCount: pages.length,
        charCount,
      });
      setPhase("ready");
      setProgress("");
      toast.success("Document processed successfully");
    } catch (error) {
      setPhase("error");
      const message = error instanceof Error ? error.message : "";
      if (/password/i.test(message)) {
        setFailure("This PDF is password-protected. Remove the password and try again.");
      } else if (/invalid|corrupt|structure/i.test(message)) {
        setFailure("This PDF appears to be corrupted and could not be read.");
      } else {
        setFailure(
          "Something went wrong while processing this document. Please try again or paste the text below.",
        );
      }
    }
  }

  function clearFile() {
    setUploaded(null);
    setPhase("idle");
    setProgress("");
    setFailure("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function run() {
    const manual = content.trim();
    if (!uploaded && manual.length < 200) {
      toast.error("Upload a PDF or add at least 200 characters of source material.");
      return;
    }
    setBusy(true);
    setStage(0);
    const ticker = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      4000,
    );
    try {
      const documentId = uploaded
        ? uploaded.documentId
        : (
            await create({
              data: {
                title: title.trim() || "Untitled document",
                content: manual.slice(0, MAX_TEXT_CHARS),
                sourceType: "text",
              },
            })
          ).id;

      const explainer = await generate({
        data: {
          documentId,
          ...(uploaded && manual ? { extraNotes: manual.slice(0, 20000) } : {}),
        },
      });
      toast.success("Explainer ready");
      navigate({ to: "/explainer/$id", params: { id: explainer.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      clearInterval(ticker);
      setBusy(false);
    }
  }

  const working = phase === "extracting" || phase === "uploading" || phase === "processing";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">New explainer</h1>
      <p className="mt-2 text-muted-foreground">
        Upload a PDF of any length, or paste a chapter, paper or lecture transcript.
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

        <div className="space-y-2">
          <Label>Uploaded document</Label>

          {uploaded ? (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{uploaded.fileName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(uploaded.fileSize)} • {uploaded.pageCount} pages •{" "}
                    {uploaded.charCount.toLocaleString()} characters
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                    <CheckCircle2 className="size-3.5" />
                    Document processed successfully
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInput.current?.click()}
                  >
                    Replace
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearFile}>
                    <X className="size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={working}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-70"
            >
              {working ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}
              {working ? progress || "Working…" : "Upload .pdf / .txt / .md"}
            </button>
          )}

          {failure ? (
            <p className="text-xs text-destructive">{failure}</p>
          ) : null}

          <input
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf,.txt,.md,.markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </div>

        <div className="space-y-1.5 border-t border-border pt-5">
          <Label htmlFor="content">
            {uploaded ? "Additional notes (optional)" : "Source text"}
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_TEXT_CHARS))}
            rows={uploaded ? 5 : 14}
            placeholder={
              uploaded
                ? "Optional: focus areas or extra context for this document…"
                : "Paste the material you want explained…"
            }
            className="font-mono text-xs leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            {content.length.toLocaleString()} characters typed
            {uploaded ? " (in addition to the uploaded document)" : ""}
          </p>
        </div>

        <Button onClick={run} disabled={busy || working} size="lg" className="w-full">
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
