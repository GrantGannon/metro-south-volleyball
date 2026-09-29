import { getSnapshot, tournamentEvents } from "@/lib/snapshot";
import type { Snapshot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const onSnapshot = (snap: Snapshot) => send(`event: snapshot\ndata: ${JSON.stringify(snap)}\n\n`);
      const heartbeat = setInterval(() => send(`: ping\n\n`), 20_000);

      cleanup = () => {
        clearInterval(heartbeat);
        tournamentEvents.off("snapshot", onSnapshot);
      };

      tournamentEvents.on("snapshot", onSnapshot);
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });

      send(`retry: 3000\n\n`);
      onSnapshot(await getSnapshot());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
