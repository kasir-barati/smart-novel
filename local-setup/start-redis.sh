#!/bin/sh
set -e

# README: 👇 exec is used to prevent the shell from spawning a child process, which allows Redis to receive signals directly (e.g., for graceful shutdown).
exec redis-server \
     --maxmemory "${REDIS_MAXMEMORY:-512mb}" \
     --maxmemory-policy "${REDIS_MAXMEMORY_POLICY:-allkeys-lfu}" \
     ${REDIS_PASSWORD:+--requirepass "$REDIS_PASSWORD"}
