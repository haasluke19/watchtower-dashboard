import { NextRequest, NextResponse } from "next/server";
const COOKIE = "watchtower_auth";
async function expected() {
  const raw = `${process.env.DASHBOARD_PASSWORD || ""}:${process.env.AUTH_SECRET || ""}`;
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/_next") || p === "/favicon.ico" || p === "/login" || p === "/api/login") return NextResponse.next();
  const token = req.cookies.get(COOKIE)?.value;
  if (!process.env.DASHBOARD_PASSWORD || !process.env.AUTH_SECRET || token !== await expected()) {
    if (p.startsWith("/api/")) return NextResponse.json({error:"unauthorized"},{status:401});
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
