#!/bin/sh
set -e

cd /app/backend
export PATH="/app/node_modules/.bin:/app/backend/node_modules/.bin:$PATH"

echo "Running database migrations..."
prisma migrate deploy

echo "Seeding database (if needed)..."
npx tsx prisma/seed.ts || true

echo "Starting backend on port ${PORT:-3001}..."
node dist/index.js &

echo "Starting nginx on port 80..."
exec nginx -g 'daemon off;'
