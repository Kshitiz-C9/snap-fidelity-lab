export type RunResult = {
  logs: string[];
  error?: string;
  durationMs: number;
};

const WORKER_SRC = `
self.onmessage = (e) => {
  const logs = [];
  const fmt = (v) => {
    try {
      if (typeof v === "string") return v;
      if (v instanceof Error) return v.name + ": " + v.message;
      return JSON.stringify(v, (_k, val) => (typeof val === "bigint" ? String(val) : val), 2);
    } catch { return String(v); }
  };
  const push = (prefix) => (...args) => {
    logs.push(prefix + args.map(fmt).join(" "));
    if (logs.length > 500) { logs.push("… output truncated"); throw new Error("Too much output"); }
  };
  self.console = { log: push(""), info: push(""), warn: push("warn: "), error: push("error: "), debug: push("") };
  let error;
  try {
    const result = new Function('"use strict";' + e.data.code)();
    if (result !== undefined) logs.push("=> " + fmt(result));
  } catch (err) {
    error = err && err.message ? (err.name || "Error") + ": " + err.message : String(err);
  }
  self.postMessage({ logs, error });
};
`;

/** Runs untrusted JS in a throwaway Web Worker with a hard timeout. */
export async function runJavaScript(code: string, timeoutMs = 4000): Promise<RunResult> {
  const started = performance.now();
  const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  const worker = new Worker(url);

  return new Promise<RunResult>((resolve) => {
    const done = (res: Omit<RunResult, "durationMs">) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ ...res, durationMs: Math.round(performance.now() - started) });
    };
    const timer = setTimeout(
      () => done({ logs: [], error: `Timed out after ${timeoutMs / 1000}s — check for an infinite loop.` }),
      timeoutMs,
    );
    worker.onmessage = (e: MessageEvent) => done(e.data as { logs: string[]; error?: string });
    worker.onerror = (e) => done({ logs: [], error: e.message || "Your code could not be executed." });
    worker.postMessage({ code });
  });
}
