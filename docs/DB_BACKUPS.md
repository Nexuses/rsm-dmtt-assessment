# Database backups to S3

Weekly `pg_dump` backups of Postgres to a private S3 bucket, scheduled by the
`RSMae` user's crontab on the shared VPS. The kit in `scripts/backup/` is
app-agnostic and identical in every assessment app; only the values in this
app's `.env` differ.

## How it works

Each run dumps the database (`pg_dump -Fc`, compressed), checks the dump is
readable with `pg_restore --list`, then uploads it twice:

| Key | Retention |
| --- | --- |
| `weekly/<app>_<UTC timestamp>.dump` | Deleted by the bucket lifecycle after 84 days (about 12 backups) |
| `latest/<app>.dump` | Never expires; always the most recent good backup |

`latest/` is written only after the dated upload succeeds, so a failed run never
replaces a good backup. If backups stop for any reason, the dated copies age out
but `latest/` keeps the last good dump.

Pruning is done by the bucket lifecycle, not the script, so the server's AWS
key only needs upload permission. A compromised server cannot delete backups
if it holds an upload-only key (see [Notes](#notes)).

## Shared schedule (all assessment apps on this VPS)

Every assessment app dumps its own database from the one shared
`rsm-assessments-postgres` container, each in its own 15-minute slot:

| Sunday, server time | App | Database | Bucket | Cron schedule |
| --- | --- | --- | --- | --- |
| 02:00 | E-Invoicing | `rsm_assessments` | `rsm-e-invoicing-db-backups` | `0 2 * * 0` |
| 02:15 | DMTT | `dmtt_assessments` | `rsm-dmtt-db-backups` | `15 2 * * 0` |
| 02:30 | UAE Cyber | `uae_cyber_assessments` | `rsm-uae-cyber-db-backups` | `30 2 * * 0` |

Why the runs are 15 minutes apart:

- `pg_dump` and the `pg_restore --list` check both run inside the shared
  container, so overlapping runs compete for its CPU, disk I/O and connections
  (`max_connections=40`, shared with the live apps).
- The VPS has about 4 GB RAM. One dump and upload at a time keeps memory and
  bandwidth use small while the apps keep serving.
- The script's lock is per app (`/tmp/db-backup-<app>.lock`). It stops a manual
  run racing this app's cron run, but not two different apps running at once;
  only the schedule prevents that.
- Each database is small, so a run takes well under 15 minutes (compare the
  start and finish timestamps in the log). If a run ever gets close to 15
  minutes, widen the gaps instead of letting runs overlap.
- Distinct times keep the logs and S3 timestamps easy to tell apart.

A new app takes the next free slot (02:45, `45 2 * * 0`). Add it to this table
in every app's copy of this file. Cron uses the server's timezone; check it
with `timedatectl` (if it is UTC, 02:00 is 06:00 in the UAE).

## Files

| File | Runs on | Purpose |
| --- | --- | --- |
| `scripts/backup/create-bucket.sh` | Admin laptop, once per app | Creates the bucket (or re-applies settings) and optionally an upload-only IAM user |
| `scripts/backup/db-backup-to-s3.sh` | App server, by cron | Takes and uploads one backup |
| `scripts/backup/install-cron.sh` | App server, once | Runs a test backup, then installs the weekly cron line |

## Configuration

Read from the environment first, then from the app's env file (`.env.local`,
else `.env`, in the app root; override with `BACKUP_ENV_FILE`). The file is
parsed, never executed. Never commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Yes | Key allowed to upload to the bucket |
| `AWS_REGION` | Yes | Bucket region |
| `BACKUP_S3_BUCKET` | Yes (or `AWS_S3_BUCKET_NAME`) | Bucket name |
| `BACKUP_APP_NAME` | No (default `db`) | Prefix in backup file names. Set it to the database name |
| `BACKUP_DB_CONTAINER` | One DB source | Docker container running Postgres; dumps via `docker exec` |
| `BACKUP_DB_NAME` / `BACKUP_DB_USER` | With container | Database and role inside the container |
| `BACKUP_DOCKER_SUDO` | No (default `0`) | `1` runs docker as `sudo -n docker`. Needs the sudoers rule from step 2 |
| `BACKUP_DATABASE_URL` | One DB source | Any reachable Postgres (falls back to `DATABASE_URL`). Prisma-only URL options are stripped. Needs host `pg_dump`/`pg_restore` at or above the server's major version |
| `BACKUP_NOTIFY_URL` | No | URL requested after each successful backup, e.g. a [healthchecks.io](https://healthchecks.io) check, so a missed backup raises an alert |

If `BACKUP_DB_CONTAINER` is set it wins; otherwise the URL is used.

## RSM DMTT values

| Setting | Value |
| --- | --- |
| Bucket | `rsm-dmtt-db-backups` (`us-east-1`) |
| `BACKUP_APP_NAME` | `dmtt_assessments` |
| `BACKUP_DB_CONTAINER` | `rsm-assessments-postgres` (shared; see [`SHARED-INFRA.md`](../SHARED-INFRA.md)) |
| `BACKUP_DB_NAME` / `BACKUP_DB_USER` | `dmtt_assessments` / `rsm` |
| `BACKUP_DOCKER_SUDO` | `1` |
| Schedule | Sunday 02:15 server time (`15 2 * * 0`) |
| Server user / app dir | `RSMae` / `/var/www/rsm-dmtt-assessment` |
| Server env file | `/var/www/rsm-dmtt-assessment/.env` (no `.env.local` on the VPS) |
| Log | `~/logs/db-backup-rsm-dmtt-assessment.log` |
| AWS key | Reuses the app's existing `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` (also used for PDF uploads) |

`.env` already sets `AWS_S3_BUCKET_NAME=dmtt-pdf` for PDF uploads. Always set
`BACKUP_S3_BUCKET`; without it, backups fall back to the PDF bucket, which has
no expiry rule. Do not append a second `AWS_ACCESS_KEY_ID`: Next.js and the
backup script both use the last occurrence of a key.

Only `dmtt_assessments` is dumped; the other databases in the shared container
are backed up by their own apps.

## Setup

### 1. Create the bucket (admin laptop, once)

Already done for this app. Kept for re-applying settings or a new app. Needs the
AWS CLI and an admin-capable key. Bucket names are global across AWS.

```bash
./scripts/backup/create-bucket.sh rsm-dmtt-db-backups --region us-east-1 --env-file .env
```

Add `--uploader-user` to also create IAM user `<bucket>-uploader` that can only
upload to `weekly/` and `latest/`; its key is printed once. Prefer that key on
the server over an admin key. `BACKUP_RETENTION_DAYS` (default `84`) changes
how long `weekly/` copies are kept. Re-running the script is safe.

### 2. Prepare the server (once per VPS, shared by all apps)

As `RSMae`, not root. Skip anything another app's setup already did.

Install the AWS CLI v2 if `aws --version` fails (`uname -m` picks the x86_64 or
aarch64 build):

```bash
sudo apt-get update && sudo apt-get install -y unzip curl
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp && sudo /tmp/aws/install && rm -rf /tmp/aws /tmp/awscliv2.zip
aws --version
```

Docker runs with `sudo` on this VPS. Cron cannot type a password, so allow
`RSMae` to run docker through sudo without one:

```bash
echo "RSMae ALL=(root) NOPASSWD: $(command -v docker)" | sudo tee /etc/sudoers.d/rsm-db-backup
sudo chmod 440 /etc/sudoers.d/rsm-db-backup
sudo visudo -cf /etc/sudoers.d/rsm-db-backup
sudo -n -k docker ps   # must list containers without asking for a password
```

This rule is as powerful as membership of the `docker` group (docker can do
anything as root); it just keeps the "docker uses sudo" convention.

### 3. Add the config to the server's env file

Append to `/var/www/rsm-dmtt-assessment/.env` (mode 600, out of git):

```bash
BACKUP_S3_BUCKET=rsm-dmtt-db-backups
BACKUP_APP_NAME=dmtt_assessments
BACKUP_DB_CONTAINER=rsm-assessments-postgres
BACKUP_DB_NAME=dmtt_assessments
BACKUP_DB_USER=rsm
BACKUP_DOCKER_SUDO=1
```

### 4. Pull and install the cron

```bash
cd /var/www/rsm-dmtt-assessment && git pull
./scripts/backup/install-cron.sh --schedule "15 2 * * 0"
```

It runs one real backup and installs the cron line only if that succeeds.
Re-running replaces this app's line instead of duplicating it, and leaves the
other apps' lines alone. Other options: `--skip-test`, `--remove`.

A manual backup at any time: `./scripts/backup/db-backup-to-s3.sh`.

### 5. Verify

```bash
crontab -l | grep db-backup-to-s3   # one line per app, at 02:00 / 02:15 / 02:30
tail -n 20 ~/logs/db-backup-rsm-dmtt-assessment.log
```

Then check the bucket with the AWS CLI commands below.

## AWS CLI commands

Run these from a laptop. Store the key once in a named profile instead of
exporting it in every shell:

```bash
aws configure --profile rsm-backups   # access key, secret, region us-east-1, output json
export AWS_PROFILE=rsm-backups
aws sts get-caller-identity           # confirms which IAM user the key belongs to
```

Check the bucket settings:

```bash
B=rsm-dmtt-db-backups
aws s3api get-public-access-block --bucket "$B"           # all four should be true
aws s3api get-bucket-versioning --bucket "$B"             # Status: Enabled
aws s3api get-bucket-encryption --bucket "$B"             # AES256
aws s3api get-bucket-lifecycle-configuration --bucket "$B" \
  --query 'Rules[].{id:ID,prefix:Filter.Prefix,days:Expiration.Days}' --output table
```

See the backups:

```bash
aws s3 ls "s3://$B/latest/" --human-readable
aws s3 ls "s3://$B/weekly/" --human-readable
aws s3api head-object --bucket "$B" --key latest/dmtt_assessments.dump \
  --query '{size:ContentLength,modified:LastModified}'
```

All three apps at once (Monday morning check):

```bash
for B in rsm-e-invoicing-db-backups rsm-dmtt-db-backups rsm-uae-cyber-db-backups; do
  echo "== $B"; aws s3 ls "s3://$B/latest/" --human-readable
done
```

Download a backup:

```bash
aws s3 cp "s3://$B/latest/dmtt_assessments.dump" ./dmtt_assessments.dump
aws s3 cp "s3://$B/weekly/dmtt_assessments_<UTC timestamp>.dump" ./dmtt_assessments.dump
```

Get an overwritten or deleted copy back (versioning):

```bash
aws s3api list-object-versions --bucket "$B" --prefix latest/ \
  --query 'Versions[].{id:VersionId,modified:LastModified,current:IsLatest}' --output table
aws s3api get-object --bucket "$B" --key latest/dmtt_assessments.dump \
  --version-id <VersionId> ./dmtt_assessments.dump
```

## Restore

Fetch the dump with a key that can read the bucket (see above), then `scp` it
to the server. An upload-only key cannot download.

### Restore test (do this after setup, then periodically)

Restores into a throwaway container and compares row counts with live. It does
not touch the live database. Run one app's test at a time and remove the
container straight after; the VPS has about 4 GB RAM.

```bash
sudo docker run -d --name restore-test --memory 384m \
  -e POSTGRES_PASSWORD=restore-test postgres:16-alpine
until sudo docker exec restore-test pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sudo docker exec restore-test createdb -U postgres restore_check
sudo docker exec -i restore-test pg_restore -U postgres -d restore_check \
  --no-owner --no-privileges < dmtt_assessments.dump
sudo docker exec restore-test psql -U postgres -d restore_check -c 'SELECT count(*) FROM "AssessmentSubmission";'
sudo docker exec rsm-assessments-postgres psql -U rsm -d dmtt_assessments -c 'SELECT count(*) FROM "AssessmentSubmission";'
sudo docker rm -f restore-test && rm dmtt_assessments.dump
```

The counts should match, allowing for submissions received since the backup.

### Real restore (disaster recovery)

This overwrites live data. Take a fresh dump of the current state first if the
database is still reachable. It only touches `dmtt_assessments`; stop only this
app's PM2 process, and do not stop or recreate the shared container.

```bash
pm2 stop rsm-dmtt
sudo docker exec -i rsm-assessments-postgres pg_restore -U rsm -d dmtt_assessments \
  --clean --if-exists --no-owner < dmtt_assessments.dump
pm2 start rsm-dmtt
```

On a brand-new server, start the shared Postgres from the e-invoicing app's
`docker-compose.yml` first (`cd /var/www/RSM-assessment-e-invoicing && sudo docker-compose up -d`),
create the database (`CREATE DATABASE dmtt_assessments OWNER rsm;`, see
[`DEPLOY.md`](../DEPLOY.md) step 4), then run the same `pg_restore`.
Never run `docker-compose down -v`: the volume holds every app's database.

## Reusing for another app

1. Copy `scripts/backup/` and this file into the app's repo.
2. Run `create-bucket.sh` for a new bucket named `rsm-<app>-db-backups`.
3. Take the next slot in the [shared schedule](#shared-schedule-all-assessment-apps-on-this-vps)
   and add the app to that table in every app's copy.
4. Set that app's values in its server `.env` (step 3) and run
   `install-cron.sh --schedule "<slot>"` as `RSMae`.

One bucket per app keeps each client's backups isolated.

## Notes

- Dumps contain private data (submitter names, emails, phone numbers, company
  details, answers). Keep buckets private and decide retention with the data
  owner.
- Buckets: Block Public Access, SSE-S3 encryption, versioning,
  BucketOwnerEnforced, HTTPS-only policy.
- The buckets were created without `--uploader-user`. All three apps use keys of
  the IAM user `RSM-e-invoicing`, which can read and delete objects in every
  backup bucket. Switch each app to its own upload-only key when an IAM-capable
  admin key is available.
- Cron does not alert on failure by itself. Set `BACKUP_NOTIFY_URL` or check
  the log.
