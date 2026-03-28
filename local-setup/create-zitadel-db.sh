#!/bin/sh
set -e

psql -h postgres -U "$PGUSER" -tc "SELECT 1 FROM pg_roles WHERE rolname='zitadel'" | grep -q 1 \
  || psql -h postgres -U "$PGUSER" -c "CREATE ROLE zitadel LOGIN PASSWORD 'zitadel';"

psql -h postgres -U "$PGUSER" -tc "SELECT 1 FROM pg_database WHERE datname='zitadel'" | grep -q 1 \
  || psql -h postgres -U "$PGUSER" -c "CREATE DATABASE zitadel OWNER zitadel;"

echo "ZITADEL database ready!"
