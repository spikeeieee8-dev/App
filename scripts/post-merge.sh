#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
NODE_ENV=development pnpm --filter @workspace/api-server exec tsx ./src/lib/seed.ts
