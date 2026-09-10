"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function ago(v?: string) {
  if (!v) return "never";
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(v)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
function n(v: any, d = 0) { return typeof v === "number" ? v.toFixed(d) : "—"; }
function stamp(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  return `${d.toISOString().replace("T", " ").replace("Z", " UTC")}`;
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
      setError("");
    } catch {
      setError("Dashboard data unavailable");
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, []);

  const s = data?.status;
  const changes = data?.changes || [];

  return <div className="stack">
    <section className="hero">
      <div><div className="eyebrow">MINECRAFT NAME INTELLIGENCE</div><h1>Watchtower</h1><p>Live telemetry from your private name tracker.</p></div>
      <div className={`statusPill ${s?.online ? "online" : "offline"}`}><span />{s?.online ? "ONLINE" : "OFFLINE"}</div>
    </section>
    {error && <div className="banner">{error}</div>}

    <section className="cards">
      <div className="card"><label>Targets</label><strong>{s?.targets?.toLocaleString?.() || "—"}</strong><small>{s?.tiers?.critical || 0} critical · {s?.tiers?.normal || 0} normal</small></div>
      <div className="card"><label>Current RPS</label><strong>{n(s?.rps, 2)}</strong><small>{s?.due?.toLocaleString?.() || 0} currently due</small></div>
      <div className="card"><label>Latency</label><strong>{n(s?.latency?.p50, 1)} <em>ms</em></strong><small>p90 {n(s?.latency?.p90, 1)} · p99 {n(s?.latency?.p99, 1)}</small></div>
      <div className="card"><label>API Health</label><strong>{s?.error_total || 0} <em>errors</em></strong><small>{s?.rate_limited_total || 0} rate limits · {(s?.ok_total || 0).toLocaleString()} OK</small></div>
    </section>

    <section className="grid">
      <div className="panel span2">
        <div className="panelHead"><div><div className="eyebrow">DETECTIONS</div><h2>Name changes</h2></div><span>{changes.length} recent</span></div>
        {changes.length ? <div className="events">{changes.map((c: any) => {
          const legacy = Number(c.width_seconds) === 0 && c.last_seen_old_at === c.first_seen_new_at;
          return <Link className="event eventLink" href={`/targets/${encodeURIComponent(c.uuid)}`} key={c._id}>
            <div className="eventIcon">↳</div>
            <div>
              <strong>{c.old_name} <b>→</b> {c.new_name}</strong>
              <small>{c.uuid}</small>
              <small className="exactStamp">first new: {stamp(c.first_seen_new_at || c.detected_at)}</small>
            </div>
            <div className="eventMeta">
              <strong>{legacy ? "legacy detection" : `${n(c.width_seconds, 3)}s bracket`}</strong>
              <small>{ago(c.detected_at)}</small>
              <small>view details →</small>
            </div>
          </Link>;
        })}</div> : <div className="empty"><div className="radar">◎</div><strong>No name changes detected yet</strong><span>Watchtower is collecting observations. Changes will appear here automatically.</span></div>}
      </div>

      <div className="panel">
        <div className="panelHead"><div><div className="eyebrow">HEARTBEAT</div><h2>VPS</h2></div></div>
        <div className="kv">
          <div><span>Last sync</span><strong>{ago(s?.last_heartbeat)}</strong></div>
          <div><span>Version</span><strong>v{s?.version || "—"}</strong></div>
          <div><span>Instance</span><strong>{s?.instance_id || "—"}</strong></div>
          <div><span>Successful requests</span><strong>{(s?.ok_total || 0).toLocaleString()}</strong></div>
        </div>
      </div>
    </section>
  </div>;
}
