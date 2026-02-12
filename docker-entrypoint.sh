#!/bin/sh
set -e

# Run database migrations (creates the DB if it doesn't exist)
npx prisma migrate deploy

# Seed the database only if it's empty (first run)
node -e "
  const { PrismaClient } = require('.prisma/client');
  const p = new PrismaClient();
  p.user.count().then(c => {
    if (c === 0) {
      console.log('Empty database detected — seeding...');
      require('child_process').execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    } else {
      console.log('Database already has data — skipping seed.');
    }
    p.\$disconnect();
  });
"

# Start Next.js
exec node server.js
