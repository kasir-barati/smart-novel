#!/bin/sh
# Read the dynamically-generated OIDC client ID from the shared volume and replace the build-time placeholder in the JS bundle, then start nginx.

set -e

if [ -f "${ZITADEL_CLIENT_ID_FILE}" ]; then
  export VITE_OIDC_CLIENT_ID=$(cat "${ZITADEL_CLIENT_ID_FILE}" | tr -d '[:space:]')
  echo "✓ VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID (from ${ZITADEL_CLIENT_ID_FILE})"
else
  echo "⚠ ${ZITADEL_CLIENT_ID_FILE} not found — OIDC login will not work"
fi

exec npx nx serve frontend --host=0.0.0.0
