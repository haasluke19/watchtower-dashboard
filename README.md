# Watchtower Dashboard v1

Private Vercel dashboard for Minecraft Name Watchtower v0.6 using MongoDB Atlas.

## Architecture

- Watchtower continues writing authoritative data to local SQLite on the VPS.
- v0.6 performs a best-effort Atlas sync every 30 seconds.
- Atlas stores dashboard-facing status, target state, health snapshots, transitions, and a tiny validated command queue.
- The Vercel dashboard reads Atlas. Priority edits create commands; the VPS validates and applies them to SQLite.
- Atlas outages do not stop Minecraft polling.

## Atlas setup

1. Create an Atlas cluster and database user with read/write access to database `watchtower`.
2. Add network access for the VPS. Vercel outbound IPs are not fixed on ordinary deployments, so if your Atlas setup requires IP allow-listing you may need an Atlas/Vercel-supported connectivity option or allow broader access with strong credentials. Never expose the URI in browser-side code.
3. Copy the `mongodb+srv://...` connection string.

Collections and indexes are created automatically by Watchtower v0.6 on first sync.

## VPS environment

Add these variables to the systemd service environment (or an EnvironmentFile):

```
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=watchtower
WATCHTOWER_INSTANCE_ID=primary
```

Set `mongo_sync.enabled: true` in `config.yaml`, install requirements, and restart Watchtower.

## Vercel environment

Set:

```
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=watchtower
WATCHTOWER_INSTANCE_ID=primary
DASHBOARD_PASSWORD=<long private password>
AUTH_SECRET=<different long random string>
```

Then deploy this folder to Vercel. The dashboard is password protected and the auth cookie is HTTP-only.

## Dashboard

- `/` — online/offline heartbeat, corpus size, RPS, latency, API health, detections
- `/targets` — searchable synced target corpus and priority management

Priority edits are asynchronous: the dashboard queues a command in Atlas; the VPS picks it up on the next sync cycle, validates it, updates SQLite, and eventually syncs the new target priority back to Atlas.
