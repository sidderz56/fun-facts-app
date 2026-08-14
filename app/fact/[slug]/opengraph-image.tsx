import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function resolveDisplayText(slug: string): Promise<string> {
  const fact = await prisma.fact.findUnique({ where: { shareSlug: slug } });
  if (!fact) return "Fun Fact";
  if (fact.active) return fact.text;

  if (fact.supersededById) {
    const replacement = await prisma.fact.findUnique({ where: { id: fact.supersededById } });
    if (replacement) return replacement.text;
  }

  return "This fact has been retired.";
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawText = await resolveDisplayText(slug);
  const text = rawText.length > 220 ? `${rawText.slice(0, 220).trimEnd()}…` : rawText;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
          color: "white",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 32,
            opacity: 0.6,
            marginBottom: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Fun Fact
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>
          {text}
        </div>
      </div>
    ),
    {
      ...size,
      // Immutable per fact (spec 4.4) — cache aggressively.
      headers: { "Cache-Control": "public, immutable, max-age=31536000" },
    }
  );
}
