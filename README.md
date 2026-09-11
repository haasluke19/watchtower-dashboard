# Watchtower Dashboard

Private Vercel dashboard for Minecraft Name Watchtower using MongoDB Atlas.

## Current architecture

- Watchtower v0.5.1 keeps SQLite on the VPS as the authoritative data store.
- The poller uses MinecraftServices bulk-by-name lookups (up to 10 tracked names per request).
- The VPS performs a best-effort Atlas sync every 30 seconds when `MONGODB_URI` is configured.
- Atlas stores dashboard-facing status, name-centric target state, bulk health snapshots, relinquishment events, and the priority command queue.
- The Vercel dashboard reads Atlas. Priority edits create commands; the VPS validates and applies them to SQLite on the next sync.
- Atlas outages never stop Minecraft polling.

## VPS environment

Put the Atlas settings in `/etc/watchtower.env`:

```bash
MONGODB_URI='mongodb+srv://...'
MONGODB_DATABASE='watchtower'
WATCHTOWER_INSTANCE_ID='primary'
```

The v0.5.1 systemd service loads that file automatically. If an existing systemd drop-in already defines these variables, it also continues to work.

## Vercel environment

Set:

```text
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=watchtower
WATCHTOWER_INSTANCE_ID=primary
DASHBOARD_PASSWORD=<long private password>
AUTH_SECRET=<different long random string>
```

## Dashboard

- `/` — online/offline heartbeat, held/relinquished counts, adaptive RPS, broad sweep time, critical sweep time, bulk name-check count, latency, API health, and recent name events.
- `/targets` — searchable name-centric corpus with state and priority filtering.
- `/targets/<name-or-uuid>` — detailed relinquishment bracket timing and holder information.

Priority edits are asynchronous: the dashboard queues a command in Atlas; the VPS picks it up on the next sync cycle, validates it, updates SQLite, and syncs the new priority back to Atlas.
