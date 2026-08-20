# Deploy — RSM DMTT / Pillar Two assessment (shared VPS)

This app is a **second** assessment on the same Ubuntu VPS as the e-invoicing reference app.  
Full shared-infra rules: [`SHARED-INFRA.md`](SHARED-INFRA.md).

**Do not** start another Postgres container. Reuse `rsm-assessments-postgres` and create database `dmtt_assessments` only.

| Item | Value |
|------|--------|
| GitHub | `Nexuses/rsm-dmtt-assessment` (private) |
| VPS directory | `/var/www/rsm-dmtt-assessment` |
| PM2 name | `rsm-dmtt` |
| Listen | `127.0.0.1:3001` |
| Postgres DB | `dmtt_assessments` |
| nginx site | `rsm-dmtt` |
| Domain | Replace `YOUR_DOMAIN` everywhere below |

**Persistence:** Postgres (`dmtt_assessments`) stores assessment + consultation rows. Google Sheets + S3 + SMTP remain best-effort alongside DB writes. Admin UI: `/submissions` (password via `SUBMISSIONS_PASSWORD`).

```text
Internet → nginx (80/443) → 127.0.0.1:3001 (PM2: rsm-dmtt)
                                    ↓
                         127.0.0.1:5432 (shared Docker Postgres)
                         ├── rsm_assessments      (e-invoicing — do not use)
                         └── dmtt_assessments     (this app)
```

---

## 0. Preconditions

On the VPS, confirm before you start:

1. Shared Postgres is up and **localhost-bound**:

```bash
docker ps --filter name=rsm-assessments-postgres
# Expect: 127.0.0.1:5432->5432/tcp
```

2. E-invoicing (or whatever owns compose) is already at `/var/www/RSM-assessment-e-invoicing` with working `docker-compose.yml`.
3. UFW allows **OpenSSH** and **Nginx Full** only. **Never** open `5432`.
4. Node.js (LTS), npm, PM2, nginx, and certbot are installed (same as the reference app).
5. You have sudo for nginx/certbot and permission to use Docker (`docker` group or `sudo`).

**Ownership rule:** Only run `docker-compose` for Postgres from `/var/www/RSM-assessment-e-invoicing`. Never `docker-compose down -v` on that stack — it destroys **all** apps’ DB data.

---

## 1. SSH into the VPS

```bash
ssh YOUR_USER@YOUR_VPS_IP
```

Optional sanity checks:

```bash
pm2 list
sudo nginx -t
df -h
free -h
```

---

## 2. Private GitHub deploy key

Generate a **dedicated** key for this repo (do not reuse the e-invoicing key).

```bash
ssh-keygen -t ed25519 -C "rsm-dmtt-vps-deploy" -f ~/.ssh/rsm_dmtt_deploy -N ""
cat ~/.ssh/rsm_dmtt_deploy.pub
```

In GitHub → **Nexuses/rsm-dmtt-assessment** → **Settings** → **Deploy keys** → **Add deploy key**:

- Title: `vps-rsm-dmtt`
- Key: paste the `.pub` contents
- Leave **Allow write access** unchecked (read-only)

SSH config so this key is used only for this repo:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/config <<'EOF'

Host github.com-rsm-dmtt
  HostName github.com
  User git
  IdentityFile ~/.ssh/rsm_dmtt_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/rsm_dmtt_deploy
```

Test:

```bash
ssh -T git@github.com-rsm-dmtt
# Expect: Hi Nexuses/rsm-dmtt-assessment! You've successfully authenticated...
```

---

## 3. Clone the app

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www

cd /var/www
git clone git@github.com-rsm-dmtt:Nexuses/rsm-dmtt-assessment.git rsm-dmtt-assessment
cd /var/www/rsm-dmtt-assessment
```

---

## 4. Create database `dmtt_assessments` (shared Postgres)

List existing DBs first (avoid clashes):

```bash
sudo docker exec -it rsm-assessments-postgres \
  psql -U rsm -d rsm_assessments -c '\l'
```

Create this app’s database:

```bash
sudo docker exec -it rsm-assessments-postgres \
  psql -U rsm -d rsm_assessments \
  -c "CREATE DATABASE dmtt_assessments OWNER rsm;"
```

If it already exists, Postgres will error — that is fine if you created it earlier. Confirm:

```bash
sudo docker exec -it rsm-assessments-postgres \
  psql -U rsm -d rsm_assessments -c '\l' | grep dmtt
```

---

## 5. App `.env`

```bash
cd /var/www/rsm-dmtt-assessment
cp env.example .env
nano .env   # or vim
```

Set at least:

```bash
# Shared Postgres — SAME host/user/password as other apps, DIFFERENT database name
# Optional: &connection_limit=5 (keep pools small on shared max_connections=40)
DATABASE_URL=postgresql://rsm:YOUR_PASSWORD@localhost:5432/dmtt_assessments?schema=public

# Unique admin password for https://YOUR_DOMAIN/submissions
SUBMISSIONS_PASSWORD=unique-strong-password-for-this-app-only

# Google Sheets (this product’s spreadsheet — do not assume e-invoicing’s sheet)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS=...
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_ASSESSMENT_SHEET_NAME=Sheet1
GOOGLE_SHEETS_CONSULTATION_SHEET_NAME=Sheet2

# SMTP
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
FROM_EMAIL=...
NOTIFICATION_EMAIL=...
REPLY_TO_EMAIL=...
CONSULTATION_RECIPIENTS=...

# AWS S3 (PDF / uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_REGION=...
```

- `YOUR_PASSWORD` must match the shared Postgres password (see e-invoicing `.env` / compose secrets on the VPS).
- `localhost:5432` is correct: PM2 runs on the host, not inside the Postgres container network.
- Never commit `.env`.

---

## 6. Install, migrate, build, PM2

```bash
cd /var/www/rsm-dmtt-assessment
npm ci
npx prisma migrate deploy
npm run build
```

Start with the repo’s ecosystem file (`name: rsm-dmtt`, `PORT: 3001`):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

Confirm localhost:

```bash
curl -I http://127.0.0.1:3001
```

---
## 7. nginx

Copy the example and edit domain + confirm port `3001`:

```bash
sudo cp /var/www/rsm-dmtt-assessment/deploy/nginx.conf.example \
  /etc/nginx/sites-available/rsm-dmtt
sudo nano /etc/nginx/sites-available/rsm-dmtt
# Replace YOUR_DOMAIN with the real hostname
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/rsm-dmtt /etc/nginx/sites-enabled/rsm-dmtt
sudo nginx -t && sudo systemctl reload nginx
```

Point DNS `A`/`AAAA` for `YOUR_DOMAIN` at this VPS before certbot.

---

## 8. TLS (certbot)

```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

Follow prompts. Confirm HTTPS in a browser.

Renewal is normally handled by certbot’s timer; spot-check:

```bash
sudo certbot renew --dry-run
```

---

## 9. Smoke test

1. `curl -I http://127.0.0.1:3001` → `200` (or Next.js redirect).
2. Open `https://YOUR_DOMAIN` and complete a test assessment.
3. Confirm a row in Postgres (`AssessmentSubmission`), Google Sheet, email, and S3 PDF (if configured).
4. Open `https://YOUR_DOMAIN/submissions` with `SUBMISSIONS_PASSWORD` and confirm the submission appears.
5. Confirm still **one** Postgres container:

```bash
docker ps --filter name=rsm-assessments-postgres
# Only one container; no new postgres on 5433/5434
```

6. `pm2 list` shows `rsm-dmtt` online and `rsm-e-invoicing` (or other apps) still healthy on their ports.

---

## 10. Redeploy / updates

```bash
cd /var/www/rsm-dmtt-assessment
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart rsm-dmtt
pm2 save
```

If env vars changed, edit `.env` then `pm2 restart rsm-dmtt --update-env`.

---
## 11. Safety don’ts

| Don’t | Why |
|-------|-----|
| Start another `postgres` Docker container | Burns RAM; shared instance already exists |
| Publish Postgres as `0.0.0.0:5432` or open 5432 in UFW | Exposes all apps’ data |
| Use PORT `3000` or PM2 name `rsm-e-invoicing` | Collides with e-invoicing |
| Use DB name `rsm_assessments` | Mixes products |
| `docker-compose down -v` / delete `postgres_data` | Wipes **every** assessment DB |
| Run `docker-compose` for Postgres from this app directory | This app does not own the shared DB |
| Commit `.env` or real deploy private keys | Secrets leak |

---

## 12. Useful commands

```bash
# App
pm2 logs rsm-dmtt
pm2 restart rsm-dmtt

# Shared DB (read-only style checks)
sudo docker exec -it rsm-assessments-postgres \
  psql -U rsm -d dmtt_assessments -c '\conninfo'

# Restart shared Postgres only (from OWNER directory)
cd /var/www/RSM-assessment-e-invoicing
sudo docker-compose up -d
```

---

## Related files in this repo

| File | Purpose |
|------|---------|
| [`SHARED-INFRA.md`](SHARED-INFRA.md) | Multi-app VPS rules |
| [`ecosystem.config.cjs`](ecosystem.config.cjs) | PM2 (`rsm-dmtt`, port `3001`) |
| [`deploy/nginx.conf.example`](deploy/nginx.conf.example) | nginx reverse proxy template |
| [`env.example`](env.example) | Env template including `DATABASE_URL` |
