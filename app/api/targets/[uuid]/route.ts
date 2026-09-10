import { NextRequest, NextResponse } from "next/server";
import { db, instanceId } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await context.params;
  const d = await db();
  const instance = instanceId();

  const [target, changes] = await Promise.all([
    d.collection("targets").findOne({ instance_id: instance, uuid }),
    d.collection("name_changes").find({ instance_id: instance, uuid }).sort({ detected_at: -1 }).limit(100).toArray(),
  ]);

  if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  return NextResponse.json({
    target: { ...target, _id: String(target._id) },
    changes: changes.map(x => ({ ...x, _id: String(x._id) })),
  });
}
