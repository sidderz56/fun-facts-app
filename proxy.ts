import { NextRequest, NextResponse } from "next/server";
import { ANON_ID_COOKIE } from "@/lib/constants";

// This runs on every request, on the Edge runtime, so it only ever touches
// the cookie. The matching `sessions` row (and seen_fact_ids) is created
// lazily in lib/session.ts, which needs a real Postgres connection and so
// has to run in the Node.js runtime instead.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 12 months, refreshed on activity (spec 3.3)

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  // Edge runtime doesn't support Node's crypto module — use Web Crypto instead.
  const anonId = request.cookies.get(ANON_ID_COOKIE)?.value ?? crypto.randomUUID();

  response.cookies.set(ANON_ID_COOKIE, anonId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
