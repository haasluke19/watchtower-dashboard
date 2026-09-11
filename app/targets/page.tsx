"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const priorities = ["critical", "high", "normal", "low"];

export default function Targets() {
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>({ items: [], pages: 1, total: 0 });
  const [busy, setBusy] = useState("");

  async function load() {
    const r = await fetch(`/api/targets?q=${encodeURIComponent(q)}&priority=${priority}&state=${state}&page=${page}`, { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q, priority, state, page]);

  async function change(target: any, p: string) {
    const key = target.name || target.label || target.uuid;
    setBusy(key);
    await fetch("/api/commands", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "set_priority", name: target.name || target.label, uuid: target.expected_uuid || target.uuid, priority: p })
    });
    setBusy("");
    setTimeout(load, 35000);
  }

  return <div className="stack">
    <section className="hero compact">
      <div><div className="eyebrow">CORPUS</div><h1>Targets</h1><p>Search the synced valuable-name corpus and inspect relinquishment timing.</p></div>
      <div className="counter">{data.total.toLocaleString()} results</div>
    </section>

    <div className="filters">
      <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search name or UUID…" />
      <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}>
        <option value="">All priorities</option>
        {priorities.map(p => <option key={p}>{p}</option>)}
      </select>
      <select value={state} onChange={e => { setState(e.target.value); setPage(1); }}>
        <option value="">All states</option>
        <option value="held">held</option>
        <option value="relinquished">relinquished</option>
      </select>
    </div>

    <div className="panel tablePanel">
      <table>
        <thead><tr><th>Name</th><th>Holder UUID</th><th>State</th><th>Priority</th><th>Last checked</th></tr></thead>
        <tbody>{data.items.map((t: any) => {
          const key = t.name || t.label || t.uuid;
          return <tr key={`${key}-${t.expected_uuid || t.uuid}`}>
            <td><Link className="targetLink" href={`/targets/${encodeURIComponent(key)}`}><strong>{t.name || t.label}</strong><small>{t.current_name && t.current_name !== (t.name || t.label) ? `holder now ${t.current_name}` : t.poll_mode || ""}</small></Link></td>
            <td><Link className="nameLink mono" href={`/targets/${encodeURIComponent(key)}`}>{t.expected_uuid || t.uuid || "—"}</Link></td>
            <td><span className={`priority ${t.state === "relinquished" ? "low" : "high"}`}>{t.state || "held"}</span></td>
            <td><select className={`priority ${t.priority}`} value={t.priority} disabled={busy === key} onChange={e => change(t, e.target.value)}>{priorities.map(p => <option key={p}>{p}</option>)}</select></td>
            <td>{t.last_checked_at ? new Date(t.last_checked_at).toLocaleString() : "—"}</td>
          </tr>;
        })}</tbody>
      </table>
      {!data.items.length && <div className="empty small">No synced targets match.</div>}
    </div>

    <div className="pager">
      <button disabled={page <= 1} onClick={() => setPage(x => x - 1)}>← Previous</button>
      <span>Page {page} of {data.pages}</span>
      <button disabled={page >= data.pages} onClick={() => setPage(x => x + 1)}>Next →</button>
    </div>
  </div>;
}
