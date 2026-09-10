"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function utc(v?: string) {
  if (!v) return "—";
  return new Date(v).toISOString().replace("T", " ").replace("Z", " UTC");
}
function local(v?: string) {
  if (!v) return "—";
  return new Date(v).toLocaleString();
}
function msBetween(a?: string, b?: string) {
  if (!a || !b) return null;
  return Date.parse(b) - Date.parse(a);
}

export default function TargetDetail() {
  const params = useParams<{ uuid: string }>();
  const uuid = decodeURIComponent(params.uuid);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch(`/api/targets/${encodeURIComponent(uuid)}`, { cache: "no-store" });
    if (!r.ok) { setError("Target not found or telemetry unavailable"); return; }
    setData(await r.json());
    setError("");
  }

  useEffect(() => { load(); }, [uuid]);

  if (error) return <div className="stack"><div className="banner">{error}</div><Link href="/targets" className="backLink">← Back to targets</Link></div>;
  if (!data) return <div className="stack"><div className="panel">Loading target telemetry…</div></div>;

  const t = data.target;
  const changes = data.changes || [];

  return <div className="stack">
    <section className="hero compact">
      <div>
        <div className="eyebrow">TARGET INTELLIGENCE</div>
        <h1>{t.current_name || t.label}</h1>
        <p>{t.label !== t.current_name ? `Tracked as ${t.label} · ` : ""}{t.uuid}</p>
      </div>
      <div className={`priorityBadge ${t.priority}`}>{t.priority}</div>
    </section>

    <div className="detailActions">
      <Link href="/targets" className="backLink">← All targets</Link>
      {t.current_name && <a className="backLink" href={`https://namemc.com/search?q=${encodeURIComponent(t.current_name)}`} target="_blank" rel="noreferrer">Open NameMC ↗</a>}
    </div>

    <section className="detailGrid">
      <div className="panel">
        <div className="panelHead"><div><div className="eyebrow">CURRENT STATE</div><h2>Target</h2></div></div>
        <div className="kv detailKv">
          <div><span>Label</span><strong>{t.label || "—"}</strong></div>
          <div><span>Current name</span><strong>{t.current_name || "—"}</strong></div>
          <div><span>UUID</span><strong className="mono">{t.uuid}</strong></div>
          <div><span>Priority</span><strong>{t.priority}</strong></div>
          <div><span>Enabled</span><strong>{t.enabled ? "yes" : "no"}</strong></div>
          <div><span>Failures</span><strong>{t.consecutive_failures || 0}</strong></div>
        </div>
      </div>

      <div className="panel">
        <div className="panelHead"><div><div className="eyebrow">LATEST OBSERVATION</div><h2>Timing</h2></div></div>
        <div className="kv detailKv">
          <div><span>Last checked (UTC)</span><strong className="mono">{utc(t.last_checked_at)}</strong></div>
          <div><span>Last checked (local)</span><strong>{local(t.last_checked_at)}</strong></div>
          <div><span>Request start</span><strong className="mono">{utc(t.last_observation_started_at)}</strong></div>
          <div><span>Request midpoint</span><strong className="mono">{utc(t.last_observation_midpoint_at)}</strong></div>
          <div><span>Response received</span><strong className="mono">{utc(t.last_observation_received_at)}</strong></div>
          <div><span>RTT</span><strong>{msBetween(t.last_observation_started_at, t.last_observation_received_at) ?? "—"}{t.last_observation_started_at ? " ms" : ""}</strong></div>
          <div><span>Next due</span><strong className="mono">{utc(t.next_due_at)}</strong></div>
        </div>
      </div>
    </section>

    <section className="panel">
      <div className="panelHead"><div><div className="eyebrow">HISTORY</div><h2>Name transitions</h2></div><span>{changes.length} stored</span></div>
      {changes.length ? <div className="transitionList">{changes.map((c: any) => {
        const legacy = Number(c.width_seconds) === 0 && c.last_seen_old_at === c.first_seen_new_at;
        return <div className="transitionCard" key={c._id}>
          <div className="transitionTitle"><strong>{c.old_name} <b>→</b> {c.new_name}</strong><span>{legacy ? "legacy / left boundary unavailable" : `${Number(c.width_seconds).toFixed(3)}s bracket`}</span></div>
          <div className="stampGrid">
            <div><label>Last confirmed old midpoint</label><code>{legacy ? "unavailable (legacy bug)" : utc(c.last_seen_old_at)}</code></div>
            <div><label>First confirmed new midpoint</label><code>{utc(c.first_seen_new_at)}</code></div>
            <div><label>Detected / response time</label><code>{utc(c.detected_at)}</code></div>
            <div><label>Last-old request</label><code>{c.last_old_request_started_at ? `${utc(c.last_old_request_started_at)} → ${utc(c.last_old_response_received_at)}` : "—"}</code></div>
            <div><label>First-new request</label><code>{c.first_new_request_started_at ? `${utc(c.first_new_request_started_at)} → ${utc(c.first_new_response_received_at)}` : "—"}</code></div>
          </div>
          <a className="nameMcInline" href={`https://namemc.com/search?q=${encodeURIComponent(c.old_name)}`} target="_blank" rel="noreferrer">View {c.old_name} on NameMC ↗</a>
        </div>;
      })}</div> : <div className="empty small">No name changes stored for this target.</div>}
    </section>
  </div>;
}
