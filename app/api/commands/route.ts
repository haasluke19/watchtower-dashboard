import { NextRequest, NextResponse } from "next/server";
import { db, instanceId } from "@/lib/mongo";

const priorities = new Set(["critical", "high", "normal", "low"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.type !== "set_priority" || !priorities.has(body.priority)) {
    return NextResponse.json({ error: "invalid command" }, { status: 400 });
  }

  const d = await db();
  const instance = instanceId();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const uuid = typeof body.uuid === "string" ? body.uuid.trim() : "";
  if (!name && !uuid) return NextResponse.json({ error: "target required" }, { status: 400 });

  const exists = await d.collection("targets").findOne({
    instance_id: instance,
    ...(name ? { name } : { $or: [{ uuid }, { expected_uuid: uuid }] }),
  });
  if (!exists) return NextResponse.json({ error: "target not found" }, { status: 404 });

  const result = await d.collection("commands").insertOne({
    instance_id: instance,
    type: "set_priority",
    name: name || exists.name || exists.label,
    uuid: uuid || exists.expected_uuid || exists.uuid,
    priority: body.priority,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id: String(result.insertedId) });
}
