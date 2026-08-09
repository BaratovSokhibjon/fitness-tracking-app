# Deployment

## Docker Setup

Multi-container setup: Next.js web app (port 3000), Hono REST API (port 4000), and MySQL.

### Files

**`Dockerfile`** — web app (Next standalone output)

**`Dockerfile.api`** — Hono REST API (same dependency tree as web; runs its own `prisma generate`)

**`docker-compose.yml`**

```yaml
services:
  migrate:
    build:
      context: .
      dockerfile: Dockerfile.api
    command: sh -c "npx prisma migrate deploy && npx prisma db seed"
    env_file:
      - .env
    environment:
      DATABASE_URL: "mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/${MYSQL_DATABASE}"
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      DATABASE_URL: "mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/${MYSQL_DATABASE}"
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    volumes:
      - uploads_data:/app/public/uploads

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "4000:4000"
    env_file:
      - .env
    environment:
      DATABASE_URL: "mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/${MYSQL_DATABASE}"
      TZ: Asia/Seoul
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    restart: unless-stopped

  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
  uploads_data:
```

### Environment

**`.env.example`**

```bash
# DATABASE_URL is overridden per-service in compose (db:3306, not localhost)
# so the same .env works for both host-based dev and containerized runs.
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=fitness
MYSQL_USER=fitness
MYSQL_PASSWORD=fitnesspass

# Mobile auth — the seeded default user (also used by the web app seed).
SEED_EMAIL=admin@somatix.local
SEED_PASSWORD=somatix-dev-password

# Optional — Expo push service access token (notifications).
# EXPO_ACCESS_TOKEN=

UPLOAD_DIR=/app/public/uploads
```

> **Note:** `DATABASE_URL` is deliberately NOT in `.env` for containerized runs — compose
> rewrites it per-service to point at the `db` host. Keep a `DATABASE_URL` in `.env`
> only if you also run Prisma on the host (e.g. `npm run db:migrate` for dev).
> `TZ: Asia/Seoul` on the api service is required — the reminder cron fires at the
> container's local time, and containers default to UTC (05:00 would become 14:00 KST).

### Commands

```bash
# First time setup
cp .env.example .env

# Migrations + seed run automatically via the one-shot `migrate` service on
# `docker compose up` — no manual `prisma migrate deploy` needed.

# Start full stack
docker compose up -d --build

# Migrate/seed only (e.g. after pulling new migrations)
docker compose up migrate

# Check health
curl localhost:4000/health

# API auth smoke test (against seeded user)
curl -u "$SEED_EMAIL:$SEED_PASSWORD" localhost:4000/auth/verify

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Wipe all data (recreates volumes; migrate+seed re-run on next up)
docker compose down -v
```

### `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

module.exports = nextConfig;
```
