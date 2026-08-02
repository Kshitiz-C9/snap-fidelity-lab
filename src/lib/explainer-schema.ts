import { z } from "zod";

export const explainerSchema = z.object({
  title: z.string(),
  summary: z.string(),
  domain: z.string(),
  template_type: z.string(),
  steps: z.array(
    z.object({
      label: z.string(),
      narration: z.string(),
      visual: z.string(),
      entities: z.array(z.string()),
    }),
  ),
  concepts: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  relations: z.array(
    z.object({ from: z.string(), to: z.string(), label: z.string() }),
  ),
  prerequisites: z.array(z.object({ topic: z.string(), why: z.string() })),
  revision_flags: z.array(z.object({ claim: z.string(), reason: z.string() })),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answer_index: z.number(),
      explanation: z.string(),
      difficulty: z.string(),
    }),
  ),
});

export type ExplainerPayload = z.infer<typeof explainerSchema>;

export type ExplainerStep = ExplainerPayload["steps"][number];
export type ExplainerConcept = ExplainerPayload["concepts"][number];
export type ExplainerRelation = ExplainerPayload["relations"][number];
export type ExplainerPrereq = ExplainerPayload["prerequisites"][number];
export type ExplainerFlag = ExplainerPayload["revision_flags"][number];
export type ExplainerQuestion = ExplainerPayload["questions"][number];