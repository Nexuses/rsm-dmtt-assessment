# Shared VPS infrastructure — handoff for other assessment apps

Use this document when adding **another** RSM-style assessment app on the **same Ubuntu VPS**. It describes what is already running, what you must reuse, and what you must make unique per app.

Copy this file into the other repo (or paste it into the other Cursor chat) so agents do not reinvent Docker Postgres or bind conflicting ports.

---

## 1. Goal / architecture

| Layer | Shared across apps? | Notes |
|--------|---------------------|--------|
| VPS (Ubuntu) | Yes | One server, ~**4 GB RAM** — treat RAM as scarce |
| Docker Postgres | **Yes — one container only** | Many **databases**, not many containers |
| Next.js app process (PM2) | No | One PM2 app per assessment, unique name + port |
| nginx site + domain | No | One server block per public hostname |
| Google Sheets / S3 / SMTP | Usually per-app or shared credentials by choice | Do not assume the same spreadsheet |
| `/submissions` password | No | Unique `SUBMISSIONS_PASSWORD` per app |

**Do not** start a second `postgres` Docker container for a new assessment. That wastes RAM. Create a **new database** inside the existing Postgres instance.

```text
Internet → nginx (80/443) → 127.0.0.1:PORT (Next.js via PM2)
                                    ↓
                         127.0.0.1:5432 (Docker Postgres)
                         ├── rsm_assessments          (this e-invoicing app)
                         ├── other_app_assessments    (next app)
                         └── yet_another_db           ...
```

---

## 2. What is already set up (reference app)

### Host paths

| Item | Value |
|------|--------|
| Reference app directory | `/var/www/RSM-assessment-e-invoicing` |
| Reference repo (local / GitHub) | `RSM-assessment-e-invoicing-1` |
| Compose file that owns Postgres | `/var/www/RSM-assessment-e-invoicing/docker-compose.yml` |
| Volume for DB data | Docker named volume `postgres_data` (do not delete) |

### Docker Postgres (single shared instance)

| Item | Value |
|------|--------|
| Container name | `rsm-assessments-postgres` |
| Image | `postgres:16-alpine` |
| Host bind | **`127.0.0.1:5432` only** (not `0.0.0.0`) |
| Default DB (first app) | `rsm_assessments` |
| Default user | `rsm` |
| Default password (dev / initial) | `rsm` — **change in production** and put the real password only in each app’s `.env` |
| Memory cap | `mem_limit: 512m` |
| Compose format | `version: "2.4"` (needed so Ubuntu `docker-compose` 1.29 honors `mem_limit`) |

### Postgres tuning already applied (via `command:` in compose)

- `shared_buffers=128MB`
- `effective_cache_size=512MB`
- `work_mem=4MB`
- `maintenance_work_mem=64MB`
- `max_connections=40` ← **budget carefully**; each Next.js app opens a pool
- `wal_buffers=4MB`
- `min_wal_size=80MB` / `max_wal_size=1GB`
- `random_page_cost=1.1`

### Reference Next.js / PM2 / nginx

| Item | Value |
|------|--------|
| PM2 process name | `rsm-e-invoicing` |
| App listen port | **`3000`** (`127.0.0.1:3000`) |
| nginx example | `deploy/nginx.conf.example` → proxies to `127.0.0.1:3000` |
| Admin UI | `/submissions` (password cookie gate via `SUBMISSIONS_PASSWORD`) |
| ORM | Prisma 6 (`prisma/`, `@prisma/client`) |
| Persistence | Assessment + consultation rows in Postgres; Sheets/S3/SMTP remain best-effort |

### Firewall / security rules already expected

- UFW: allow **OpenSSH** + **Nginx Full** only
- **Never** open port **5432** in UFW or the cloud security group
- Postgres must stay on `127.0.0.1`
- App ports (`3000`, `3001`, …) stay **localhost-only**; nginx is the public entry

### Known ops quirks on this VPS

1. Ubuntu package is **`docker-compose`** (hyphen), often **1.29.2** — not `docker compose` plugin.
2. Recreate can fail with `KeyError: 'ContainerConfig'`. Fix: remove the container, then `up -d` again (volume keeps data):

```bash
sudo docker rm -f rsm-assessments-postgres
cd /var/www/RSM-assessment-e-invoicing
sudo docker-compose up -d
```

3. Docker socket permission: user must be in `docker` group, or use `sudo` for docker commands.

---

## 3. Port and naming registry (update when you add an app)

Reserve unique values **before** deploying. Update this table in your copy of the doc as apps go live.

| App | Directory under `/var/www/` | PM2 name | Node PORT | Postgres database | nginx site name | Notes |
|-----|-----------------------------|----------|-----------|-------------------|-----------------|--------|
| E-invoicing (reference) | `RSM-assessment-e-invoicing` | `rsm-e-invoicing` | `3000` | `rsm_assessments` | `rsm-e-invoicing` | Owns the Docker Compose Postgres |
| DMTT / Pillar Two | `rsm-dmtt-assessment` | `rsm-dmtt` | `3001` | `dmtt_assessments` | `rsm-dmtt` | Reuse shared Postgres; see [`DEPLOY.md`](DEPLOY.md) |
| *(next app)* | `…` | `…` | `3002` | `…` | `…` | |
| *(next app)* | `…` | `…` | `3003` | `…` | `…` | |

**Conventions**

- App ports: `3000`, `3001`, `3002`, … (never publish them publicly)
- DB names: snake_case, unique, e.g. `cyber_assessments`, `vat_assessments`
- PM2 names: short kebab-case, unique (`pm2 list` must not collide)
- nginx: unique `server_name` and unique file under `/etc/nginx/sites-available/`

---

## 4. Checklist — bring up a NEW assessment app on this VPS

### A. Code / repo expectations

Your app should:

1. Use Prisma (or compatible) with `DATABASE_URL`.
2. **Not** ship a second long-running Postgres in compose for production on this VPS (optional local-only compose is fine on laptops).
3. Use a unique PM2 `name` and `PORT` in `ecosystem.config.cjs` (or equivalent).
4. If you have `/submissions` (or similar), use a **unique** `SUBMISSIONS_PASSWORD`.
5. Keep secrets in `/var/www/<app>/.env` only (gitignored).

### B. Create a new database (on the shared container)

```bash
# List existing DBs (avoid name clashes)
sudo docker exec -it rsm-assessments-postgres \
  psql -U rsm -d rsm_assessments -c '\l'

# Create yours (replace NAME)
sudo docker exec -it rsm-assessments-postgres \
  psql -U rsm -d rsm_assessments \
  -c "CREATE DATABASE NAME_assessments OWNER rsm;"
```

### C. App `.env` (pattern)

```bash
# SAME host/port/user as the shared instance — DIFFERENT database name
DATABASE_URL=postgresql://rsm:YOUR_PASSWORD@localhost:5432/NAME_assessments?schema=public

SUBMISSIONS_PASSWORD=unique-strong-password-for-this-app-only

# Plus this app’s Sheets / S3 / SMTP vars as needed
```

`localhost:5432` is correct because the Next.js process runs on the host (PM2), not inside the Postgres container network.

### D. Install, migrate, build, PM2

```bash
cd /var/www/YOUR-APP-DIR
cp .env.example .env   # then edit
npm ci
npx prisma migrate deploy
npm run build

# ecosystem.config.cjs must set unique name + PORT (e.g. 3001)
pm2 start ecosystem.config.cjs
pm2 save
```

Example PM2 snippet for a second app:

```js
module.exports = {
  apps: [
    {
      name: "rsm-other-assessment", // UNIQUE
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001, // UNIQUE — not 3000
      },
    },
  ],
};
```

### E. nginx for the new domain

Copy a server block; change:

- `server_name` → your domain
- `proxy_pass` → `http://127.0.0.1:YOUR_PORT` (e.g. `3001`)
- sites-available filename → unique

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your.domain
```

### F. Smoke test

1. `curl -I http://127.0.0.1:YOUR_PORT`
2. Submit a test form → row in **your** database
3. Open `/submissions` (if present) with **your** password
4. Confirm you did **not** create another Postgres container: `docker ps` should still show **one** `rsm-assessments-postgres`

---

## 5. Connection pool / `max_connections` budget

Postgres is configured with **`max_connections=40`**.

Leave headroom for admin/superuser (~3–5). Rough budget for app pools:

| Apps on this VPS | Suggested max pool per app |
|------------------|----------------------------|
| 1–2 | 10–15 |
| 3–4 | 5–8 |
| 5+ | 3–5 or raise RAM / `max_connections` carefully |

If you use Prisma, prefer a modest pool (or Prisma Data Proxy / external pooler only if you add one later). Do not set huge `connection_limit` in every app.

---

## 6. What NOT to do

| Don’t | Why |
|-------|-----|
| Run another `postgres` container on `5433`, `5434`, … | Burns RAM on a 4GB box |
| Publish Postgres as `0.0.0.0:5432` | Exposes DB to the internet |
| Open 5432 in UFW / cloud firewall | Same |
| Reuse PM2 name or PORT `3000` | Collides with e-invoicing app |
| Reuse DB name `rsm_assessments` | Overwrites / mixes data |
| `docker volume rm` / `docker-compose down -v` on the shared compose | **Destroys all apps’ data** |
| Put real passwords in git | Use `.env` only |
| Assume Sheets/S3/SMTP from this repo are yours | Configure per product |

---

## 7. Useful commands (shared DB)

```bash
# Is shared Postgres up and localhost-bound?
docker ps --filter name=rsm-assessments-postgres
# Expect: 127.0.0.1:5432->5432/tcp

# Memory usage
sudo docker stats rsm-assessments-postgres --no-stream

# Shell into SQL
sudo docker exec -it rsm-assessments-postgres psql -U rsm -d rsm_assessments

# List databases
sudo docker exec -it rsm-assessments-postgres psql -U rsm -d rsm_assessments -c '\l'

# Restart shared Postgres only (from the OWNER compose directory)
cd /var/www/RSM-assessment-e-invoicing
sudo docker-compose up -d
```

**Ownership rule:** Only the e-invoicing app directory should run `docker-compose` for Postgres. Other apps only create databases and point `DATABASE_URL` at them. If compose settings must change (memory, ports), change them in `/var/www/RSM-assessment-e-invoicing/docker-compose.yml` and coordinate with whoever owns that repo.

---

## 8. Local development vs production

| Environment | Postgres |
|-------------|----------|
| Laptop | Fine to run your own compose / local Postgres |
| This VPS (production) | **Must** use shared `rsm-assessments-postgres` + new DB name |

---

## 9. Minimal paste for another Cursor agent

You can paste this block into another chat:

```text
Shared VPS (~4GB RAM). ONE Docker Postgres already runs:
  container: rsm-assessments-postgres
  bind: 127.0.0.1:5432
  user: rsm
  owned by compose at: /var/www/RSM-assessment-e-invoicing/docker-compose.yml
  mem_limit 512m, max_connections=40
  DO NOT start another postgres container.

Reference app uses:
  dir: /var/www/RSM-assessment-e-invoicing
  PM2: rsm-e-invoicing
  PORT: 3000
  DB: rsm_assessments

DMTT / Pillar Two (this family of apps) already reserved:
  dir: /var/www/rsm-dmtt-assessment
  PM2: rsm-dmtt
  PORT: 3001
  DB: dmtt_assessments

For a NEW assessment app on the same VPS:
  1) Pick unique PORT (3002+), PM2 name, nginx domain, DB name
  2) CREATE DATABASE <name> OWNER rsm; inside the existing container
  3) DATABASE_URL=postgresql://rsm:<password>@localhost:5432/<name>?schema=public
  4) prisma migrate deploy + pm2 on that PORT
  5) nginx proxy_pass to 127.0.0.1:<PORT>
  6) Never open 5432 publicly; never docker-compose down -v on the shared DB
Full detail: SHARED-INFRA.md; DMTT steps: DEPLOY.md in rsm-dmtt-assessment
```

---

## 10. Related docs

On the **e-invoicing** (Postgres owner) repo:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Shared Postgres definition (source of truth) |
| `DEPLOY.md` | Full VPS deploy for the e-invoicing app |

In **this** DMTT repo:

| File | Purpose |
|------|---------|
| [`DEPLOY.md`](DEPLOY.md) | Full VPS deploy for this app (port `3001`, DB `dmtt_assessments`) |
| [`env.example`](env.example) | Env var template |
| [`ecosystem.config.cjs`](ecosystem.config.cjs) | PM2 (`rsm-dmtt`, `PORT` 3001) |
| [`deploy/nginx.conf.example`](deploy/nginx.conf.example) | nginx proxy example |
