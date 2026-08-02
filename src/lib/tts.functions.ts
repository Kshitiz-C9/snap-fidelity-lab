import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const narrate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        text: z.string().min(1).max(4000),
        voice: z.string().default("alloy"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Narration is not configured for this project.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice,
        response_format: "mp3",
        instructions:
          "Speak as a calm, engaging science documentary narrator. Clear pacing, warm tone.",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      if (res.status === 429) throw new Error("Narration rate limited, try again shortly.");
      throw new Error(`Narration failed: ${res.status} ${detail.slice(0, 200)}`);
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buffer.length; i += 8192) {
      binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
    }
    return { audio: btoa(binary), mimeType: "audio/mpeg" };
  });