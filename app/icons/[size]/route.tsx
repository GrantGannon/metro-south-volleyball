import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

/** Home-screen icon: a sheet card split by the net, "MS" above the tape. */
export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(req.url).searchParams.has("maskable");
  const pad = maskable ? size * 0.14 : size * 0.06;
  const u = (n: number) => (n / 512) * (size - pad * 2);

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#B7D0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: size - pad * 2,
            height: size - pad * 2,
            background: "#F3F7FB",
            borderRadius: u(84),
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: u(18),
              color: "#102033",
              fontSize: u(230),
              fontWeight: 900,
              letterSpacing: u(-10),
              lineHeight: 1,
            }}
          >
            MS
          </div>
          <div style={{ height: u(30), background: "#16324F", display: "flex" }} />
          <div style={{ height: u(46), background: "#D5DEE6", display: "flex" }} />
          <div style={{ flex: 0.55, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: u(52), height: u(52), borderRadius: u(8), background: "#D63A2F", display: "flex" }} />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
