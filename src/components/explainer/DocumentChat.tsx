import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askDocument } from "@/lib/conceptlens.functions";

type Turn = { role: "user" | "assistant"; text: string };

export function DocumentChat({ explainerId }: { explainerId: string }) {
  const ask = useServerFn(askDocument);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = value.trim();
    if (!question || busy) return;
    setTurns((t) => [...t, { role: "user", text: question }]);
    setValue("");
    setBusy(true);
    try {
      const res = await ask({ data: { explainerId, question } });
      setTurns((t) => [...t, { role: "assistant", text: res.answer }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not answer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel flex h-[26rem] flex-col p-5">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {turns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask anything about the source document — answers stay grounded in it.
          </p>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              t.role === "user"
                ? "ml-auto bg-primary/15 text-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            {t.text}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Reading the document…
          </div>
        )}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Why does this step matter?"
        />
        <Button type="submit" size="icon" disabled={busy} aria-label="Send question">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}