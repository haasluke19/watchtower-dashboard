import { NextRequest, NextResponse } from "next/server";
import { db, instanceId } from "@/lib/mongo";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const d = await db();
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim().slice(0, 64);
  const priority = sp.get("priority") || "";
  const state = sp.get("state") || "";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = 50;
  const filter: any = { instance_id: instanceId() };
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (q) filter.$or = [
    { name: { $regex: escaped, $options: "i" } },
    { label: { $regex: escaped, $options: "i" } },
    { current_name: { $regex: escaped, $options: "i" } },
    { expected_uuid: { $regex: escaped, $options: "i" } },
  ];
  if (["critical", "high", "normal", "low"].includes(priority)) filter.priority = priority;
  if (["held", "relinquished"].includes(state)) filter.state = state;

  const [items, total] = await Promise.all([
    d.collection("targets")
      .find(filter)
      .sort({ priority: 1, state: 1, name: 1, label: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    d.collection("targets").countDocuments(filter),
  ]);

  return NextResponse.json({
    items: items.map(x => ({ ...x, _id: String(x._id) })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
