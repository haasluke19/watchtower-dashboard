import { NextRequest, NextResponse } from "next/server";
import { authValue, COOKIE_NAME } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}));
  if (!process.env.DASHBOARD_PASSWORD || body.password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({error:"Invalid password"},{status:401});
  }
  const res = NextResponse.json({ok:true});
  res.cookies.set(COOKIE_NAME, authValue(), {httpOnly:true, secure:true, sameSite:"strict", path:"/", maxAge:60*60*24*30});
  return res;
}
