import { NextRequest, NextResponse } from "next/server";
import { db, instanceId } from "@/lib/mongo";
const priorities=new Set(["critical","high","normal","low"]);
export async function POST(req: NextRequest) {
  const body=await req.json().catch(()=>({}));
  if (body.type!=="set_priority" || typeof body.uuid!=="string" || !priorities.has(body.priority)) return NextResponse.json({error:"invalid command"},{status:400});
  const d=await db();
  const exists=await d.collection("targets").findOne({instance_id:instanceId(),uuid:body.uuid});
  if (!exists) return NextResponse.json({error:"target not found"},{status:404});
  const result=await d.collection("commands").insertOne({instance_id:instanceId(),type:"set_priority",uuid:body.uuid,priority:body.priority,status:"pending",created_at:new Date().toISOString()});
  return NextResponse.json({ok:true,id:String(result.insertedId)});
}
