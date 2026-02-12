#!/bin/sh
set -e

# Run database migrations (creates the DB if it doesn't exist)
# Invoke prisma CLI directly to avoid npx downloading a newer incompatible version
node ./node_modules/prisma/build/index.js migrate deploy

# Seed the database only if it's empty (first run)
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.user.count().then(c => {
    if (c === 0) {
      console.log('Empty database detected — seeding...');
      require('child_process').execSync('node prisma/seed.cjs', { stdio: 'inherit' });
    } else {
      console.log('Database already has data — skipping seed.');
    }
    p.\$disconnect();
  });
"

# Start Next.js
exec node server.js
