import { NextResponse } from "next/server";
import { db, instanceId } from "@/lib/mongo";
export const dynamic = "force-dynamic";
export async function GET() {
  const d=await db(), instance=instanceId();
  const [status, changes, health] = await Promise.all([
    d.collection("watchtower_status").findOne({_id:instance as never}),
    d.collection("name_changes").find({instance_id:instance}).sort({detected_at:-1}).limit(25).toArray(),
    d.collection("health_snapshots").find({instance_id:instance}).sort({sqlite_id:-1}).limit(60).toArray(),
  ]);
  const now=Date.now();
  const heartbeat=status?.last_heartbeat ? Date.parse(String(status.last_heartbeat)) : 0;
  return NextResponse.json({
    status: status ? {...status, _id:String(status._id), online: heartbeat > 0 && now-heartbeat < 120000} : null,
    changes: changes.map(x=>({...x,_id:String(x._id)})),
    health: health.reverse().map(x=>({...x,_id:String(x._id)}))
  });
}
