import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import {
  createLovableAiGatewayProvider,
  requireLovableApiKey,
} from "./ai-gateway.server";
import { explainerSchema, type ExplainerPayload } from "./explainer-schema";
import { MODEL, SYSTEM_PROMPT, NOTES_SYSTEM_PROMPT } from "./conceptlens-prompts";

/** Max characters processed in one AI pass before map-reduce kicks in. */
const PASS_CHAR_BUDGET = 50000;
const PREVIEW_CHARS = 4000;

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        content: z.string().min(200).max(200000),
        sourceType: z.string().default("text"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        title: data.title,
        content: data.content,
        source_type: data.sourceType,
        char_count: data.content.length,
        status: "ready",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: chunkError } = await context.supabase
      .from("document_chunks")
      .insert({
        document_id: row.id,
        user_id: context.userId,
        chunk_index: 0,
        content: data.content,
      });
    if (chunkError) throw new Error(chunkError.message);

    return { id: row.id as string };
  });

/** Step 1 of the large-document pipeline: reserve a document row. */
export const createDocumentDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        sourceType: z.string().default("pdf"),
        fileName: z.string().max(300).optional(),
        fileSize: z.number().int().nonnegative().optional(),
        pageCount: z.number().int().nonnegative().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        title: data.title,
        content: "",
        source_type: data.sourceType,
        char_count: 0,
        status: "processing",
        file_name: data.fileName ?? null,
        file_size: data.fileSize ?? null,
        page_count: data.pageCount ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

/** Step 2: stream the extracted text up one page-aligned chunk at a time. */
export const appendDocumentChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        documentId: z.string().uuid(),
        chunkIndex: z.number().int().nonnegative(),
        pageStart: z.number().int().nonnegative().optional(),
        pageEnd: z.number().int().nonnegative().optional(),
        content: z.string().min(1).max(200000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("document_chunks").upsert(
      {
        document_id: data.documentId,
        user_id: context.userId,
        chunk_index: data.chunkIndex,
        page_start: data.pageStart ?? null,
        page_end: data.pageEnd ?? null,
        content: data.content,
      },
      { onConflict: "document_id,chunk_index" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Step 3: mark the document ready and record a short preview + totals. */
export const finalizeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        documentId: z.string().uuid(),
        charCount: z.number().int().nonnegative(),
        preview: z.string().max(PREVIEW_CHARS).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("documents")
      .update({
        char_count: data.charCount,
        content: data.preview,
        status: "ready",
      })
      .eq("id", data.documentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function loadDocumentText(
  supabase: { from: (t: string) => any },
  documentId: string,
) {
  const { data, error } = await supabase
    .from("document_chunks")
    .select("chunk_index, page_start, page_end, content")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    chunk_index: number;
    page_start: number | null;
    page_end: number | null;
    content: string;
  }>;
}

function batchChunks(
  chunks: Array<{ page_start: number | null; page_end: number | null; content: string }>,
) {
  const batches: string[] = [];
  let current = "";
  for (const chunk of chunks) {
    const header =
      chunk.page_start != null
        ? `\n\n[pages ${chunk.page_start}-${chunk.page_end ?? chunk.page_start}]\n`
        : "\n\n";
    const piece = header + chunk.content;
    if (current.length + piece.length > PASS_CHAR_BUDGET && current.length > 0) {
      batches.push(current);
      current = piece;
    } else {
      current += piece;
    }
    while (current.length > PASS_CHAR_BUDGET) {
      batches.push(current.slice(0, PASS_CHAR_BUDGET));
      current = current.slice(PASS_CHAR_BUDGET);
    }
  }
  if (current.trim().length > 0) batches.push(current);
  return batches;
}

export const generateExplainer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        documentId: z.string().uuid(),
        extraNotes: z.string().max(20000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: doc, error: docError } = await context.supabase
      .from("documents")
      .select("id, title, content")
      .eq("id", data.documentId)
      .single();
    if (docError || !doc) throw new Error("Document not found");

    const chunks = await loadDocumentText(context.supabase, doc.id);
    const batches = batchChunks(chunks);
    if (batches.length === 0) {
      throw new Error("This document has no extractable text to work with.");
    }

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey());
    const extra = data.extraNotes?.trim()
      ? `\n\nAdditional instructions and notes from the learner (not part of the source document):\n${data.extraNotes.trim()}`
      : "";

    // Map phase: condense each batch so the whole document reaches the final pass.
    let source: string;
    if (batches.length === 1) {
      source = batches[0]!;
    } else {
      const notes: string[] = [];
      for (let i = 0; i < batches.length; i++) {
        const result = await generateText({
          model: gateway(MODEL),
          system: NOTES_SYSTEM_PROMPT,
          maxOutputTokens: 2000,
          prompt: `Document title: ${doc.title}\nSection ${i + 1} of ${batches.length}.\n\n${batches[i]}`,
        });
        notes.push(`--- Section ${i + 1} of ${batches.length} ---\n${result.text}`);
      }
      source = notes.join("\n\n");
      if (source.length > PASS_CHAR_BUDGET) {
        // Second-level reduce for very large documents.
        const merged: string[] = [];
        for (let i = 0; i < source.length; i += PASS_CHAR_BUDGET) {
          const part = source.slice(i, i + PASS_CHAR_BUDGET);
          const result = await generateText({
            model: gateway(MODEL),
            system: NOTES_SYSTEM_PROMPT,
            maxOutputTokens: 2000,
            prompt: `Condense these section notes further, keeping the full coverage:\n\n${part}`,
          });
          merged.push(result.text);
        }
        source = merged.join("\n\n");
      }
    }

    let payload: ExplainerPayload;
    try {
      const { output } = await generateText({
        model: gateway(MODEL),
        output: Output.object({ schema: explainerSchema }),
        system: SYSTEM_PROMPT,
        maxOutputTokens: 16000,
        prompt: `Document title: ${doc.title}\n\n${
          batches.length === 1
            ? `Source text:\n${source}`
            : `The source document was processed in ${batches.length} sections. Structured notes covering the WHOLE document follow — the explainer must represent the complete document, not only its beginning.\n\n${source}`
        }${extra}`,
      });
      payload = output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error(
          "The AI could not structure this document. Try a longer or clearer source text.",
        );
      }
      throw error;
    }

    const { data: row, error } = await context.supabase
      .from("explainers")
      .insert({
        user_id: context.userId,
        document_id: doc.id,
        title: payload.title,
        summary: payload.summary,
        template_type: payload.template_type,
        status: "ready",
        steps: payload.steps,
        concepts: payload.concepts,
        relations: payload.relations,
        prerequisites: payload.prerequisites,
        revision_flags: payload.revision_flags,
        questions: payload.questions,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase
      .from("documents")
      .update({ domain: payload.domain })
      .eq("id", doc.id);

    return { id: row.id as string };
  });

export const askDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        explainerId: z.string().uuid(),
        question: z.string().min(2).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: explainer, error } = await context.supabase
      .from("explainers")
      .select("id, title, document_id")
      .eq("id", data.explainerId)
      .single();
    if (error || !explainer) throw new Error("Explainer not found");

    const chunks = await loadDocumentText(context.supabase, explainer.document_id);
    const source = chunks
      .map((c) => c.content)
      .join("\n\n")
      .slice(0, 60000);

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey());
    const result = await generateText({
      model: gateway(MODEL),
      system:
        "You answer questions strictly from the provided source document. Quote short snippets when useful. If the answer is not in the document, say so plainly. Keep answers under 150 words.",
      prompt: `Source document:\n${source}\n\nQuestion: ${data.question}`,
    });

    return { answer: result.text };
  });
