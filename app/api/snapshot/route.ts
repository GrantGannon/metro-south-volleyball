import { getSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getSnapshot();
  return Response.json(snap, { headers: { "Cache-Control": "no-store" } });
}
