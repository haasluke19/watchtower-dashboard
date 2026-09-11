import { NextRequest, NextResponse } from "next/server";
import { db, instanceId } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const { uuid: key } = await context.params;
  const d = await db();
  const instance = instanceId();

  const target = await d.collection("targets").findOne({
    instance_id: instance,
    $or: [{ name: key }, { uuid: key }, { expected_uuid: key }, { label: key }],
  });

  if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  const name = target.name || target.label;
  const holder = target.expected_uuid || target.uuid;
  const changes = await d.collection("name_changes")
    .find({
      instance_id: instance,
      $or: [
        ...(name ? [{ name }, { old_name: name }] : []),
        ...(holder ? [{ uuid: holder }, { old_holder_uuid: holder }] : []),
      ],
    })
    .sort({ detected_at: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({
    target: { ...target, _id: String(target._id) },
    changes: changes.map(x => ({ ...x, _id: String(x._id) })),
  });
}
