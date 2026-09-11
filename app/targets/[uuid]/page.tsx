"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function utc(v?: string) { return v ? new Date(v).toISOString().replace("T", " ").replace("Z", " UTC") : "—"; }
function local(v?: string) { return v ? new Date(v).toLocaleString() : "—"; }

export default function TargetDetail() {
  const params = useParams<{ uuid: string }>();
  const key = decodeURIComponent(params.uuid);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch(`/api/targets/${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!r.ok) { setError("Target not found or telemetry unavailable"); return; }
    setData(await r.json());
    setError("");
  }

  useEffect(() => { load(); }, [key]);

  if (error) return <div className="stack"><div className="banner">{error}</div><Link href="/targets" className="backLink">← Back to targets</Link></div>;
  if (!data) return <div className="stack"><div className="panel">Loading target telemetry…</div></div>;

  const t = data.target;
  const changes = data.changes || [];
  const trackedName = t.name || t.label;
  const holder = t.expected_uuid || t.uuid;

  return <div className="stack">
    <section className="hero compact">
      <div>
        <div className="eyebrow">TARGET INTELLIGENCE</div>
        <h1>{trackedName}</h1>
        <p>{holder || "holder unknown"}</p>
      </div>
      <div className={`priorityBadge ${t.priority}`}>{t.priority}</div>
    </section>

    <div className="detailActions">
      <Link href="/targets" className="backLink">← All targets</Link>
      {trackedName && <a className="backLink" href={`https://namemc.com/search?q=${encodeURIComponent(trackedName)}`} target="_blank" rel="noreferrer">Open NameMC ↗</a>}
    </div>

    <section className="detailGrid">
      <div className="panel">
        <div className="panelHead"><div><div className="eyebrow">CURRENT STATE</div><h2>Tracked name</h2></div></div>
        <div className="kv detailKv">
          <div><span>Name</span><strong>{trackedName || "—"}</strong></div>
          <div><span>State</span><strong>{t.state || "held"}</strong></div>
          <div><span>Expected holder UUID</span><strong className="mono">{holder || "—"}</strong></div>
          <div><span>Holder current name</span><strong>{t.state === "relinquished" ? (t.current_name || "unknown") : trackedName}</strong></div>
          <div><span>Priority</span><strong>{t.priority}</strong></div>
          <div><span>Miss count</span><strong>{t.miss_count || 0}</strong></div>
        </div>
      </div>

      <div className="panel">
        <div className="panelHead"><div><div className="eyebrow">LATEST OBSERVATION</div><h2>Timing</h2></div></div>
        <div className="kv detailKv">
          <div><span>Last checked (UTC)</span><strong className="mono">{utc(t.last_checked_at)}</strong></div>
          <div><span>Last checked (local)</span><strong>{local(t.last_checked_at)}</strong></div>
          <div><span>Last confirmed expected</span><strong className="mono">{utc(t.last_expected_at)}</strong></div>
          <div><span>First missing</span><strong className="mono">{utc(t.first_missing_at)}</strong></div>
          <div><span>Next relinquished recheck</span><strong className="mono">{utc(t.next_recheck_at)}</strong></div>
          <div><span>Poll mode</span><strong>{t.poll_mode || "legacy"}</strong></div>
        </div>
      </div>
    </section>

    <section className="panel">
      <div className="panelHead"><div><div className="eyebrow">HISTORY</div><h2>Name events</h2></div><span>{changes.length} stored</span></div>
      {changes.length ? <div className="transitionList">{changes.map((c: any) => <div className="transitionCard" key={c._id}>
        <div className="transitionTitle"><strong>{c.old_name || c.name} {c.event_type === "relinquished" ? "relinquished" : `→ ${c.new_name}`}</strong><span>{typeof c.width_seconds === "number" ? `${Number(c.width_seconds).toFixed(3)}s bracket` : "open bracket"}</span></div>
        <div className="stampGrid">
          <div><label>Last confirmed held midpoint</label><code>{utc(c.lower_at || c.last_seen_old_at)}</code></div>
          <div><label>First missing/new midpoint</label><code>{utc(c.upper_at || c.first_seen_new_at)}</code></div>
          <div><label>Detected</label><code>{utc(c.detected_at)}</code></div>
          <div><label>Old holder UUID</label><code>{c.old_holder_uuid || c.uuid || "—"}</code></div>
          <div><label>Old holder new name</label><code>{c.old_holder_new_name || c.new_name || "—"}</code></div>
          <div><label>Source</label><code>{c.source || "legacy"}</code></div>
        </div>
      </div>)}</div> : <div className="empty small">No stored relinquishment events for this name.</div>}
    </section>
  </div>;
}
