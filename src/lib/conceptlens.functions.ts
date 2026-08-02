import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import {
  createLovableAiGatewayProvider,
  requireLovableApiKey,
} from "./ai-gateway.server";
import { explainerSchema, type ExplainerPayload } from "./explainer-schema";
import { MODEL, SYSTEM_PROMPT } from "./conceptlens-prompts";

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        content: z.string().min(200).max(120000),
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
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const generateExplainer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ documentId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: doc, error: docError } = await context.supabase
      .from("documents")
      .select("id, title, content")
      .eq("id", data.documentId)
      .single();
    if (docError || !doc) throw new Error("Document not found");

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey());
    const source = (doc.content as string).slice(0, 60000);

    let payload: ExplainerPayload;
    try {
      const { output } = await generateText({
        model: gateway(MODEL),
        output: Output.object({ schema: explainerSchema }),
        system: SYSTEM_PROMPT,
        prompt: `Document title: ${doc.title}\n\nSource text:\n${source}`,
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

    const { data: doc } = await context.supabase
      .from("documents")
      .select("content")
      .eq("id", explainer.document_id)
      .single();

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey());
    const result = await generateText({
      model: gateway(MODEL),
      system:
        "You answer questions strictly from the provided source document. Quote short snippets when useful. If the answer is not in the document, say so plainly. Keep answers under 150 words.",
      prompt: `Source document:\n${(doc?.content ?? "").slice(0, 60000)}\n\nQuestion: ${data.question}`,
    });

    return { answer: result.text };
  });